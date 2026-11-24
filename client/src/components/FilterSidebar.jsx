import { useState } from "react";
import { HiChevronDown, HiCheck } from "react-icons/hi";
import { PRICE_BANDS } from "../utils/priceBands";
import { swatchFor, isDarkSwatch } from "../utils/colors";

function FilterSection({ title, count = 0, defaultOpen = false, children }) {
    const [open, setOpen] = useState(defaultOpen || count > 0);

    return (
        <div className="border-b-2 border-slate-200 dark:border-slate-700 last:border-0">
            <button
                onClick={() => setOpen(!open)}
                type="button"
                className="w-full min-h-[48px] flex items-center justify-between py-3 text-left group"
                aria-expanded={open}
            >
                <span className="text-[15px] font-black text-slate-900 dark:text-white uppercase">
                    {title}
                    {count > 0 && <span className="ml-2 text-[13px] text-primary dark:text-sign normal-case">({count})</span>}
                </span>
                <HiChevronDown
                    aria-hidden="true"
                    className={`w-5 h-5 text-slate-500 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white transition-transform duration-200 ${open ? "rotate-180" : ""}`}
                />
            </button>
            {open && <div className="pb-4">{children}</div>}
        </div>
    );
}

const chip = (active, empty) =>
    `border-2 transition-colors active:translate-y-px disabled:opacity-40 disabled:cursor-not-allowed disabled:active:translate-y-0 ${active
        ? "bg-primary text-white border-ink dark:bg-sign dark:text-ink dark:border-black shadow-[2px_2px_0_#12123a] dark:shadow-[2px_2px_0_#000]"
        : `bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-600 ${empty ? "" : "hover:border-ink dark:hover:border-sign"}`}`;

const Count = ({ n }) => <span className="ml-auto pl-2 text-[13px] font-bold tabular-nums opacity-70">{n}</span>;

export const EMPTY_FILTERS = { price: "", fabric: [], style: [], size: [], color: [], sale: false, stock: false };

const SIZE_ORDER = ["XXS", "XS", "S", "M", "L", "XL", "XXL", "XXXL", "3XL", "4XL"];
const sizeRank = (s) => {
    const i = SIZE_ORDER.indexOf(String(s).toUpperCase());
    return i >= 0 ? i : 100 + (parseFloat(s) || 0);
};

// Facet options with counts. Selected values stay visible (so they can be unticked) even if
// other filters have left them with zero products.
const withSelected = (options = [], selected = []) => {
    const map = new Map(options.map((o) => [o.value, o.count]));
    for (const s of selected) if (!map.has(s)) map.set(s, 0);
    return [...map].map(([value, count]) => ({ value, count }));
};

/**
 * Controlled filter panel. The parent owns the state (see EMPTY_FILTERS) and fetches `facets`
 * from /products/facets, so every option shows how many products it would leave on the rack.
 */
