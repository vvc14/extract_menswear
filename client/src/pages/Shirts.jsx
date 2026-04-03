import { useState, useEffect, useCallback } from "react";
import API from "../services/api";
import { buildQueryString } from "../utils/filterLogic";
import ProductCard from "../components/ProductCard";
import FilterSidebar from "../components/FilterSidebar";
import { Link } from "react-router-dom";
import { HiOutlineAdjustments, HiOutlineArrowRight, HiOutlineSortDescending } from "react-icons/hi";

export default function Shirts() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({ fabric: [], style: [], minPrice: 0, maxPrice: 10000 });
    const [sortBy, setSortBy] = useState("newest");
    const [showMobileFilter, setShowMobileFilter] = useState(false);

    const fetchProducts = useCallback(async (f) => {
        setLoading(true);
        try {
            const qs = buildQueryString({ ...f, category: "shirt", sort: sortBy });
            const { data } = await API.get(`/products?${qs}`);
            setProducts(data);
        } catch {
            setProducts([]);
        } finally {
            setLoading(false);
        }
    }, [sortBy]);

    useEffect(() => {
        fetchProducts(filters);
    }, [filters, sortBy, fetchProducts]);

    return (
        <main id="main-content">
            {/* Hero Banner */}
            <section style={{ background: "#1a2744" }} className="relative overflow-hidden">
                <div className="absolute inset-0">
                    <img src="https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=1920&q=60" alt="" className="w-full h-full object-cover" style={{ opacity: 0.1 }} />
                    <div className="absolute inset-0" style={{ background: "linear-gradient(100deg,rgba(26,39,68,0.98) 30%,rgba(26,39,68,0.7) 100%)" }} />
                </div>
                <div className="relative page-wrap py-16 sm:py-24">
                    <nav aria-label="Breadcrumb" className="mb-6">
                        <ol className="flex items-center gap-2 text-[13px]">
                            <li><Link to="/" className="text-slate-500 hover:text-slate-300 transition-colors">Home</Link></li>
                            <li className="text-slate-700">/</li>
                            <li className="font-semibold text-slate-300">Shirts</li>
                        </ol>
                    </nav>
                    <p className="section-label" style={{ color: "#c9a84c", marginBottom: "1rem" }}>Men's Collection</p>
                    <h1 className="text-[34px] sm:text-[46px] font-extrabold text-white tracking-tight mb-4">Shirts Collection</h1>
                    <p className="text-[16px] max-w-lg leading-[1.75]" style={{ color: "rgba(255,255,255,0.6)" }}>
                        Premium shirts crafted from the finest Linen, Oxford, Twill &amp; Satin fabrics. Every piece, a statement.
                    </p>
                </div>
            </section>

            {/* Content */}
            <div className="page-wrap py-10 sm:py-14">
                {/* Toolbar */}
                <div className="flex items-center justify-between mb-8">
                    <p className="text-[15px] text-slate-500 dark:text-slate-400">
                        {loading ? "Loading..." : <><span className="font-bold text-slate-900 dark:text-white">{products.length}</span> product{products.length !== 1 ? "s" : ""} found</>}
                    </p>
                    <div className="flex items-center gap-3">
                        {/* Sort dropdown */}
                        <div className="relative flex items-center gap-2">
                            <HiOutlineSortDescending className="w-4 h-4 text-slate-400 hidden sm:block" />
                            <select
                                id="sort-shirts"
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="appearance-none bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 pr-9 text-[14px] font-semibold text-slate-700 dark:text-slate-300 cursor-pointer hover:border-slate-300 dark:hover:border-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-900/10 transition-all"
                                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%2364748b' d='M6 8.825a.7.7 0 0 1-.5-.2L2.3 5.4a.7.7 0 0 1 1-1L6 7.125 8.7 4.4a.7.7 0 0 1 1 1L6.5 8.625a.7.7 0 0 1-.5.2Z'/%3E%3C/svg%3E")`, backgroundRepeat: "no-repeat", backgroundPosition: "right 12px center" }}
                            >
                                <option value="newest">Newest First</option>
                                <option value="price-low">Price: Low → High</option>
                                <option value="price-high">Price: High → Low</option>
                                <option value="name-az">Name: A → Z</option>
                                <option value="name-za">Name: Z → A</option>
                            </select>
                        </div>
                        <button
                            onClick={() => setShowMobileFilter(!showMobileFilter)}
                            className="lg:hidden flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-[14px] font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                            aria-label="Toggle filters"
                        >
                            <HiOutlineAdjustments className="w-4 h-4" />
                            Filters
                        </button>
                    </div>
                </div>

                <div className="flex flex-col lg:flex-row gap-8 lg:gap-10">
                    {/* Filter sidebar */}
                    <div className={`${showMobileFilter ? "block" : "hidden"} lg:block`}>
                        <FilterSidebar category="shirt" onFilterChange={setFilters} />
                    </div>

                    {/* Product grid */}
                    <div className="flex-1">
                        {loading ? (
                            <div className="grid grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-7">
                                {[...Array(6)].map((_, i) => (
                                    <div key={i} className="animate-pulse bg-white dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                                        <div className="aspect-[3/4] bg-gradient-to-b from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-900" />
                                        <div className="p-6 space-y-3">
                                            <div className="h-3 bg-slate-100 dark:bg-slate-700 rounded-full w-1/3" />
                                            <div className="h-4 bg-slate-100 dark:bg-slate-700 rounded-full w-3/4" />
                                            <div className="h-3 bg-slate-100 dark:bg-slate-700 rounded-full w-1/2" />
                                            <div className="h-5 bg-slate-100 dark:bg-slate-700 rounded-full w-1/3" />
                                            <div className="h-10 bg-slate-100 dark:bg-slate-700 rounded-xl w-full mt-2" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : products.length === 0 ? (
                            <div className="flex items-center justify-center" style={{ minHeight: "50vh" }}>
                                <div className="text-center">
                                    <div className="text-[56px] mb-5">👔</div>
                                    <p className="text-[26px] font-extrabold text-slate-900 dark:text-white mb-3">No shirts found</p>
                                    <p className="text-[16px] text-slate-500 dark:text-slate-400 max-w-sm mx-auto mb-8 leading-[1.7]">
                                        Try adjusting your filters, or check back soon — our collection is always growing.
                                    </p>
                                    <Link to="/trousers" className="inline-flex items-center gap-2 text-[16px] font-bold text-primary dark:text-gold hover:text-primary-dark dark:hover:text-gold-dark transition-colors">
                                        Browse Trousers Instead <HiOutlineArrowRight className="w-4 h-4" />
                                    </Link>
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-7">
                                {products.map((p) => (
                                    <ProductCard key={p._id} product={p} />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </main>
    );
}
