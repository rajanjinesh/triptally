import { NextResponse } from "next/server";
import { runEval } from "@/lib/eval";

// Rows run in parallel, so a run takes about as long as one Claude call plus scoring.
export const maxDuration = 300;

/** Runs the Braintrust evaluation of analyseSpends and records it as a new experiment. */
export async function POST() {
  try {
    const summary = await runEval();
    console.log(`Evaluation: ${summary.passed}/${summary.total} passed (score ${summary.score})`);
    return NextResponse.json(summary);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Evaluation failed:", message);
    return NextResponse.json({ error: `Evaluation failed: ${message}` }, { status: 500 });
  }
}
