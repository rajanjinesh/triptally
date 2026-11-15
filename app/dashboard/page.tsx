"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ButtonWithInfo, ErrorText, Info, Page } from "../components/ui";
import { formatRupees, tripTypeLabel } from "@/lib/split";
import { readSession, type TripSession } from "@/lib/trip";
import { track } from "@/lib/analytics";
import posthog from "posthog-js";

function SectionTitle({ children, info }: { children: string; info: string }) {
  return (
    <div className="flex w-full items-center gap-2 leading-[1.5] whitespace-nowrap">
      <h2 className="text-[18px] font-semibold text-ink">{children}</h2>
      <Info text={info} />
    </div>
  );
}

const card = "w-full overflow-hidden rounded-[12px] border border-line bg-white shadow-[0_4px_12px_0_rgba(0,0,0,0.04)]";
const headCell = "px-4 text-[13px] leading-[1.5] font-semibold uppercase text-muted";

export default function DashboardPage() {
  const router = useRouter();
  const [session, setSession] = useState<TripSession | null>(null);
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState("");

  useEffect(() => {
    const saved = readSession();
    if (!saved?.split || !saved.trip) router.replace("/upload");
    else setSession(saved);
  }, [router]);

  // Show Approve & notify only once the approve-notify flag has loaded and is on.
  const [approveEnabled, setApproveEnabled] = useState(false);
  useEffect(
    () => posthog.onFeatureFlags(() => setApproveEnabled(posthog.isFeatureEnabled("approve-notify") === true)),
    [],
  );

  if (!session?.split || !session.trip) return null;
  const { trip, split } = session;

  const approve = async () => {
    setState("sending");
    setError("");
    track("approve_notify_clicked", {
      trip_id: session.tripId,
      friends_count: split.people,
      total_amount: split.total,
      share_amount: split.shareEach,
      settlements_count: split.payments.length,
    });
    try {
      const res = await fetch("/api/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tripId: session.tripId, split }),
      });
      const data = await res.json();
      if (data.saved) {
        for (const p of split.payments) track("settlement_created", { trip_id: session.tripId, amount: p.amount });
      }
      if (!res.ok) throw new Error(data.error ?? "Could not send the notification.");
      setState("sent");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send the notification.");
      setState("idle");
    }
  };

  return (
    <Page gap="gap-6">
      <header className="flex w-full flex-col gap-3">
        <h1 className="text-[24px] leading-[1.5] font-semibold text-ink">
          {trip.name} · {tripTypeLabel(trip.tripType)}
        </h1>
        <div className="h-px w-full bg-divider" />
      </header>

      {/* Table 1 – Summary */}
      <SectionTitle info="Total trip cost, number of people, and what each person's equal share is.">Summary</SectionTitle>
      <div className={card}>
        <div className="grid h-11 grid-cols-3 border-b border-line bg-header">
          {["Total cost", "People", "Share each"].map((label, i) => (
            <div key={label} className={`flex items-center justify-center text-center ${headCell} ${i < 2 ? "border-r border-line" : ""}`}>
              {label}
            </div>
          ))}
        </div>
        <div className="grid h-16 grid-cols-3">
          {[formatRupees(split.total), String(split.people), formatRupees(split.shareEach)].map((value, i) => (
            <div
              key={i}
              className={`flex items-center justify-center text-center text-[22px] leading-[1.5] font-semibold text-ink tabular-nums ${i < 2 ? "border-r border-line" : ""}`}
            >
              {value}
            </div>
          ))}
        </div>
      </div>

      {/* Table 2 – Who pays whom */}
      <section className="flex w-full flex-col gap-4">
        <SectionTitle info="The fewest payments needed to settle everyone up.">Who pays whom</SectionTitle>
        <div className={card}>
          <table className="w-full table-fixed border-collapse">
            <colgroup>
              <col className="w-[40%]" />
              <col className="w-[40%]" />
              <col className="w-[20%]" />
            </colgroup>
            <thead>
              <tr className="h-11 border-b border-line-soft bg-header">
                <th className={`border-r border-line text-left ${headCell}`}>Who pays</th>
                <th className={`border-r border-line text-left ${headCell}`}>To whom</th>
                <th className={`text-right ${headCell}`}>Amount</th>
              </tr>
            </thead>
            <tbody className="text-[15px] leading-[1.5] text-ink">
              {split.payments.map((p, i) => (
                <tr key={i} className={`h-[52px] border-b border-line-soft ${i % 2 === 1 ? "bg-stripe" : "bg-white"}`}>
                  <td className="px-4">{p.payer}</td>
                  <td className="px-4">{p.payee}</td>
                  <td className="px-4 text-right tabular-nums">{formatRupees(p.amount)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="h-[52px] border-t-2 border-line bg-total text-[15px] leading-[1.5] font-bold text-ink">
                <td colSpan={2} className="px-4">Total settled</td>
                <td className="px-4 text-right tabular-nums">{formatRupees(split.totalSettled)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </section>

      <div className="flex w-full flex-col items-end gap-2">
        {approveEnabled && (
          <ButtonWithInfo
            className="border-0"
            info="Approve this split, save it, and email each friend what they owe and to whom."
            onClick={approve}
            disabled={state !== "idle"}
          >
            Approve &amp; notify
          </ButtonWithInfo>
        )}
        {state === "sent" && (
          <p role="status" className="text-[13px] leading-[1.5] font-medium text-accent">
            Notification sent
          </p>
        )}
        {error && <ErrorText>{error}</ErrorText>}
      </div>
    </Page>
  );
}
