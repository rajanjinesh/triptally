import posthog from "posthog-js";
import type { AiCall } from "./analyseSpends";
import { estimateCost, type AiCost } from "./aiPricing";

/** PostHog events TripTally sends. No names or emails go in any event. */
type Events = {
  trip_created: { trip_id: string; trip_type: string; friends_count: number };
  evaluate_clicked: { trip_id: string | null; file_uploaded: boolean; lines_count: number };
  approve_notify_clicked: {
    trip_id: string;
    friends_count: number;
    total_amount: number;
    share_amount: number;
    settlements_count: number;
  };
  settlement_created: { trip_id: string; amount: number };
  ai_spends_analysed: {
    trip_id: string;
    provider: "anthropic";
    model: string;
    input_tokens: number | null;
    output_tokens: number | null;
    total_tokens: number | null;
    latency_ms: number;
    total_wait_ms: number;
    lines_count: number;
    success: boolean;
    error_type?: "timeout" | "rate_limit" | "api_error";
  } & AiCost;
};

/** Sends one ai_spends_analysed event per Claude call. Only counts, timings and costs. */
export function trackAiCalls(calls: unknown, tripId: string, linesCount: number, totalWaitMs: number) {
  try {
    if (!Array.isArray(calls)) return;
    for (const call of calls as AiCall[]) {
      const tokens = call.input_tokens !== null && call.output_tokens !== null;
      track("ai_spends_analysed", {
        trip_id: tripId,
        provider: "anthropic",
        model: call.model,
        input_tokens: call.input_tokens,
        output_tokens: call.output_tokens,
        total_tokens: tokens ? call.input_tokens! + call.output_tokens! : null,
        latency_ms: call.latency_ms,
        total_wait_ms: totalWaitMs,
        ...estimateCost(call.model, call.input_tokens, call.output_tokens),
        lines_count: linesCount,
        success: call.success,
        ...(!call.success && call.error_type ? { error_type: call.error_type } : {}),
      });
    }
  } catch {
    // Analytics must never break the app.
  }
}

export function track<E extends keyof Events>(event: E, properties: Events[E]) {
  try {
    posthog.capture(event, properties);
  } catch {
    // Analytics must never break the app.
  }
}

export const countLines = (text: string) => text.split(/\r?\n/).filter((line) => line.trim()).length;
