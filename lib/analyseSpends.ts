import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";

const SYSTEM_PROMPT = `You rewrite lines from a trip expense file. Each line says who paid how much for what.

Rewrite every line as exactly: Name - amount - item

Rules:
- Name: exactly as written in the line, same spelling and letter case. Use "missing" if the line has no name.
- amount: a whole number with no currency symbol, commas or decimals. Use "missing" if the line has no amount. Use "invalid" if the amount is there but is not a number (for example "abc").
- item: what was paid for, in lowercase. Use "missing" if the line has no item.
- Words like fuel, cab, taxi, dinner, food, hotel, drinks and snacks are items, never names.
- Lines can come in different formats, for example "Name - 200 - food", "Name paid 200 for food" or "Name 200".
- Return one output line per input line, in the same order. Do not add, merge, skip or explain lines.`;

const Output = z.object({
  lines: z.array(z.string()),
});

/** The non-empty lines of a spend file, trimmed. */
export function spendLines(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

/** What one Claude call used and how long it took. No prompt or response text. */
export type AiCall = {
  model: string;
  input_tokens: number | null;
  output_tokens: number | null;
  latency_ms: number;
  success: boolean;
  error_type: "timeout" | "rate_limit" | "api_error" | null;
};

/** The rewritten lines plus one usage record per Claude call made (retries included). */
export type AnalyseResult = { lines: string[]; calls: AiCall[] };

/** Thrown when the spends could not be read; still carries the Claude calls made. */
export class AnalyseSpendsError extends Error {
  constructor(message: string, readonly calls: AiCall[]) {
    super(message);
  }
}

// Same as the SDK default: the first try plus 2 retries.
const MAX_ATTEMPTS = 3;

const errorType = (err: unknown): AiCall["error_type"] => {
  if (err instanceof Anthropic.APIConnectionTimeoutError) return "timeout";
  if (err instanceof Anthropic.RateLimitError) return "rate_limit";
  return "api_error";
};

const isRetryable = (err: unknown) =>
  err instanceof Anthropic.APIConnectionError ||
  (err instanceof Anthropic.APIError &&
    (err.status === 408 || err.status === 409 || err.status === 429 || (err.status ?? 0) >= 500));

const retryDelayMs = (err: unknown, attempt: number) => {
  const header = err instanceof Anthropic.APIError ? err.headers?.get("retry-after") : null;
  const seconds = header ? Number(header) : NaN;
  return Number.isFinite(seconds) ? Math.min(seconds * 1000, 10_000) : 500 * 2 ** attempt;
};

/**
 * Sends every spend line to Claude at once and returns each one rewritten
 * as "Name - amount - item" (same count and order as the input lines),
 * plus the token usage and latency of every Claude call made.
 * Server only: uses ANTHROPIC_API_KEY.
 */
export async function analyseSpends(text: string): Promise<AnalyseResult> {
  const input = spendLines(text);
  if (input.length === 0) return { lines: [], calls: [] };

  const model = process.env.ANTHROPIC_MODEL || "claude-opus-5-5";
  // Retries happen here instead of inside the SDK so every Claude call is recorded.
  const client = new Anthropic({ maxRetries: 0 });
  const calls: AiCall[] = [];

  for (let attempt = 0; ; attempt++) {
    const started = performance.now();
    let response;
    try {
      response = await client.messages.parse({
        model,
        max_tokens: 16000,
        system: SYSTEM_PROMPT,
        output_config: {
          effort: "low",
          format: zodOutputFormat(Output),
        },
        messages: [
          {
            role: "user",
            content: `Rewrite these ${input.length} lines:\n\n${input.join("\n")}`,
          },
        ],
      });
    } catch (err) {
      calls.push({
        model,
        input_tokens: null,
        output_tokens: null,
        latency_ms: Math.round(performance.now() - started),
        success: false,
        error_type: errorType(err),
      });
      if (attempt + 1 < MAX_ATTEMPTS && isRetryable(err)) {
        await new Promise((resolve) => setTimeout(resolve, retryDelayMs(err, attempt)));
        continue;
      }
      throw new AnalyseSpendsError(err instanceof Error ? err.message : "Unknown error", calls);
    }

    const call: AiCall = {
      model: response.model || model,
      input_tokens: response.usage?.input_tokens ?? null,
      output_tokens: response.usage?.output_tokens ?? null,
      latency_ms: Math.round(performance.now() - started),
      success: true,
      error_type: null,
    };
    calls.push(call);

    const fail = (message: string) => {
      call.success = false;
      call.error_type = "api_error";
      return new AnalyseSpendsError(message, calls);
    };
    if (response.stop_reason === "refusal") {
      throw fail("Claude could not read the spend details.");
    }
    const lines = response.parsed_output?.lines.map((line) => line.trim());
    if (!lines || lines.length !== input.length) {
      throw fail("Claude did not return one line for each spend.");
    }
    return { lines, calls };
  }
}
