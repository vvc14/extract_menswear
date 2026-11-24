import { useState, useEffect } from "react";
import { HiChevronDown } from "react-icons/hi";
import API from "../services/api";

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
                    className={`w-5 h-5 text-slate-500 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white transition-transform duration-200 ${open ? "rotate-180" : ""
                        }`}
                />
            </button>
            <div
                className={`overflow-hidden transition-all duration-300 ease-in-out ${open ? "max-h-[500px] opacity-100 pb-4" : "max-h-0 opacity-0"
                    }`}
            >
                {children}
            </div>
        </div>
    );
}

export default function FilterSidebar({ category, selectedFabric = "", onFilterChange }) {
    const [selectedFabrics, setSelectedFabrics] = useState(selectedFabric ? [selectedFabric] : []);

    // Keep in sync when the fabric in the URL changes (links from the home page, fallback to all items)
    useEffect(() => {
        setSelectedFabrics(selectedFabric ? [selectedFabric] : []);
    }, [selectedFabric]);
    const [selectedStyles, setSelectedStyles] = useState([]);
    const [selectedSizes, setSelectedSizes] = useState([]);
    const [priceRange, setPriceRange] = useState([0, 100000]); // Use a safe large default initially
    const [catOptions, setCatOptions] = useState({ fabrics: [], styles: [], sizes: [], maxPrice: 1000 });

    useEffect(() => {
        API.get("/products/category-options").then(({ data }) => {
            if (data[category]) setCatOptions(data[category]);
        }).catch(() => {});
    }, [category]);

    const filterOptions = catOptions.fabrics;
    const styleOptions = catOptions.styles;
    const sizeOptions = catOptions.sizes || [];

    const toggleItem = (list, setList, item) => {
        const updated = list.includes(item) ? list.filter((i) => i !== item) : [...list, item];
        setList(updated);
        emitFilters(
            list === selectedFabrics ? updated : selectedFabrics,
            list === selectedStyles ? updated : selectedStyles,
            list === selectedSizes ? updated : selectedSizes,
            priceRange
        );
    };

    const emitFilters = (fabrics, styles, sizes, price) => {
        onFilterChange({
            fabric: fabrics,
            style: styles,
            size: sizes,
            minPrice: price[0],
            maxPrice: price[1],
        });
    };

    const clearAll = () => {
        setSelectedFabrics([]);
        setSelectedStyles([]);
        setSelectedSizes([]);
        setPriceRange([0, 100000]);
        onFilterChange({ fabric: [], style: [], size: [], minPrice: 0, maxPrice: 100000 });
    };

    const styleLabel = category === "shirt" ? "Style" : "Type";
    const hasActiveFilters = selectedFabrics.length > 0 || selectedStyles.length > 0 || selectedSizes.length > 0 || priceRange[0] !== 0 || priceRange[1] !== 100000;
    const activeCount = selectedFabrics.length + selectedStyles.length + selectedSizes.length + (priceRange[0] !== 0 || priceRange[1] !== 100000 ? 1 : 0);
    
    // Dynamic price partitions
    const max = catOptions.maxPrice || 1000;
    const q1 = Math.round(max * 0.25);
    const q2 = Math.round(max * 0.50);
    const q3 = Math.round(max * 0.75);
    
    const pricePartitions = [
        { label: `Under ₹${q1}`, min: 0, max: q1 },
        { label: `₹${q1} – ₹${q2}`, min: q1, max: q2 },
        { label: `₹${q2} – ₹${q3}`, min: q2, max: q3 },
        { label: `₹${q3} – ₹${max}`, min: q3, max: max },
    ];

    return (
        <aside className="w-full lg:w-[250px] shrink-0" aria-label="Product filters">
            <div className="bg-white dark:bg-slate-900 border-2 border-ink dark:border-slate-700">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-3 bg-sign text-ink border-b-2 border-ink dark:border-slate-700">
                    <div className="flex items-center gap-2">
                        <h2 className="text-[17px] font-black">Filters</h2>
                        {activeCount > 0 && (
                            <span className="text-[12px] font-black text-sign bg-ink min-w-6 h-6 px-1 flex items-center justify-center" aria-label={`${activeCount} active`}>
                                {activeCount}
                            </span>
                        )}
                    </div>
                    {hasActiveFilters && (
                        <button
                            onClick={clearAll}
                            type="button"
                            className="min-h-[44px] text-[14px] font-bold text-ink underline underline-offset-4 hover:no-underline"
                        >
                            Clear all
                        </button>
                    )}
                </div>

                {/* Filter sections */}
                <div className="px-5">
                    {filterOptions.length > 0 && (
                        <FilterSection title="Fabric" defaultOpen={false}>
                            <div className="flex flex-col gap-2">
                                {filterOptions.map((fabric) => (
                                    <label key={fabric} className="flex items-center gap-3 cursor-pointer group min-h-[40px]">
                                        <input
                                            type="checkbox"
                                            checked={selectedFabrics.includes(fabric)}
                                            onChange={() => toggleItem(selectedFabrics, setSelectedFabrics, fabric)}
                                            className="w-5 h-5 accent-primary dark:accent-[#fff200] cursor-pointer"
                                        />
                                        <span className="text-[15px] text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white font-semibold">
                                            {fabric}
                                        </span>
                                    </label>
                                ))}
                            </div>
                        </FilterSection>
                    )}

                    <FilterSection title={styleLabel} defaultOpen={false}>
                        <div className="flex flex-col gap-2">
                            {styleOptions.map((style) => (
                                <label key={style} className="flex items-center gap-3 cursor-pointer group min-h-[40px]">
                                    <input
                                        type="checkbox"
                                        checked={selectedStyles.includes(style)}
                                        onChange={() => toggleItem(selectedStyles, setSelectedStyles, style)}
                                        className="w-5 h-5 accent-primary dark:accent-[#fff200] cursor-pointer"
                                    />
                                    <span className="text-[15px] text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white font-semibold">
                                        {style}
                                    </span>
                                </label>
                            ))}
                        </div>
                    </FilterSection>

                    {sizeOptions.length > 0 && (
                        <FilterSection title="Size" defaultOpen={true}>
                            <div className="flex flex-wrap gap-2">
                                {sizeOptions.map((size) => (
                                    <button
                                        key={size}
                                        onClick={() => toggleItem(selectedSizes, setSelectedSizes, size)}
                                        type="button"
                                        aria-pressed={selectedSizes.includes(size)}
                                        className={`min-w-[48px] h-[44px] px-3 text-[14px] font-black border-2 transition-colors ${
                                            selectedSizes.includes(size)
                                                ? "bg-primary text-white border-ink dark:bg-sign dark:text-ink dark:border-black shadow-[2px_2px_0_#12123a] dark:shadow-[2px_2px_0_#000]"
                                                : "bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-600 hover:border-ink dark:hover:border-sign"
                                        }`}
                                    >
                                        {size}
                                    </button>
                                ))}
                            </div>
                        </FilterSection>
                    )}

                    <FilterSection title="Price" defaultOpen={false}>
                        <div className="flex flex-col gap-2">
                            {pricePartitions.map((range) => {
                                const isActive = priceRange[0] === range.min && priceRange[1] === range.max;
                                return (
                                    <button
                                        key={range.label}
                                        onClick={() => {
                                            if (isActive) {
                                                setPriceRange([0, 100000]);
                                                emitFilters(selectedFabrics, selectedStyles, selectedSizes, [0, 100000]);
                                            } else {
                                                setPriceRange([range.min, range.max]);
                                                emitFilters(selectedFabrics, selectedStyles, selectedSizes, [range.min, range.max]);
                                            }
                                        }}
                                        type="button"
                                        aria-pressed={isActive}
                                        className={`w-full text-left px-4 min-h-[44px] text-[14px] font-bold border-2 transition-colors ${
                                            isActive
                                                ? "bg-primary text-white border-ink dark:bg-sign dark:text-ink dark:border-black shadow-[2px_2px_0_#12123a] dark:shadow-[2px_2px_0_#000]"
                                                : "bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-600 hover:border-ink dark:hover:border-sign"
                                        }`}
                                    >
                                        {range.label}
                                    </button>
                                );
                            })}
                        </div>
                    </FilterSection>
                </div>
            </div>
        </aside>
    );
}
