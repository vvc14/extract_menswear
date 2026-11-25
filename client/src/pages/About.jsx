import { Link } from "react-router-dom";
import { HiOutlinePhone, HiOutlineLocationMarker, HiOutlineExternalLink } from "react-icons/hi";
import { Eagle } from "../components/brand/Logo";
import Receipt, { ReceiptHead, ReceiptLine, ReceiptRule } from "../components/brand/Receipt";
import useShopStock, { deliveryLine } from "../hooks/useShopStock";

const ADDRESS = "H.No. 5-360, NTR Road, 2nd Om Jend, Suraram Colony, Hyderabad 500055";
const MAP_URL = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent("Extract Men's Wear, NTR Road, Suraram Colony, Hyderabad")}`;
const PHONES = ["8184836764", "7337526629"];
const GSTIN = "36AN2PL8138D1ZP";
const fmt = (p) => `${p.slice(0, 5)} ${p.slice(5)}`;

/** The shopfront sign, rebuilt in HTML from the banner over the counter. */
function ShopSign() {
    return (
        <figure aria-label="The Extract shop sign" className="bolted board border-[3px] border-ink shadow-[10px_10px_0_#12123a] dark:shadow-[10px_10px_0_#000] overflow-hidden">
            <div className="grid grid-cols-[auto_1fr] items-center gap-4 sm:gap-8 px-5 pt-9 pb-6 sm:px-10 sm:pt-12 sm:pb-8">
                <Eagle className="w-[72px] sm:w-[150px] lg:w-[190px] h-auto text-white" />
                <div className="min-w-0 @container">
                    <p className="logo-word text-[min(44px,14.5cqi)] min-[400px]:text-[min(54px,14.5cqi)] sm:text-[min(96px,14.5cqi)] lg:text-[min(128px,14.5cqi)] leading-[0.9]">EXTRACT</p>
                    <p className="mt-2 sm:mt-3 text-[12px] sm:text-[20px] lg:text-[24px] font-black uppercase tracking-[0.14em] text-white" style={{ fontStretch: "125%" }}>
                        Menswear
                    </p>
                    <p className="mt-1 text-[11px] sm:text-[15px] lg:text-[17px] font-extrabold uppercase tracking-[0.3em] text-sign" style={{ fontStretch: "115%" }}>
                        Wholesale &amp; retail
                    </p>
                </div>
            </div>
            <div className="bg-white text-ink border-t-[3px] border-ink px-5 py-3 sm:px-10 flex flex-wrap items-center justify-between gap-x-6 gap-y-1 text-[12px] sm:text-[15px] font-bold">
                <span>H.No. 5-360, NTR Road, Suraram Colony, Hyd-55</span>
                <span className="tabular-nums">{PHONES.map(fmt).join(" · ")}</span>
            </div>
            <figcaption className="bg-ink text-white/85 px-5 sm:px-10 py-1.5 text-[11px] sm:text-[12px] font-bold tracking-[0.08em]">GSTIN {GSTIN}</figcaption>
        </figure>
    );
}

export default function About() {
    const { products } = useShopStock();
    const delivery = deliveryLine(products);

    return (
        <main id="main-content">
            {/* Hero: the sign itself */}
            <section className="bg-slate-50 dark:bg-[#111238] border-b-2 border-ink dark:border-slate-800">
                <div className="page-wrap pt-10 pb-16 sm:pt-14 sm:pb-24">
                    <nav aria-label="Breadcrumb" className="mb-8 text-[14px] font-semibold text-slate-600 dark:text-slate-400">
                        <Link to="/" className="hover:text-primary dark:hover:text-sign underline-offset-4 hover:underline">Home</Link>
                        <span className="mx-2" aria-hidden="true">/</span>
                        <span aria-current="page" className="text-slate-900 dark:text-white">Our shop</span>
                    </nav>
                    <div className="lg:-rotate-1 max-w-6xl">
                        <ShopSign />
                    </div>
                    <div className="mt-14 grid grid-cols-1 lg:grid-cols-12 gap-8 items-end">
                        <h1 className="lg:col-span-7 display text-[40px] sm:text-[64px] lg:text-[76px] text-slate-900 dark:text-white">
                            This sign hangs on NTR Road.
                            <span className="block text-primary dark:text-sign mt-1">Now it's on your phone.</span>
                        </h1>
                        <p className="lg:col-span-5 text-[17px] sm:text-[18px] leading-relaxed text-slate-700 dark:text-slate-300">
                            Extract Men's Wear is a menswear store in Suraram Colony, Hyderabad. We sell shirts and trousers over the counter, in bulk to other shops, and through this website. Same racks, same prices.
                        </p>
                    </div>
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
                        <div className="mt-8 flex flex-wrap gap-3">
                            <Link to="/shirts" className="btn-primary">Shop shirts</Link>
                            <Link to="/trousers" className="btn-outline">Shop trousers</Link>
                        </div>
                    </div>
                    <div className="px-4 sm:px-8 lg:px-12 xl:px-16 py-14 sm:py-20 bg-sign text-ink @container">
                        <p className="inline-block text-[13px] font-extrabold uppercase bg-ink text-sign px-2 py-0.5 mb-4 -rotate-1">By the bundle</p>
                        <h3 className="display text-[min(40px,11cqi)] sm:text-[min(56px,11cqi)]">Wholesale</h3>
                        <p className="mt-5 max-w-md text-[16px] leading-relaxed font-medium">
                            Running a store, dressing a wedding party or ordering for a team? We sell in bulk. Rates depend on quantity and fabric, so call and tell us what you need.
                        </p>
                        <div className="mt-8 flex flex-wrap gap-3">
                            {PHONES.map((p) => (
                                <a key={p} href={`tel:+91${p}`} className="inline-flex items-center gap-2 min-h-[48px] px-5 bg-primary text-white border-2 border-ink shadow-[4px_4px_0_#12123a] font-black tabular-nums text-[17px] hover:-translate-x-px hover:-translate-y-px active:translate-x-[3px] active:translate-y-[3px] active:shadow-none transition-transform">
                                    <HiOutlinePhone className="w-5 h-5 text-sign" aria-hidden="true" />
                                    {fmt(p)}
                                </a>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* What every online order comes with, printed as a bill */}
            <section aria-labelledby="promise-heading" className="bg-slate-50 dark:bg-[#111238]">
                <div className="page-wrap py-16 sm:py-24 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                    <div className="lg:col-span-5">
                        <p className="section-label">Buying online</p>
                        <h2 id="promise-heading" className="display text-[40px] sm:text-[58px] text-slate-900 dark:text-white">Every order comes with this</h2>
                        <p className="mt-5 max-w-md text-[16px] leading-relaxed text-slate-600 dark:text-slate-400">
                            No small print. Each line links to the page that explains it.
                        </p>
                    </div>
                    <div className="lg:col-span-6 lg:col-start-7 max-w-[480px] w-full rotate-1">
                        <Receipt>
                            <ReceiptHead sub="Online order: what's included" />
                            <ReceiptRule />
                            <dl className="flex flex-col gap-3">
                                {delivery && <ReceiptLine label="Delivery" value={delivery.free ? "₹0" : "Shown before you pay"} />}
                                <ReceiptLine label="Returns or exchanges" value="7 days" />
                                <ReceiptLine label="Cancel before dispatch" value="Full refund" />
                                <ReceiptLine label="Tracking" value="On your Orders page" />
                                <ReceiptLine label="Pay by" value="UPI, card, wallet" />
                            </dl>
                            <ReceiptRule />
                            <ul className="flex flex-wrap gap-x-4 gap-y-1 text-[14px] font-bold">
                                <li><Link to="/shipping" className="inline-flex min-h-[44px] items-center text-primary dark:text-sign underline underline-offset-4">Shipping</Link></li>
                                <li><Link to="/returns" className="inline-flex min-h-[44px] items-center text-primary dark:text-sign underline underline-offset-4">Returns policy</Link></li>
                                <li><Link to="/faq" className="inline-flex min-h-[44px] items-center text-primary dark:text-sign underline underline-offset-4">Payment questions</Link></li>
                            </ul>
                            <p className="mt-3 text-center text-[12px] font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Thank you, visit again</p>
                        </Receipt>
                    </div>
                </div>
            </section>

            {/* Find us */}
            <section aria-labelledby="visit-heading" className="board border-t-2 border-ink">
                <div className="page-wrap py-16 sm:py-20 flex flex-col md:flex-row md:items-end md:justify-between gap-8">
                    <div>
                        <h2 id="visit-heading" className="display sign-type text-[40px] sm:text-[60px]">Come see the racks</h2>
                        <p className="mt-5 flex gap-3 max-w-md text-[17px] leading-relaxed text-white/90">
                            <HiOutlineLocationMarker className="w-6 h-6 shrink-0 text-sign mt-0.5" aria-hidden="true" />
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
