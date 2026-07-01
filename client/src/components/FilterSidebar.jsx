import { useState, useEffect } from "react";
import { HiChevronDown } from "react-icons/hi";
import API from "../services/api";

function FilterSection({ title, defaultOpen = false, children }) {
    const [open, setOpen] = useState(defaultOpen);

    return (
        <div className="border-b border-slate-100 dark:border-slate-700 last:border-0">
            <button
                onClick={() => setOpen(!open)}
                className="w-full flex items-center justify-between py-3.5 text-left group"
                aria-expanded={open}
            >
                <span className="text-[15px] font-bold text-slate-900 dark:text-white uppercase tracking-wider">{title}</span>
                <HiChevronDown
                    className={`w-4 h-4 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-transform duration-200 ${open ? "rotate-180" : ""
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

export default function FilterSidebar({ category, onFilterChange }) {
    const [selectedFabrics, setSelectedFabrics] = useState([]);
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

    const handlePriceChange = (_value) => {
        // No longer used — price is now selected via fixed quarter buttons
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
            <div className="bg-white dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-700">
                    <div className="flex items-center gap-2">
                        <h3 className="text-[16px] font-extrabold text-slate-900 dark:text-white">Filters</h3>
                        {activeCount > 0 && (
                            <span className="text-[11px] font-bold text-white bg-primary w-5 h-5 rounded-full flex items-center justify-center">
                                {activeCount}
                            </span>
                        )}
                    </div>
                    {hasActiveFilters && (
                        <button
                            onClick={clearAll}
                            className="text-[14px] font-bold text-primary dark:text-gold hover:text-primary-dark dark:hover:text-gold-dark transition-colors"
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
                                    <label key={fabric} className="flex items-center gap-3 cursor-pointer group py-0.5">
                                        <input
                                            type="checkbox"
                                            checked={selectedFabrics.includes(fabric)}
                                            onChange={() => toggleItem(selectedFabrics, setSelectedFabrics, fabric)}
                                            className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-primary focus:ring-primary accent-primary cursor-pointer"
                                        />
                                        <span className="text-[15px] text-slate-600 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white font-medium transition-colors">
                                            {fabric}
                                        </span>
                                        {selectedFabrics.includes(fabric) && (
                                            <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary dark:bg-gold" />
                                        )}
                                    </label>
                                ))}
                            </div>
                        </FilterSection>
                    )}

                    <FilterSection title={styleLabel} defaultOpen={false}>
                        <div className="flex flex-col gap-2">
                            {styleOptions.map((style) => (
                                <label key={style} className="flex items-center gap-3 cursor-pointer group py-0.5">
                                    <input
                                        type="checkbox"
                                        checked={selectedStyles.includes(style)}
                                        onChange={() => toggleItem(selectedStyles, setSelectedStyles, style)}
                                        className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-primary focus:ring-primary accent-primary cursor-pointer"
                                    />
                                    <span className="text-[15px] text-slate-600 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white font-medium transition-colors">
                                        {style}
                                    </span>
                                    {selectedStyles.includes(style) && (
                                        <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary dark:bg-gold" />
                                    )}
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
                                        className={`min-w-[44px] h-[38px] px-3 rounded-xl text-[14px] font-bold border-2 transition-all duration-200 cursor-pointer ${
                                            selectedSizes.includes(size)
                                                ? "bg-primary dark:bg-gold text-white border-primary dark:border-gold shadow-sm shadow-primary/20 dark:shadow-gold/20 scale-105"
                                                : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:border-primary/40 dark:hover:border-gold/40 hover:text-slate-900 dark:hover:text-white"
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
                                        className={`w-full text-left px-4 py-2.5 rounded-xl text-[14px] font-semibold border-2 transition-all duration-200 cursor-pointer ${
                                            isActive
                                                ? "bg-primary dark:bg-gold text-white border-primary dark:border-gold shadow-sm shadow-primary/20 dark:shadow-gold/20"
                                                : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:border-primary/40 dark:hover:border-gold/40 hover:text-slate-900 dark:hover:text-white"
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
