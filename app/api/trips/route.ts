import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { isValidEmail, TRIP_TYPES } from "@/lib/trip";

type Body = { name?: string; tripType?: string; friends?: { name?: string; email?: string }[] };

/** Saves a new trip and its friends. Returns the trip id. */
export async function POST(request: Request) {
  const body = (await request.json()) as Body;
  const name = body.name?.trim() ?? "";
  const tripType = body.tripType ?? "";
  const friends = (body.friends ?? []).map((f) => ({ name: f.name?.trim() ?? "", email: f.email?.trim() ?? "" }));

  const valid =
    name &&
    (TRIP_TYPES as readonly string[]).includes(tripType) &&
    friends.length > 0 &&
    friends.every((f) => f.name && isValidEmail(f.email));
  if (!valid) {
    return NextResponse.json({ error: "Please fill in every field with a valid email." }, { status: 400 });
  }

  const db = supabase();
  const { data: trip, error: tripError } = await db
    .from("trips")
    .insert({ name, trip_type: tripType })
    .select("id")
    .single();
  if (tripError || !trip) {
    return NextResponse.json({ error: `Could not save the trip: ${tripError?.message}` }, { status: 500 });
  }

  const { error: friendsError } = await db
    .from("friends")
    .insert(friends.map((f) => ({ trip_id: trip.id, name: f.name, email: f.email })));
  if (friendsError) {
    return NextResponse.json({ error: `Could not save the friends: ${friendsError.message}` }, { status: 500 });
  }

  return NextResponse.json({ tripId: trip.id });
}