export default function FilterSidebar({ category, value = EMPTY_FILTERS, onChange, facets }) {
    const toggle = (key, item) => {
        const list = value[key];
        onChange({ ...value, [key]: list.includes(item) ? list.filter((i) => i !== item) : [...list, item] });
    };

    const styleLabel = category === "shirt" ? "Style" : "Type";
    const activeCount = value.fabric.length + value.style.length + value.size.length + value.color.length
        + (value.price ? 1 : 0) + (value.sale ? 1 : 0) + (value.stock ? 1 : 0);

    const sizes = withSelected(facets?.size, value.size).sort((a, b) => sizeRank(a.value) - sizeRank(b.value));
    const colors = withSelected(facets?.color, value.color);
    const fabrics = withSelected(facets?.fabric, value.fabric);
    const styles = withSelected(facets?.style, value.style);

    const listOf = (key, options) => (
        <div className="flex flex-col gap-2">
            {options.map(({ value: item, count }) => {
                const checked = value[key].includes(item);
                return (
                    <label key={item} className={`flex items-center gap-3 min-h-[40px] group ${!checked && count === 0 ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}`}>
                        <input
                            type="checkbox"
                            checked={checked}
                            disabled={!checked && count === 0}
                            onChange={() => toggle(key, item)}
                            className="w-5 h-5 accent-primary dark:accent-[#e8c547] cursor-pointer disabled:cursor-not-allowed"
                        />
                        <span className="flex flex-1 text-[15px] text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white font-semibold">
                            {item}<Count n={count} />
                        </span>
                    </label>
                );
            })}
        </div>
    );

    const toggleRow = (key, label, n) => (
        <label className={`flex items-center gap-3 min-h-[44px] ${!value[key] && n === 0 ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}`}>
            <input
                type="checkbox"
                role="switch"
                checked={value[key]}
                disabled={!value[key] && n === 0}
                onChange={() => onChange({ ...value, [key]: !value[key] })}
                className="w-5 h-5 accent-primary dark:accent-[#e8c547] cursor-pointer disabled:cursor-not-allowed"
            />
            <span className="flex flex-1 text-[15px] font-bold text-slate-800 dark:text-slate-200">{label}<Count n={n} /></span>
        </label>
    );

    return (
        <aside className="w-full lg:w-[250px] shrink-0" aria-label="Product filters">
            <div className="bg-white dark:bg-slate-900 border-2 border-ink dark:border-slate-700">
                <div className="flex items-center justify-between px-5 py-3 bg-sign text-ink border-b-2 border-ink dark:border-slate-700">
                    <div className="flex items-center gap-2">
                        <h2 className="text-[17px] font-black">Filters</h2>
                        {activeCount > 0 && (
                            <span className="text-[12px] font-black text-sign bg-ink min-w-6 h-6 px-1 flex items-center justify-center" aria-label={`${activeCount} active`}>
                                {activeCount}
                            </span>
                        )}
                    </div>
                    {activeCount > 0 && (
                        <button
                            onClick={() => onChange(EMPTY_FILTERS)}
                            type="button"
                            className="min-h-[44px] text-[14px] font-bold text-ink underline underline-offset-4 hover:no-underline"
                        >
                            Clear all
                        </button>
                    )}
                </div>

                <div className="px-5">
                    <div className="py-2 border-b-2 border-slate-200 dark:border-slate-700">
                        {toggleRow("sale", "On sale", facets?.onSale ?? 0)}
                        {toggleRow("stock", "In stock only", facets?.inStock ?? 0)}
                    </div>

                    <FilterSection title="Price" defaultOpen count={value.price ? 1 : 0}>
                        <div className="flex flex-col gap-2">
                            {PRICE_BANDS.map((band) => {
                                const active = value.price === band.id;
                                const n = facets?.bands?.[band.min] ?? 0;
                                return (
                                    <button
                                        key={band.id}
                                        onClick={() => onChange({ ...value, price: active ? "" : band.id })}
                                        type="button"
                                        aria-pressed={active}
                                        disabled={!active && n === 0}
                                        className={`w-full flex items-center text-left px-4 min-h-[44px] text-[14px] font-bold ${chip(active, n === 0)}`}
                                    >
                                        {band.label}<Count n={n} />
                                    </button>
                                );
                            })}
                        </div>
                    </FilterSection>

                    {sizes.length > 0 && (
                        <FilterSection title="Size" defaultOpen count={value.size.length}>
                            <p className="text-[13px] text-slate-600 dark:text-slate-400 mb-2">Only sizes in stock right now.</p>
                            <div className="flex flex-wrap gap-2">
                                {sizes.map(({ value: size, count }) => {
                                    const active = value.size.includes(size);
                                    return (
                                        <button
                                            key={size}
                                            onClick={() => toggle("size", size)}
                                            type="button"
                                            aria-pressed={active}
                                            disabled={!active && count === 0}
                                            aria-label={`Size ${size}, ${count} ${count === 1 ? "product" : "products"}`}
                                            className={`min-w-[48px] h-[44px] px-3 text-[14px] font-black ${chip(active, count === 0)}`}
                                        >
                                            {size}
                                        </button>
                                    );
                                })}
                            </div>
                        </FilterSection>
                    )}

                    {colors.length > 0 && (
                        <FilterSection title="Colour" defaultOpen count={value.color.length}>
                            <div className="grid grid-cols-2 gap-2">
                                {colors.map(({ value: name, count }) => {
                                    const active = value.color.includes(name);
                                    const hex = swatchFor(name);
                                    return (
                                        <button
                                            key={name}
                                            onClick={() => toggle("color", name)}
                                            type="button"
                                            aria-pressed={active}
                                            disabled={!active && count === 0}
                                            className={`flex items-center gap-2 min-h-[44px] px-2 text-[13px] font-bold text-left ${chip(active, count === 0)}`}
                                        >
                                            <span
                                                className="relative shrink-0 w-6 h-6 border-2 border-ink flex items-center justify-center text-[11px] font-black text-ink"
                                                style={{ background: hex || "repeating-linear-gradient(45deg,#e9e9f4 0 4px,#d9d9ea 4px 8px)" }}
                                                aria-hidden="true"
                                            >
                                                {active ? <HiCheck className="w-4 h-4" style={{ color: isDarkSwatch(hex) ? "#fff" : "#12123a" }} /> : !hex && name[0]}
                                            </span>
                                            <span className="truncate">{name}</span>
                                            <span className="ml-auto text-[12px] tabular-nums opacity-70">{count}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </FilterSection>
                    )}

                    {fabrics.length > 0 && (
                        <FilterSection title="Fabric" count={value.fabric.length}>{listOf("fabric", fabrics)}</FilterSection>
                    )}

                    {styles.length > 0 && (
                        <FilterSection title={styleLabel} count={value.style.length}>{listOf("style", styles)}</FilterSection>
                    )}
                </div>
            </div>
        </aside>
    );
}
