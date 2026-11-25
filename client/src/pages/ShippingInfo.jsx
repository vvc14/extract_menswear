import { Link } from "react-router-dom";
import PageHero from "../components/PageHero";
import HangTag from "../components/brand/HangTag";
import { Eagle } from "../components/brand/Logo";
import useShopStock, { deliveryLine } from "../hooks/useShopStock";

// The order states a customer actually sees on their Orders page (server/models/Order.js).
const JOURNEY = [
    { stamp: "Paid", what: "Your order is confirmed and the invoice is emailed. Until it ships you can cancel from your Orders page for a full refund." },
    { stamp: "Shipped", what: "We pack it at the shop and hand it to the courier. You get an email with the courier name and tracking number, also shown on your Orders page." },
    { stamp: "Delivered", what: "Marked delivered on your Orders page. From this day you have 7 days to ask for a return or a size exchange." },
];

export default function ShippingInfo() {
    const stock = useShopStock();
    const delivery = deliveryLine(stock.products);

    return (
        <main id="main-content">
            <PageHero title="Shipping" kicker="Parcels from NTR Road">
                From our counter in Suraram Colony to any Indian pin code our couriers reach.
            </PageHero>

            <div className="page-wrap py-14 sm:py-20 flex flex-col gap-20">
                {/* The parcel label */}
                <section aria-labelledby="label-heading" className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
                    <div className="lg:col-span-5">
                        <p className="section-label">What it costs</p>
                        <h2 id="label-heading" className="display text-[40px] sm:text-[56px] text-slate-900 dark:text-white">
                            {stock.status === "loading" ? "Checking the rack..." : delivery?.free ? "Delivery is free right now" : "Delivery charge, upfront"}
                        </h2>
                        <p className="mt-5 max-w-md text-[16px] leading-relaxed text-slate-600 dark:text-slate-400">
                            Each piece carries its own delivery charge, set by the shop. It is shown on the product page and added up in your bag before you pay, so there is never a surprise at checkout.
                            {delivery?.free && " Today every piece in stock ships at ₹0."}
                        </p>
                        {stock.status === "error" && (
                            <p className="mt-4 text-[15px] font-bold text-slate-700 dark:text-slate-300">
                                We could not check today's charges. <button type="button" onClick={stock.retry} className="min-h-[44px] underline underline-offset-4 text-primary dark:text-sign">Try again</button>
                            </p>
                        )}
                    </div>

                    <div className="lg:col-span-6 lg:col-start-7 w-full max-w-[560px] lg:rotate-1">
                        <div className="bg-white text-ink border-[3px] border-ink shadow-[8px_8px_0_#12123a] dark:shadow-[8px_8px_0_#000]">
                            <div className="flex items-center justify-between gap-3 bg-ink text-white px-5 py-3">
                                <span className="flex items-center gap-2 text-[15px] font-black uppercase tracking-[0.08em]" style={{ fontStretch: "120%" }}>
                                    <Eagle className="w-7 h-auto text-white" /> Parcel
                                </span>
                                <span className="text-[13px] font-extrabold uppercase text-sign">Handle with care</span>
                            </div>
                            <dl className="grid grid-cols-1 sm:grid-cols-2">
                                <div className="p-5 border-b-2 sm:border-b-0 sm:border-r-2 border-dashed border-ink">
                                    <dt className="text-[12px] font-black uppercase tracking-[0.1em] text-[#42436f]">From</dt>
                                    <dd className="mt-1 text-[15px] leading-relaxed font-semibold">
                                        <span className="block font-black text-[17px]">Extract Menswear</span>
                                        H.No. 5-360, NTR Road<br />Suraram Colony, Hyderabad 500055
                                    </dd>
                                </div>
                                <div className="p-5">
                                    <dt className="text-[12px] font-black uppercase tracking-[0.1em] text-[#42436f]">To</dt>
                                    <dd className="mt-1 text-[15px] leading-relaxed font-semibold">
                                        <span className="block font-black text-[17px]">You</span>
                                        The address you pick in your bag. Any 6-digit Indian pin code.
                                    </dd>
                                </div>
                            </dl>
                            <div className="flex items-center justify-between gap-4 border-t-[3px] border-ink px-5 py-4 bg-sign">
                                <span className="text-[14px] font-black uppercase" style={{ fontStretch: "115%" }}>Delivery</span>
                                <span className="text-[22px] font-black tabular-nums" style={{ fontStretch: "112%" }}>
                                    {stock.status === "loading" ? "..." : delivery?.free ? "₹0" : "Shown per piece"}
                                </span>
                            </div>
                        </div>
                    </div>
                </section>

                {/* What happens after you pay: the real order states, hung on the rail */}
                <section aria-labelledby="journey-heading">
                    <p className="section-label">After you pay</p>
                    <h2 id="journey-heading" className="display text-[40px] sm:text-[56px] text-slate-900 dark:text-white max-w-3xl">Three stamps on every order</h2>
                    <div className="mt-12">
                        <div className="rail-rod" aria-hidden="true" />
                        {/* phones: the tags scroll along the rail instead of stacking off nothing */}
                        <ol className="-mt-[7px] flex gap-5 overflow-x-auto snap-x snap-mandatory pb-6 pl-2 pr-6 md:grid md:grid-cols-3 md:gap-x-6 md:overflow-visible md:px-8">
                            {JOURNEY.map((s, i) => (
                                <li key={s.stamp} className={`hang-settle w-[min(300px,80vw)] shrink-0 snap-start md:w-full md:max-w-[400px] md:mx-auto ${i === 1 ? "md:[--drop:84px]" : ""}`} style={{ animationDelay: `${i * 0.12}s` }}>
                                    <HangTag tone={["white", "yellow", "blue"][i]} className="swing" tagClassName="@container" style={{ "--string": "var(--drop, 40px)" }}>
                                        <p className={`text-[13px] font-black tabular-nums ${i === 2 ? "text-white/85" : "text-ink/75"}`}>Stage {i + 1}</p>
                                        <h3 className="display text-[min(34px,13cqi)] mt-1">{s.stamp}</h3>
                                        <p className={`mt-3 text-[15px] leading-relaxed ${i === 2 ? "text-white/90" : "text-ink/85"}`}>{s.what}</p>
                                    </HangTag>
                                </li>
                            ))}
                        </ol>
                    </div>
                </section>

                {/* Plain answers */}
                <section aria-labelledby="notes-heading" className="grid grid-cols-1 lg:grid-cols-12 gap-10 border-t-2 border-ink dark:border-slate-700 pt-14">
                    <h2 id="notes-heading" className="lg:col-span-4 display text-[34px] sm:text-[44px] text-slate-900 dark:text-white">Good to know</h2>
                    <dl className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-8">
                        <div>
                            <dt className="text-[18px] font-black text-slate-900 dark:text-white">India only, for now</dt>
                            <dd className="mt-2 text-[15px] leading-relaxed text-slate-600 dark:text-slate-400">Checkout takes Indian addresses with a 6-digit pin code.</dd>
                        </div>
                        <div>
                            <dt className="text-[18px] font-black text-slate-900 dark:text-white">Prepaid orders</dt>
                            <dd className="mt-2 text-[15px] leading-relaxed text-slate-600 dark:text-slate-400">Pay online by UPI, card or wallet through Razorpay. Cash on delivery is not offered.</dd>
                        </div>
                        <div>
                            <dt className="text-[18px] font-black text-slate-900 dark:text-white">Changed your mind before it ships?</dt>
                            <dd className="mt-2 text-[15px] leading-relaxed text-slate-600 dark:text-slate-400">Cancel from your <Link to="/orders" className="font-bold text-primary dark:text-sign underline underline-offset-4">Orders page</Link> while it says Paid. The full amount goes back to how you paid.</dd>
                        </div>
                        <div>
                            <dt className="text-[18px] font-black text-slate-900 dark:text-white">Parcel running late?</dt>
                            <dd className="mt-2 text-[15px] leading-relaxed text-slate-600 dark:text-slate-400">Call the shop on <a href="tel:+918184836764" className="font-bold text-primary dark:text-sign underline underline-offset-4 whitespace-nowrap">81848 36764</a> with your invoice number and we will chase the courier.</dd>
                        </div>
                    </dl>
                </section>
            </div>
        </main>
    );
}
