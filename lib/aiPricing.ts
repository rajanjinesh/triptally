/**
 * Anthropic list prices in USD per million tokens, by exact model id.
 * Source: https://platform.claude.com/docs/en/about-claude/pricing (checked 2026-11-16).
 * Update here when prices change. A model missing from this list gets no cost estimate.
 */
export const AI_PRICES_PER_MTOK: Record<string, { input: number; output: number }> = {
  "claude-opus-5-5": { input: 4, output: 20 },
};

export type AiCost = {
  price_input_per_mtok: number | null;
  price_output_per_mtok: number | null;
  estimated_input_cost_usd: number | null;
  estimated_output_cost_usd: number | null;
  estimated_total_cost_usd: number | null;
};

/** Estimated cost of one Claude call. These are estimates, not billed amounts. */
export function estimateCost(model: string, inputTokens: number | null, outputTokens: number | null): AiCost {
  const price = AI_PRICES_PER_MTOK[model];
  const input = price && inputTokens !== null ? (inputTokens * price.input) / 1_000_000 : null;
  const output = price && outputTokens !== null ? (outputTokens * price.output) / 1_000_000 : null;
  return {
    price_input_per_mtok: price?.input ?? null,
    price_output_per_mtok: price?.output ?? null,
    estimated_input_cost_usd: input,
    estimated_output_cost_usd: output,
    estimated_total_cost_usd: input !== null && output !== null ? input + output : null,
  };
}
