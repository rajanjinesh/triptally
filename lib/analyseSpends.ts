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

/**
 * Sends every spend line to Claude at once and returns each one rewritten
 * as "Name - amount - item" (same count and order as the input lines).
 * Server only: uses ANTHROPIC_API_KEY.
 */
export async function analyseSpends(text: string): Promise<string[]> {
  const input = spendLines(text);
  if (input.length === 0) return [];

  const client = new Anthropic();
  const response = await client.messages.parse({
    model: process.env.ANTHROPIC_MODEL || "claude-opus-5-5",
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

  if (response.stop_reason === "refusal") {
    throw new Error("Claude could not read the spend details.");
  }
  const lines = response.parsed_output?.lines.map((line) => line.trim());
  if (!lines || lines.length !== input.length) {
    throw new Error("Claude did not return one line for each spend.");
  }
  return lines;
}
