import { useState, useEffect } from "react";
import { HiChevronDown } from "react-icons/hi";
import API from "../services/api";
import { PRICE_BANDS } from "../utils/priceBands";

function FilterSection({ title, defaultOpen = false, children }) {
    const [open, setOpen] = useState(defaultOpen);

    return (
        <div className="border-b-2 border-slate-200 dark:border-slate-700 last:border-0">
            <button
                onClick={() => setOpen(!open)}
                type="button"
                className="w-full min-h-[48px] flex items-center justify-between py-3 text-left group"
                aria-expanded={open}
            >
                <span className="text-[15px] font-black text-slate-900 dark:text-white uppercase">{title}</span>
                <HiChevronDown
                    aria-hidden="true"
                    className={`w-5 h-5 text-slate-500 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white transition-transform duration-200 ${open ? "rotate-180" : ""}`}
                />
            </button>
            <div className={`overflow-hidden transition-all duration-300 ease-in-out ${open ? "max-h-[500px] opacity-100 pb-4" : "max-h-0 opacity-0"}`}>
                {children}
            </div>
        </div>
    );
}

const chip = (active) =>
    `border-2 transition-colors active:translate-y-px ${active
        ? "bg-primary text-white border-ink dark:bg-sign dark:text-ink dark:border-black shadow-[2px_2px_0_#12123a] dark:shadow-[2px_2px_0_#000]"
        : "bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-600 hover:border-ink dark:hover:border-sign"}`;

export const EMPTY_FILTERS = { fabric: [], style: [], size: [], price: "" };

/**
 * Controlled filter panel. The parent owns the state:
 *   value    = { fabric: string[], style: string[], size: string[], price: bandId | "" }
 *   onChange = (nextValue) => void
 * Options (fabrics, styles, sizes) come from the admin's category settings.
 */
export default function FilterSidebar({ category, value = EMPTY_FILTERS, onChange }) {
    const [catOptions, setCatOptions] = useState({ fabrics: [], styles: [], sizes: [] });

    useEffect(() => {
        API.get("/products/category-options").then(({ data }) => {
            if (data[category]) setCatOptions(data[category]);
        }).catch(() => {});
    }, [category]);

    const toggle = (key, item) => {
        const list = value[key];
        onChange({ ...value, [key]: list.includes(item) ? list.filter((i) => i !== item) : [...list, item] });
    };

    const styleLabel = category === "shirt" ? "Style" : "Type";
    const activeCount = value.fabric.length + value.style.length + value.size.length + (value.price ? 1 : 0);

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
                    <FilterSection title="Price" defaultOpen={true}>
                        <div className="flex flex-col gap-2">
                            {PRICE_BANDS.map((band) => {
                                const active = value.price === band.id;
                                return (
                                    <button
                                        key={band.id}
                                        onClick={() => onChange({ ...value, price: active ? "" : band.id })}
                                        type="button"
                                        aria-pressed={active}
                                        className={`w-full text-left px-4 min-h-[44px] text-[14px] font-bold ${chip(active)}`}
                                    >
                                        {band.label}
                                    </button>
                                );
                            })}
                        </div>
                    </FilterSection>

                    {(catOptions.sizes || []).length > 0 && (
                        <FilterSection title="Size" defaultOpen={true}>
                            <div className="flex flex-wrap gap-2">
                                {catOptions.sizes.map((size) => (
                                    <button
                                        key={size}
                                        onClick={() => toggle("size", size)}
                                        type="button"
                                        aria-pressed={value.size.includes(size)}
                                        className={`min-w-[48px] h-[44px] px-3 text-[14px] font-black ${chip(value.size.includes(size))}`}
                                    >
                                        {size}
                                    </button>
                                ))}
                            </div>
                        </FilterSection>
                    )}

                    {catOptions.fabrics.length > 0 && (
                        <FilterSection title="Fabric">
                            <div className="flex flex-col gap-2">
                                {catOptions.fabrics.map((fabric) => (
                                    <label key={fabric} className="flex items-center gap-3 cursor-pointer group min-h-[40px]">
                                        <input
                                            type="checkbox"
                                            checked={value.fabric.includes(fabric)}
                                            onChange={() => toggle("fabric", fabric)}
                                            className="w-5 h-5 accent-primary dark:accent-[#fff200] cursor-pointer"
                                        />
                                        <span className="text-[15px] text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white font-semibold">{fabric}</span>
                                    </label>
                                ))}
                            </div>
                        </FilterSection>
                    )}

                    {catOptions.styles.length > 0 && (
                        <FilterSection title={styleLabel}>
                            <div className="flex flex-col gap-2">
                                {catOptions.styles.map((style) => (
                                    <label key={style} className="flex items-center gap-3 cursor-pointer group min-h-[40px]">
                                        <input
                                            type="checkbox"
                                            checked={value.style.includes(style)}
                                            onChange={() => toggle("style", style)}
                                            className="w-5 h-5 accent-primary dark:accent-[#fff200] cursor-pointer"
                                        />
                                        <span className="text-[15px] text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white font-semibold">{style}</span>
                                    </label>
                                ))}
                            </div>
                        </FilterSection>
                    )}
                </div>
            </div>
        </aside>
    );
}
