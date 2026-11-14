export type Payment = { payer: string; payee: string; amount: number };
export type Split = { total: number; people: number; shareEach: number; payments: Payment[]; totalSettled: number };
export type WrongLine = { line: string; rewritten: string; reason: string };
export type Spend = { name: string; amount: number; item: string };

/**
 * Checks Claude's rewritten lines ("Name - amount - item") against the trip's friends.
 * Returns the valid spends (names matched to the friend's saved name) and every wrong line.
 */
export function checkLines(original: string[], rewritten: string[], friendNames: string[]) {
  const byLowerName = new Map(friendNames.map((name) => [name.trim().toLowerCase(), name]));
  const spends: Spend[] = [];
  const wrong: WrongLine[] = [];

  rewritten.forEach((line, i) => {
    const [rawName = "", rawAmount = "", ...rest] = line.split(" - ").map((part) => part.trim());
    const item = rest.join(" - ");
    const reasons: string[] = [];

    const friend = byLowerName.get(rawName.toLowerCase());
    if (!rawName || rawName.toLowerCase() === "missing") reasons.push("name is missing");
    else if (!friend) reasons.push(`${rawName} is not on this trip`);

    if (!rawAmount || rawAmount.toLowerCase() === "missing") reasons.push("amount is missing");
    else if (!/^\d+$/.test(rawAmount)) reasons.push("amount is not a number");

    if (reasons.length > 0) {
      wrong.push({ line: original[i], rewritten: line, reason: reasons.join(", ") });
    } else {
      spends.push({ name: friend!, amount: Number(rawAmount), item });
    }
  });

  return { spends, wrong };
}

/**
 * Equal split across all friends, then the fewest payments: repeatedly match the
 * person who owes the most with the person who is owed the most. Amounts in whole rupees.
 */
export function calculateSplit(spends: Spend[], friendNames: string[]): Split {
  const people = friendNames.length;
  const total = spends.reduce((sum, s) => sum + s.amount, 0);
  const share = total / people;

  // Work in paise so the matching settles exactly before rounding to rupees.
  const balances = new Map(friendNames.map((name) => [name, -Math.round(share * 100)]));
  for (const s of spends) balances.set(s.name, balances.get(s.name)! + s.amount * 100);

  const payments: Payment[] = [];
  for (;;) {
    const entries = [...balances.entries()];
    const debtor = entries.reduce((a, b) => (b[1] < a[1] ? b : a));
    const creditor = entries.reduce((a, b) => (b[1] > a[1] ? b : a));
    const amount = Math.min(-debtor[1], creditor[1]);
    if (amount < 50) break; // less than half a rupee left: settled once rounded

    balances.set(debtor[0], debtor[1] + amount);
    balances.set(creditor[0], creditor[1] - amount);
    const rupees = Math.round(amount / 100);
    if (rupees > 0) payments.push({ payer: debtor[0], payee: creditor[0], amount: rupees });
  }

  return {
    total,
    people,
    shareEach: Math.round(share),
    payments,
    totalSettled: payments.reduce((sum, p) => sum + p.amount, 0),
  };
}

export const formatRupees = (amount: number) => `₹${amount.toLocaleString("en-IN")}`;

/** Header label for a trip type, e.g. "Goa Trip · Friends". */
export const tripTypeLabel = (tripType: string) =>
  tripType === "With Friends & Families" ? "Friends & Families" : "Friends";
