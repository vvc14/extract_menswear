import { Link } from "react-router-dom";
import { HiOutlinePhone, HiOutlineLocationMarker, HiOutlineExternalLink } from "react-icons/hi";
import { Eagle } from "../components/brand/Logo";

const ADDRESS = "H.No. 5-360, NTR Road, 2nd Om Jend, Suraram Colony, Hyderabad 500055";
const MAP_URL = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent("Extract Men's Wear, NTR Road, Suraram Colony, Hyderabad")}`;
const PHONES = ["8184836764", "7337526629"];

// Each promise links to the page that defines it.
const PROMISES = [
    { title: "Free delivery above ₹999", body: "Anywhere in India. Below that, a flat charge by zone.", to: "/shipping", link: "Shipping rates" },
    { title: "7 days to change your mind", body: "Return or exchange from your Orders page within a week of delivery.", to: "/returns", link: "Returns policy" },
    { title: "Pay the way you like", body: "UPI, cards and wallets through Razorpay checkout.", to: "/faq", link: "Payment questions" },
];

export default function About() {
    return (
        <main id="main-content">
            {/* Hero */}
            <section className="board relative overflow-hidden border-b-2 border-ink">
                <Eagle className="pointer-events-none absolute -right-20 -bottom-24 h-[420px] w-auto text-white opacity-[0.07]" />
                <div className="page-wrap relative py-16 sm:py-24">
                    <nav aria-label="Breadcrumb" className="mb-8 text-[14px] font-semibold text-white/80">
                        <Link to="/" className="hover:text-sign underline-offset-4 hover:underline">Home</Link>
                        <span className="mx-2" aria-hidden="true">/</span>
                        <span aria-current="page" className="text-white">Our shop</span>
                    </nav>
                    <h1 className="display text-[44px] sm:text-[76px] lg:text-[92px] max-w-5xl">
                        <span className="block text-white">A shop on NTR Road.</span>
                        <span className="block sign-type mt-1">Now on your phone.</span>
                    </h1>
                    <p className="mt-7 max-w-2xl text-[17px] sm:text-[19px] leading-relaxed text-white/90">
                        Extract Men's Wear is a menswear store in Suraram Colony, Hyderabad. We sell shirts and trousers over the counter, in bulk to other shops, and now through this website.
                    </p>
                </div>
            </section>

            {/* Retail / Wholesale split */}
            <section aria-labelledby="sell-heading" className="bg-white dark:bg-night">
                <h2 id="sell-heading" className="sr-only">How we sell</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 border-b-2 border-ink dark:border-slate-700">
                    <div className="px-4 sm:px-8 lg:px-12 xl:px-16 py-14 sm:py-20 md:border-r-2 border-ink dark:border-slate-700 border-b-2 md:border-b-0">
                        <p className="section-label">One piece at a time</p>
                        <h3 className="display text-[40px] sm:text-[56px] text-slate-900 dark:text-white">Retail</h3>
                        <p className="mt-5 max-w-md text-[16px] leading-relaxed text-slate-600 dark:text-slate-400">
                            Walk in and try things on, or order here and we ship it. Same racks, same prices, whichever way you buy.
                        </p>
                        <Link to="/shirts" className="btn-primary mt-8">Browse the racks</Link>
                    </div>
                    <div className="px-4 sm:px-8 lg:px-12 xl:px-16 py-14 sm:py-20 bg-sign text-ink">
                        <p className="inline-block text-[13px] font-extrabold uppercase bg-ink text-sign px-2 py-0.5 mb-4 -rotate-1">By the bundle</p>
                        <h3 className="display text-[40px] sm:text-[56px]">Wholesale</h3>
                        <p className="mt-5 max-w-md text-[16px] leading-relaxed font-medium">
                            Running a store, dressing a wedding party or ordering for a team? We sell in bulk. Rates depend on quantity and fabric, so call and tell us what you need.
                        </p>
                        <div className="mt-8 flex flex-wrap gap-3">
                            {PHONES.map((p) => (
                                <a key={p} href={`tel:+91${p}`} className="inline-flex items-center gap-2 min-h-[48px] px-5 bg-primary text-white border-2 border-ink shadow-[4px_4px_0_#12123a] font-black tabular-nums text-[17px] hover:-translate-x-px hover:-translate-y-px active:translate-x-[3px] active:translate-y-[3px] active:shadow-none transition-transform">
                                    <HiOutlinePhone className="w-5 h-5 text-sign" aria-hidden="true" />
                                    {p.slice(0, 5)} {p.slice(5)}
                                </a>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* What you get */}
            <section aria-labelledby="promise-heading" className="bg-slate-50 dark:bg-[#111238]">
                <div className="page-wrap py-16 sm:py-24 grid grid-cols-1 lg:grid-cols-12 gap-10">
                    <div className="lg:col-span-4">
                        <p className="section-label">Buying online</p>
                        <h2 id="promise-heading" className="display text-[40px] sm:text-[54px] text-slate-900 dark:text-white">What you can count on</h2>
                    </div>
                    <ol className="lg:col-span-8 flex flex-col gap-4">
                        {PROMISES.map((p, i) => (
                            <li key={p.title} className={`flex gap-5 sm:gap-8 items-start bg-white dark:bg-slate-900 border-2 border-ink dark:border-slate-700 p-5 sm:p-7 ${i === 1 ? "lg:ml-10" : i === 2 ? "lg:ml-20" : ""}`}>
                                <span className="display text-[40px] sm:text-[52px] text-primary dark:text-sign leading-none">{i + 1}</span>
                                <div>
                                    <h3 className="text-[19px] sm:text-[22px] font-black text-slate-900 dark:text-white">{p.title}</h3>
                                    <p className="mt-1.5 text-[15px] text-slate-600 dark:text-slate-400">{p.body}</p>
                                    <Link to={p.to} className="inline-block mt-3 text-[14px] font-bold text-primary dark:text-sign underline underline-offset-4 hover:no-underline">{p.link}</Link>
                                </div>
                            </li>
                        ))}
                    </ol>
                </div>
            </section>

            {/* Find us */}
            <section aria-labelledby="visit-heading" className="bg-white dark:bg-night border-t-2 border-ink dark:border-slate-700">
                <div className="page-wrap py-16 sm:py-20 flex flex-col md:flex-row md:items-end md:justify-between gap-8">
                    <div>
                        <h2 id="visit-heading" className="display text-[40px] sm:text-[56px] text-slate-900 dark:text-white">Come see the racks</h2>
                        <p className="mt-5 flex gap-3 max-w-md text-[17px] leading-relaxed text-slate-700 dark:text-slate-300">
                            <HiOutlineLocationMarker className="w-6 h-6 shrink-0 text-primary dark:text-sign mt-0.5" aria-hidden="true" />
                            {ADDRESS}
                        </p>
                    </div>
                    <a href={MAP_URL} target="_blank" rel="noopener noreferrer" className="btn-buy text-[16px] self-start md:self-auto">
                        Open in Google Maps
                        <HiOutlineExternalLink className="w-5 h-5" aria-hidden="true" />
                        <span className="sr-only">(opens in a new tab)</span>
                    </a>
                </div>
            </section>
        </main>
    );
}
