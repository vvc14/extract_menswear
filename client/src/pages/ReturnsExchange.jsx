import { Link } from "react-router-dom";
import PageHero from "../components/PageHero";
import HangTag from "../components/brand/HangTag";
import Receipt, { ReceiptRule } from "../components/brand/Receipt";

// Steps follow what the Orders page actually offers once an order is marked delivered.
const SLIPS = [
    {
        id: "return",
        title: "Return slip",
        lead: "Money back",
        steps: [
            "Open your Orders page and press Request return on the delivered order, within 7 days.",
            "Tell us why: wrong size, a defect, the wrong piece, or you changed your mind.",
            "Our courier partner picks it up from your door, usually within 3 to 5 working days.",
            "Once it is back at the shop and checked, the refund goes to how you paid within 5 to 7 working days.",
        ],
    },
    {
        id: "exchange",
        title: "Exchange slip",
        lead: "Different size",
        steps: [
            "Press Request exchange on the delivered order, within 7 days.",
            "Pick the size you want instead from what is in stock.",
            "We collect the first piece and send the new size.",
            "The new piece arrives on the normal delivery timeline.",
        ],
    },
];

const RULES = [
    { title: "What we take back", body: "Unworn, unwashed, with the shop tags still on." },
    { title: "Damaged or wrong piece?", body: "Call the shop the day it arrives. We replace it and cover the return." },
    { title: "Bought on discount?", body: "Returns are allowed. The refund is what you paid, not the crossed-out price." },
    { title: "Where the money goes", body: "Back to the UPI, card or wallet you paid with." },
];

export default function ReturnsExchange() {
    return (
        <main id="main-content">
            <PageHero
                title="Returns & exchanges"
                kicker="Wrong size? Changed your mind?"
                aside={
                    <HangTag tone="yellow" hole="var(--blue)" className="hang-settle w-[220px] rotate-3">
                        <p className="display text-[84px] leading-[0.85]">7</p>
                        <p className="display text-[30px]">days</p>
                        <p className="mt-2 text-[14px] font-bold text-ink/80">from delivery to ask</p>
                    </HangTag>
                }
            >
                You have 7 days from delivery to send it back or swap the size, straight from your Orders page.
            </PageHero>

            <div className="page-wrap py-14 sm:py-20 flex flex-col gap-16">
                <section aria-label="How to return or exchange" className="grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-16 max-w-5xl">
                    {SLIPS.map((slip, si) => (
                        <Receipt key={slip.id} className={si === 0 ? "md:-rotate-1" : "md:rotate-1 md:mt-10"}>
                            <div className="flex items-baseline justify-between gap-3">
                                <h2 className="display text-[28px] sm:text-[32px]">{slip.title}</h2>
                                <span className={`text-[12px] font-black uppercase px-2 py-0.5 border-2 border-ink ${si === 0 ? "bg-sign text-ink" : "bg-primary text-white"}`}>{slip.lead}</span>
                            </div>
                            <ReceiptRule />
                            <ol className="flex flex-col gap-4">
                                {slip.steps.map((s, i) => (
                                    <li key={i} className="grid grid-cols-[2rem_1fr] gap-2 text-[15px] leading-relaxed">
                                        <span className="font-black tabular-nums text-primary dark:text-sign">{String(i + 1).padStart(2, "0")}</span>
                                        <span className="text-slate-700 dark:text-slate-300">{s}</span>
                                    </li>
                                ))}
                            </ol>
                            <ReceiptRule />
                            <Link to="/orders" className="btn-primary w-full">Go to my orders</Link>
                        </Receipt>
                    ))}
                </section>

                <section aria-labelledby="rules-heading" className="grid grid-cols-1 lg:grid-cols-12 gap-10 border-t-2 border-ink dark:border-slate-700 pt-14">
                    <h2 id="rules-heading" className="lg:col-span-4 display text-[34px] sm:text-[44px] text-slate-900 dark:text-white">The fine print, in big print</h2>
                    <dl className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-8">
                        {RULES.map((r) => (
                            <div key={r.title}>
                                <dt className="text-[18px] font-black text-slate-900 dark:text-white">{r.title}</dt>
                                <dd className="mt-2 text-[15px] leading-relaxed text-slate-600 dark:text-slate-400">{r.body}</dd>
                            </div>
                        ))}
                    </dl>
                </section>

                <p className="text-[16px] text-slate-700 dark:text-slate-300">
                    Stuck? Call the counter on{" "}
                    <a href="tel:+918184836764" className="font-black text-primary dark:text-sign underline underline-offset-4 whitespace-nowrap">81848 36764</a>{" "}
                    or <Link to="/contact" className="font-bold text-primary dark:text-sign underline underline-offset-4">write to us</Link>.
                </p>
            </div>
        </main>
    );
}
