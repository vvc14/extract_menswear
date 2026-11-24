import { Link } from "react-router-dom";
import { HiOutlinePhone, HiOutlineLocationMarker, HiOutlineMail } from "react-icons/hi";
import { Eagle } from "./brand/Logo";

// Shop details exactly as printed on the Extract signboard.
const PHONES = ["8184836764", "7337526629"];
const ADDRESS = ["H.No. 5-360, NTR Road", "2nd Om Jend, Suraram Colony", "Hyderabad 500055"];
const GSTIN = "36AN2PL8138D1ZP";

const LINK_GROUPS = [
    {
        title: "Shop",
        links: [
            { to: "/shirts", label: "Shirts" },
            { to: "/trousers", label: "Trousers" },
            { to: "/#new-arrivals", label: "New arrivals" },
            { to: "/wishlist", label: "Wishlist" },
        ],
    },
    {
        title: "Help",
        links: [
            { to: "/shipping", label: "Shipping" },
            { to: "/returns", label: "Returns and exchanges" },
            { to: "/size-guide", label: "Size guide" },
            { to: "/faq", label: "FAQ" },
            { to: "/contact", label: "Contact" },
            { to: "/about", label: "Our shop" },
        ],
    },
];

const formatPhone = (p) => `${p.slice(0, 5)} ${p.slice(5)}`;

export default function Footer() {
    return (
        <footer className="board border-t-2 border-ink" role="contentinfo">
            <div className="page-wrap pt-14 pb-10 sm:pt-20">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8">

                    {/* The sign itself */}
                    <div className="lg:col-span-5">
                        <div className="flex items-end gap-3">
                            <Eagle className="h-16 sm:h-20 w-auto text-white shrink-0" />
                            <div>
                                <p className="display sign-type text-[36px] min-[400px]:text-[44px] sm:text-[64px]">Extract</p>
                                <p className="mt-1 text-[12px] sm:text-[14px] font-extrabold tracking-[0.08em] uppercase text-white" style={{ fontStretch: "125%" }}>
                                    Wholesale &amp; retail
                                </p>
                            </div>
                        </div>
                        <p className="mt-6 max-w-sm text-[15px] leading-relaxed text-white/80">
                            Shirts and trousers from our shop in Suraram Colony, delivered anywhere in India. Buying in bulk for a store or an event? Call us for wholesale rates.
                        </p>
                    </div>

                    {/* Visit / call */}
                    <div className="lg:col-span-4">
                        <h2 className="text-[13px] font-black uppercase tracking-[0.08em] text-sign mb-4">Visit or call the shop</h2>
                        <address className="not-italic flex gap-3 text-[15px] leading-relaxed text-white">
                            <HiOutlineLocationMarker className="w-5 h-5 mt-0.5 shrink-0 text-sign" aria-hidden="true" />
                            <span>{ADDRESS.map((l) => <span key={l} className="block">{l}</span>)}</span>
                        </address>
                        <ul className="mt-5 flex flex-col gap-2">
                            {PHONES.map((p) => (
                                <li key={p}>
                                    <a href={`tel:+91${p}`} className="inline-flex items-center gap-3 min-h-[44px] text-[22px] font-black tabular-nums text-white hover:text-sign transition-colors" style={{ fontStretch: "112%" }}>
                                        <HiOutlinePhone className="w-5 h-5 text-sign" aria-hidden="true" />
                                        {formatPhone(p)}
                                    </a>
                                </li>
                            ))}
                            <li>
                                <a href="mailto:support@extractmenswear.com" className="inline-flex items-center gap-3 min-h-[44px] text-[15px] font-semibold text-white/90 hover:text-sign transition-colors break-all">
                                    <HiOutlineMail className="w-5 h-5 text-sign shrink-0" aria-hidden="true" />
                                    support@extractmenswear.com
                                </a>
                            </li>
                        </ul>
                    </div>

                    {/* Links */}
                    <div className="lg:col-span-3 grid grid-cols-2 gap-6">
                        {LINK_GROUPS.map((group) => (
                            <nav key={group.title} aria-label={`${group.title} links`}>
                                <h2 className="text-[13px] font-black uppercase tracking-[0.08em] text-sign mb-4">{group.title}</h2>
                                <ul className="flex flex-col">
                                    {group.links.map(({ to, label }) => (
                                        <li key={label}>
                                            <Link to={to} className="inline-flex items-center min-h-[36px] text-[15px] text-white/85 hover:text-sign hover:underline underline-offset-4 transition-colors">
                                                {label}
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            </nav>
                        ))}
                    </div>
                </div>
            </div>

            <div className="border-t-2 border-ink bg-ink text-white/75">
                <div className="page-wrap py-4 flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between text-[13px]">
                    <p>© {new Date().getFullYear()} Extract Menswear, Hyderabad</p>
                    <p className="tabular-nums">GSTIN {GSTIN}</p>
                </div>
            </div>
        </footer>
    );
}
