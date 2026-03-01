import { useState } from "react";
import { HiChevronDown } from "react-icons/hi";

const SHIRT_FABRICS = ["Linen", "Oxford", "Twill", "Satin"];
const SHIRT_STYLES = ["Plain", "Checks", "Print"];
const TROUSER_TYPES = ["Formal", "Casual"];

function FilterSection({ title, defaultOpen = false, children }) {
    const [open, setOpen] = useState(defaultOpen);

    return (
        <div className="border-b border-slate-100 last:border-0">
            <button
                onClick={() => setOpen(!open)}
                className="w-full flex items-center justify-between py-3.5 text-left group"
                aria-expanded={open}
            >
                <span className="text-[15px] font-bold text-slate-900 uppercase tracking-wider">{title}</span>
                <HiChevronDown
                    className={`w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-transform duration-200 ${open ? "rotate-180" : ""
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
    const [priceRange, setPriceRange] = useState([0, 10000]);

    const toggleItem = (list, setList, item) => {
        const updated = list.includes(item) ? list.filter((i) => i !== item) : [...list, item];
        setList(updated);
        emitFilters(
            list === selectedFabrics ? updated : selectedFabrics,
            list === selectedStyles ? updated : selectedStyles,
            priceRange
        );
    };

    const handlePriceChange = (value) => {
        const updated = [0, Number(value)];
        setPriceRange(updated);
        emitFilters(selectedFabrics, selectedStyles, updated);
    };

    const emitFilters = (fabrics, styles, price) => {
        onFilterChange({
            fabric: fabrics,
            style: styles,
            minPrice: price[0],
            maxPrice: price[1],
        });
    };

    const clearAll = () => {
        setSelectedFabrics([]);
        setSelectedStyles([]);
        setPriceRange([0, 10000]);
        onFilterChange({ fabric: [], style: [], minPrice: 0, maxPrice: 10000 });
    };

    const filterOptions = category === "shirt" ? SHIRT_FABRICS : [];
    const styleOptions = category === "shirt" ? SHIRT_STYLES : TROUSER_TYPES;
    const styleLabel = category === "shirt" ? "Style" : "Type";
    const hasActiveFilters = selectedFabrics.length > 0 || selectedStyles.length > 0 || priceRange[1] < 10000;
    const activeCount = selectedFabrics.length + selectedStyles.length + (priceRange[1] < 10000 ? 1 : 0);

    return (
        <aside className="w-full lg:w-[250px] shrink-0" aria-label="Product filters">
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                        <h3 className="text-[16px] font-extrabold text-slate-900">Filters</h3>
                        {activeCount > 0 && (
                            <span className="text-[11px] font-bold text-white bg-primary w-5 h-5 rounded-full flex items-center justify-center">
                                {activeCount}
                            </span>
                        )}
                    </div>
                    {hasActiveFilters && (
                        <button
                            onClick={clearAll}
                            className="text-[14px] font-bold text-primary hover:text-primary-dark transition-colors"
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
                                            className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary accent-primary cursor-pointer"
                                        />
                                        <span className="text-[15px] text-slate-600 group-hover:text-slate-900 font-medium transition-colors">
                                            {fabric}
                                        </span>
                                        {selectedFabrics.includes(fabric) && (
                                            <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />
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
                                        className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary accent-primary cursor-pointer"
                                    />
                                    <span className="text-[15px] text-slate-600 group-hover:text-slate-900 font-medium transition-colors">
                                        {style}
                                    </span>
                                    {selectedStyles.includes(style) && (
                                        <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />
                                    )}
                                </label>
                            ))}
                        </div>
                    </FilterSection>

                    <FilterSection title="Price" defaultOpen={false}>
                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-[15px] font-semibold text-slate-900">
                                    Up to ₹{priceRange[1].toLocaleString("en-IN")}
                                </span>
                            </div>
                            <input
                                type="range"
                                min={0}
                                max={10000}
                                step={100}
                                value={priceRange[1]}
                                onChange={(e) => handlePriceChange(e.target.value)}
                                className="w-full h-1.5 bg-slate-100 rounded-full appearance-none cursor-pointer"
                                aria-label="Maximum price filter"
                            />
                            <div className="flex justify-between mt-2 text-[13px] text-slate-400 font-medium">
                                <span>₹0</span>
                                <span>₹10,000</span>
                            </div>
                        </div>
                    </FilterSection>
                </div>
            </div>
        </aside>
    );
}
