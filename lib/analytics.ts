import posthog from "posthog-js";

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
};

export function track<E extends keyof Events>(event: E, properties: Events[E]) {
  try {
    posthog.capture(event, properties);
  } catch {
    // Analytics must never break the app.
  }
}

export const countLines = (text: string) => text.split(/\r?\n/).filter((line) => line.trim()).length;
