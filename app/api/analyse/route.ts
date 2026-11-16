import { NextResponse } from "next/server";
import { analyseSpends, AnalyseSpendsError, spendLines, type AiCall } from "@/lib/analyseSpends";
import { calculateSplit, checkLines } from "@/lib/split";
import { supabase } from "@/lib/supabase";

/**
 * Reads the uploaded spend file for a trip: Claude rewrites the lines,
 * then the code checks them against the trip's friends and calculates the split.
 * Nothing is saved here.
 */
export async function POST(request: Request) {
  const { tripId, text } = (await request.json()) as { tripId?: string; text?: string };
  if (!tripId) return NextResponse.json({ error: "Trip not found. Start again from trip setup." }, { status: 400 });
  if (!text || spendLines(text).length === 0) {
    return NextResponse.json({ error: "The file is empty or could not be read." }, { status: 400 });
  }

  const db = supabase();
  const [{ data: trip, error: tripError }, { data: friends, error: friendsError }] = await Promise.all([
    db.from("trips").select("name, trip_type").eq("id", tripId).single(),
    db.from("friends").select("name").eq("trip_id", tripId),
  ]);
  if (tripError || !trip || friendsError || !friends?.length) {
    return NextResponse.json({ error: "Could not load this trip's friends. Start again from trip setup." }, { status: 404 });
  }

  let rewritten: string[];
  let aiCalls: AiCall[];
  try {
    ({ lines: rewritten, calls: aiCalls } = await analyseSpends(text));
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    const calls = err instanceof AnalyseSpendsError ? err.calls : [];
    return NextResponse.json({ error: `Could not read the spend details: ${message}`, aiCalls: calls }, { status: 502 });
  }

  const friendNames = friends.map((f) => f.name as string);
  const { spends, wrong } = checkLines(spendLines(text), rewritten, friendNames);
  const tripInfo = { name: trip.name as string, tripType: trip.trip_type as string };

  if (wrong.length > 0) return NextResponse.json({ trip: tripInfo, wrong, aiCalls });
  return NextResponse.json({ trip: tripInfo, split: calculateSplit(spends, friendNames), aiCalls });
}
