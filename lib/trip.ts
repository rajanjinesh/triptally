import type { Split } from "./split";

export const TRIP_TYPES = ["Only Friends", "With Friends & Families"] as const;
export type TripType = (typeof TRIP_TYPES)[number];

export const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

/** What the browser keeps in sessionStorage between /, /upload and /dashboard. */
export type TripSession = {
  tripId: string;
  trip?: { name: string; tripType: string };
  split?: Split;
};

const KEY = "triptally";

export function readSession(): TripSession | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as TripSession) : null;
  } catch {
    return null;
  }
}

export function writeSession(session: TripSession) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(session));
  } catch {
    // Storage unavailable: the flow still works within this page.
  }
}
