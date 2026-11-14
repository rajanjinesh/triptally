"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ButtonWithInfo, Label, Page, inputClass } from "./components/ui";

const TRIP_TYPES = ["Only Friends", "With Friends & Families"] as const;
type TripType = (typeof TRIP_TYPES)[number];
type Friend = { name: string; email: string };

export default function TripSetupPage() {
  const router = useRouter();
  const [tripName, setTripName] = useState("");
  const [tripType, setTripType] = useState<TripType>("Only Friends");
  const [friends, setFriends] = useState<Friend[]>([
    { name: "", email: "" },
    { name: "", email: "" },
    { name: "", email: "" },
  ]);

  const updateFriend = (index: number, field: keyof Friend, value: string) =>
    setFriends((rows) => rows.map((row, i) => (i === index ? { ...row, [field]: value } : row)));

  return (
    <Page>
      <h1 className="w-full text-[24px] leading-[1.2] font-semibold text-ink">TripTally</h1>

      <div className="flex w-full flex-col gap-6">
        {/* Trip name */}
        <div className="flex w-full flex-col gap-2">
          <Label info="Give your trip a name so you can recognise it later.">
            <label htmlFor="trip-name">Trip name</label>
          </Label>
          <input
            id="trip-name"
            className={inputClass}
            placeholder="e.g. Goa Trip"
            value={tripName}
            onChange={(e) => setTripName(e.target.value)}
          />
        </div>

        {/* Trip type */}
        <div className="flex w-full flex-col gap-2">
          <Label info="Choose who is on this trip. This helps label your trip summary.">Trip type</Label>
          <div role="radiogroup" aria-label="Trip type" className="flex h-12 w-full items-center gap-8 text-[14px] leading-[1.5]">
            {TRIP_TYPES.map((type) => {
              const selected = tripType === type;
              return (
                <button
                  key={type}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => setTripType(type)}
                  className={`flex cursor-pointer items-center gap-2 whitespace-nowrap ${selected ? "text-accent" : "text-ink"}`}
                >
                  <span aria-hidden className="flex size-[11px] items-center justify-center rounded-full border-[1.5px] border-current">
                    {selected && <span className="size-[5px] rounded-full bg-current" />}
                  </span>
                  {type}
                </button>
              );
            })}
          </div>
        </div>

        {/* Friends on this trip */}
        <div className="flex w-full flex-col gap-2">
          <Label info="Enter the name and email of each friend on this trip. They'll get the settlement by email.">
            Friends on this trip
          </Label>
          <div className="flex w-full flex-col gap-3">
            {friends.map((friend, i) => (
              <div key={i} className="flex w-full gap-3">
                <input
                  aria-label={`Friend ${i + 1} name`}
                  className={inputClass}
                  placeholder={`Friend ${i + 1} name`}
                  value={friend.name}
                  onChange={(e) => updateFriend(i, "name", e.target.value)}
                />
                <input
                  type="email"
                  aria-label={`Friend ${i + 1} email`}
                  className={inputClass}
                  placeholder={`friend${i + 1}@email.com`}
                  value={friend.email}
                  onChange={(e) => updateFriend(i, "email", e.target.value)}
                />
              </div>
            ))}
          </div>
          <Label
            info="Add another friend who was on this trip."
            className="text-[14px] font-medium"
          >
            <button
              type="button"
              className="cursor-pointer text-accent"
              onClick={() => setFriends((rows) => [...rows, { name: "", email: "" }])}
            >
              + Add friend
            </button>
          </Label>
        </div>

        <ButtonWithInfo info="Go to the next step to upload your spend details." onClick={() => router.push("/upload")}>
          Continue
        </ButtonWithInfo>
      </div>
    </Page>
  );
}
