import { Eval, initDataset, initFunction } from "braintrust";
import { analyseSpends } from "@/lib/analyseSpends";

const PROJECT_NAME = "TripTally";
const DATASET_NAME = "spend-test-cases";
const SCORER_NAME = "spend-line-judge";

export type EvalSummary = {
  experimentUrl?: string;
  total: number;
  passed: number;
  failed: number;
  score: number;
};

/**
 * Runs analyseSpends on every row of the Braintrust dataset (all rows in parallel),
 * scores each output with the spend-line-judge scorer and records it as a new experiment.
 * Server only: uses BRAINTRUST_API_KEY and ANTHROPIC_API_KEY.
 */
export async function runEval(): Promise<EvalSummary> {
  const result = await Eval<string, string, string>(PROJECT_NAME, {
    experimentName: `analyseSpends ${new Date().toISOString()}`,
    data: initDataset(PROJECT_NAME, { dataset: DATASET_NAME }),
    // Each row's input is a list of spends with only one line; keep the one line returned.
    task: async (input) => {
      const [line] = (await analyseSpends(input)).lines;
      return line ?? "";
    },
    scores: [initFunction({ projectName: PROJECT_NAME, slug: SCORER_NAME })],
    // No maxConcurrency: every row runs at the same time.
  });

  const rowScores = result.results.map((r) => {
    const value = Object.values(r.scores ?? {})[0];
    return typeof value === "number" ? value : 0;
  });
  const passed = rowScores.filter((s) => s >= 1).length;
  const total = rowScores.length;

  return {
    experimentUrl: result.summary.experimentUrl,
    total,
    passed,
    failed: total - passed,
    score: total ? passed / total : 0,
  };
}
