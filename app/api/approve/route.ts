import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { formatRupees, type Split } from "@/lib/split";
import { supabase } from "@/lib/supabase";

const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function whoPaysWhomTable(split: Split) {
  const cell = "padding:12px 16px;font-size:15px;color:#111827;border-bottom:1px solid #F1F5F9;";
  const head =
    "padding:12px 16px;font-size:13px;font-weight:600;text-transform:uppercase;color:#6B7280;background:#F9FAFB;border-bottom:1px solid #F1F5F9;";
  const rows = split.payments
    .map(
      (p, i) =>
        `<tr style="background:${i % 2 === 1 ? "#FAFAFA" : "#FFFFFF"};">` +
        `<td style="${cell}">${escapeHtml(p.payer)}</td>` +
        `<td style="${cell}">${escapeHtml(p.payee)}</td>` +
        `<td style="${cell}text-align:right;">${formatRupees(p.amount)}</td></tr>`,
    )
    .join("");
  const total =
    `<tr style="background:#F3F4F6;">` +
    `<td colspan="2" style="padding:12px 16px;font-size:15px;font-weight:700;color:#111827;border-top:2px solid #E5E7EB;">Total settled</td>` +
    `<td style="padding:12px 16px;font-size:15px;font-weight:700;color:#111827;border-top:2px solid #E5E7EB;text-align:right;">${formatRupees(split.totalSettled)}</td></tr>`;

  return (
    `<table cellpadding="0" cellspacing="0" style="width:100%;max-width:640px;border-collapse:collapse;border:1px solid #E5E7EB;font-family:Inter,Arial,sans-serif;">` +
    `<tr><th style="${head}text-align:left;width:40%;">Who pays</th><th style="${head}text-align:left;width:40%;">To whom</th><th style="${head}text-align:right;width:20%;">Amount</th></tr>` +
    rows +
    total +
    `</table>`
  );
}

/** Saves the approved split to settlements and emails it to every friend on the trip. */
export async function POST(request: Request) {
  const { tripId, split } = (await request.json()) as { tripId?: string; split?: Split };
  if (!tripId || !split) return NextResponse.json({ error: "Nothing to approve. Upload the spend details first." }, { status: 400 });

  const db = supabase();
  const [{ data: trip }, { data: friends }] = await Promise.all([
    db.from("trips").select("name").eq("id", tripId).single(),
    db.from("friends").select("name, email").eq("trip_id", tripId),
  ]);
  if (!trip || !friends?.length) return NextResponse.json({ error: "Could not load this trip." }, { status: 404 });

  if (split.payments.length > 0) {
    const { error } = await db
      .from("settlements")
      .insert(split.payments.map((p) => ({ trip_id: tripId, payer: p.payer, payee: p.payee, amount: p.amount })));
    if (error) return NextResponse.json({ error: `Could not save the split: ${error.message}` }, { status: 500 });
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD },
  });
  const subject = `${trip.name} – your TripTally split`;
  const table = whoPaysWhomTable(split);

  try {
    await Promise.all(
      friends.map((f) =>
        transporter.sendMail({
          from: process.env.GMAIL_USER,
          to: f.email,
          subject,
          html:
            `<div style="font-family:Inter,Arial,sans-serif;color:#111827;">` +
            `<p style="font-size:15px;margin:0 0 16px;">Hi ${escapeHtml(f.name)}, here is who pays whom for ${escapeHtml(trip.name)}.</p>` +
            table +
            `</div>`,
        }),
      ),
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: `Split saved, but the emails could not be sent: ${message}`, saved: true }, { status: 502 });
  }

  return NextResponse.json({ sent: friends.length, saved: true });
}
