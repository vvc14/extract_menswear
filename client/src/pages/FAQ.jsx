import { Link } from "react-router-dom";
import { HiOutlinePlus } from "react-icons/hi";
import PageHero from "../components/PageHero";

// Answers match how the store actually works (per-piece delivery charge, Razorpay only,
// 7-day window enforced on the Orders page). Update here if a policy changes.
const FAQS = [
    {
        id: "orders",
        category: "Orders & delivery",
        items: [
            { q: "How much is delivery?", a: <>Each piece has its own delivery charge, set by the shop. You see it on the product page and the bag adds it up before you pay. Details on the <Link to="/shipping">shipping page</Link>.</> },
            { q: "How long does delivery take?", a: "It depends on your pin code and the courier. When your order ships you get an email with the courier name and tracking number, so you can follow it the whole way." },
            { q: "How do I track my order?", a: <>Open <Link to="/orders">My orders</Link>. Once it ships, the courier and tracking number appear there and in the shipping email.</> },
            { q: "Can I change or cancel my order?", a: "You can cancel from My orders while it says Paid, and the full amount is refunded. To change a size or address, call the shop straight away. Once it has shipped it cannot be changed." },
            { q: "Do you ship outside India?", a: "Not yet. Checkout takes Indian addresses with a 6-digit pin code." },
        ],
    },
    {
        id: "returns",
        category: "Returns & exchanges",
        items: [
            { q: "What is your return policy?", a: <>7 days from delivery. Pieces must be unworn, unwashed and still tagged. Full details on the <Link to="/returns">returns page</Link>.</> },
            { q: "How do I start a return?", a: "In My orders, find the delivered order and press Request return. Give a reason and we arrange a pickup from your door." },
            { q: "How long does a refund take?", a: "Once the piece is back at the shop and checked, the refund is sent within 5 to 7 working days, to the UPI, card or wallet you paid with." },
            { q: "Can I swap for a different size?", a: "Yes. Press Request exchange on the delivered order and pick the size you need from what is in stock." },
        ],
    },
    {
        id: "sizing",
        category: "Sizing & fit",
        items: [
            { q: "How do I find my size?", a: <>Use the <Link to="/size-guide">size guide</Link>. It has shirt and trouser charts in inches and how to measure yourself.</> },
            { q: "What if it doesn't fit?", a: "Ask for a size exchange from My orders within 7 days of delivery." },
            { q: "Do your sizes run true?", a: "They follow standard Indian sizing. Between two sizes? Go one up for a relaxed fit, one down for a slim fit." },
        ],
    },
    {
        id: "care",
        category: "Products & care",
        items: [
            { q: "What fabric is it?", a: "Each product page names its fabric when the shop has entered it, and the racks can be filtered by fabric." },
            { q: "How should I wash it?", a: "Follow the care label inside the garment. As a rule: gentle machine wash or dry clean, no bleach, no hot tumble dry." },
            { q: "Will the colour look like the photo?", a: "Close, but screens and shop lighting vary, so expect slight differences." },
        ],
    },
    {
        id: "payment",
        category: "Payment",
        items: [
            { q: "How can I pay?", a: "Online through Razorpay: UPI, debit and credit cards, net banking and wallets." },
            { q: "Is cash on delivery available?", a: "No. Every order is paid online before it ships." },
            { q: "Is my card safe?", a: "Payments are handled by Razorpay, a PCI DSS compliant gateway. Your card details go to Razorpay and are never stored by us." },
        ],
    },
];

// Running question number (Q01, Q02...) across all topics, worked out once
let counter = 0;
const NUMBERED = FAQS.map((cat) => ({ ...cat, items: cat.items.map((item) => ({ ...item, n: ++counter })) }));

export default function FAQ() {
    return (
        <main id="main-content">
            <PageHero title="Questions, answered" crumb="FAQ" kicker="Asked at the counter">
                Orders, delivery, returns, sizing and payments. If yours is not here, call the shop.
            </PageHero>

            <div className="page-wrap py-14 sm:py-20 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14">
                {/* Index: jump to a topic */}
                <nav aria-label="FAQ topics" className="lg:col-span-3">
                    <ul className="flex lg:flex-col gap-2 overflow-x-auto pb-2 -mx-4 px-4 lg:mx-0 lg:px-0 lg:sticky lg:top-36">
                        {FAQS.map((c) => (
                            <li key={c.id} className="shrink-0">
                                <a href={`#${c.id}`} className="flex items-center min-h-[44px] px-4 border-2 border-ink dark:border-slate-600 bg-white dark:bg-slate-900 text-[15px] font-extrabold text-slate-900 dark:text-white hover:bg-sign hover:text-ink dark:hover:text-ink active:translate-y-px whitespace-nowrap" style={{ fontStretch: "108%" }}>
                                    {c.category}
                                </a>
                            </li>
                        ))}
                    </ul>
                </nav>

                <div className="lg:col-span-9 flex flex-col gap-14">
                    {NUMBERED.map((cat) => (
                        <section key={cat.id} id={cat.id} aria-labelledby={`${cat.id}-h`} className="scroll-mt-32">
                            <h2 id={`${cat.id}-h`} className="display text-[30px] sm:text-[40px] text-slate-900 dark:text-white mb-5">{cat.category}</h2>
                            <div className="border-t-2 border-ink dark:border-slate-600">
                                {cat.items.map((item) => {
                                    return (
                                        <details key={item.q} className="group border-b-2 border-ink dark:border-slate-600">
                                            <summary className="list-none [&::-webkit-details-marker]:hidden flex items-center gap-4 min-h-[60px] py-3 px-1 sm:px-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900 group-open:bg-sign group-open:text-ink">
                                                <span className="w-10 shrink-0 text-[14px] font-black tabular-nums text-slate-500 dark:text-slate-400 group-open:text-ink">Q{String(item.n).padStart(2, "0")}</span>
                                                <span className="flex-1 text-[16px] sm:text-[17px] font-bold text-slate-900 dark:text-white group-open:text-ink">{item.q}</span>
                                                <HiOutlinePlus className="w-5 h-5 shrink-0 text-slate-500 dark:text-slate-400 group-open:text-ink group-open:rotate-45 transition-transform" aria-hidden="true" />
                                            </summary>
                                            <div className="pl-[3.5rem] sm:pl-[4.25rem] pr-3 pt-3 pb-6 text-[15px] sm:text-[16px] leading-relaxed text-slate-700 dark:text-slate-300 [&_a]:font-bold [&_a]:text-primary dark:[&_a]:text-sign [&_a]:underline [&_a]:underline-offset-4">
                                                {item.a}
                                            </div>
                                        </details>
                                    );
                                })}
                            </div>
                        </section>
                    ))}

                    <div className="board border-2 border-ink p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
                        <div>
                            <p className="display text-[26px] sm:text-[32px] sign-type">Still stuck?</p>
                            <p className="mt-2 text-[16px] text-white/90">Call the counter, or write and we reply within one working day.</p>
                        </div>
                        <div className="flex flex-wrap gap-3">
                            <a href="tel:+918184836764" className="btn-buy">Call 81848 36764</a>
                            <Link to="/contact" className="inline-flex items-center min-h-[44px] px-5 font-extrabold text-white border-2 border-white hover:bg-white hover:text-primary">Write to us</Link>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
