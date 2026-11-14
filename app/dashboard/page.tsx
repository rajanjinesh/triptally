import { ButtonWithInfo, Info, Page } from "../components/ui";

// Static sample data from design.md (replaced by the real split in a later step).
const summary = { totalCost: "₹2,000", people: "4", shareEach: "₹500" };
const payments = [
  { payer: "Neha", payee: "Rajan", amount: "₹500" },
  { payer: "Amit", payee: "Rajan", amount: "₹200" },
  { payer: "Amit", payee: "Priya", amount: "₹100" },
];
const totalSettled = "₹800";

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
  return (
    <Page gap="gap-6">
      <header className="flex w-full flex-col gap-3">
        <h1 className="text-[24px] leading-[1.5] font-semibold text-ink">Goa Trip · Friends</h1>
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
          {[summary.totalCost, summary.people, summary.shareEach].map((value, i) => (
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
              {payments.map((p, i) => (
                <tr key={i} className={`h-[52px] border-b border-line-soft ${i % 2 === 1 ? "bg-stripe" : "bg-white"}`}>
                  <td className="px-4">{p.payer}</td>
                  <td className="px-4">{p.payee}</td>
                  <td className="px-4 text-right tabular-nums">{p.amount}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="h-[52px] border-t-2 border-line bg-total text-[15px] leading-[1.5] font-bold text-ink">
                <td colSpan={2} className="px-4">Total settled</td>
                <td className="px-4 text-right tabular-nums">{totalSettled}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </section>

      <div className="flex w-full justify-end">
        <ButtonWithInfo className="border-0" info="Approve this split, save it, and email each friend what they owe and to whom.">
          Approve &amp; notify
        </ButtonWithInfo>
      </div>
    </Page>
  );
}
