import { useState, useEffect, useCallback } from "react";
import API from "../services/api";
import { buildQueryString } from "../utils/filterLogic";
import ProductCard from "../components/ProductCard";
import FilterSidebar from "../components/FilterSidebar";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { HiOutlineAdjustments, HiOutlineArrowRight } from "react-icons/hi";

export default function Trousers() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({ fabric: [], style: [], minPrice: 0, maxPrice: 10000 });
    const [showMobileFilter, setShowMobileFilter] = useState(false);

    const fetchProducts = useCallback(async (f) => {
        setLoading(true);
        try {
            const qs = buildQueryString({ ...f, category: "trouser" });
            const { data } = await API.get(`/products?${qs}`);
            setProducts(data);
        } catch {
            setProducts([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchProducts(filters);
    }, [filters, fetchProducts]);

    return (
        <main id="main-content">
            {/* Page hero banner */}
            <section className="relative bg-slate-900 overflow-hidden">
                <div className="absolute inset-0 opacity-20">
                    <img src="https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=1920&q=60" alt="" className="w-full h-full object-cover" />
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-900/70" />
                <div className="relative max-w-7xl mx-auto px-8 sm:px-12 lg:px-16 py-14 sm:py-20">
                    <nav aria-label="Breadcrumb" className="mb-5">
                        <ol className="flex items-center gap-2 text-[15px]">
                            <li><Link to="/" className="text-slate-400 hover:text-white transition-colors">Home</Link></li>
                            <li className="text-slate-600">/</li>
                            <li className="text-white font-semibold">Trousers</li>
                        </ol>
                    </nav>
                    <h1 className="text-[34px] sm:text-[44px] font-extrabold text-white tracking-tight mb-4">Trousers Collection</h1>
                    <p className="text-[17px] text-slate-300 max-w-lg leading-[1.7]">
                        Formal elegance meets casual comfort. Designed for every setting in a modern man's life.
                    </p>
                </div>
            </section>

            {/* Content */}
            <div className="max-w-7xl mx-auto px-8 sm:px-12 lg:px-16 py-10 sm:py-14">
                <div className="flex items-center justify-between mb-8">
                    <p className="text-[16px] text-slate-500 font-medium">
                        {loading ? "Loading..." : <><span className="font-bold text-slate-900">{products.length}</span> product{products.length !== 1 ? "s" : ""} found</>}
                    </p>
                    <button
                        onClick={() => setShowMobileFilter(!showMobileFilter)}
                        className="lg:hidden flex items-center gap-2 px-7 py-4 rounded-xl border border-slate-200 text-[15px] font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                        aria-label="Toggle filters"
                    >
                        <HiOutlineAdjustments className="w-4 h-4" />
                        Filters
                    </button>
                </div>

                <div className="flex flex-col lg:flex-row gap-8">
                    <div className={`${showMobileFilter ? "block" : "hidden"} lg:block`}>
                        <FilterSidebar category="trouser" onFilterChange={setFilters} />
                    </div>

                    <div className="flex-1">
                        {loading ? (
                            <div className="grid grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-7">
                                {[...Array(6)].map((_, i) => (
                                    <div key={i} className="animate-pulse bg-white rounded-2xl border border-slate-200 overflow-hidden">
                                        <div className="aspect-[3/4] bg-gradient-to-b from-slate-100 to-slate-50" />
                                        <div className="p-6 space-y-3">
                                            <div className="h-3 bg-slate-100 rounded-full w-1/3" />
                                            <div className="h-4 bg-slate-100 rounded-full w-3/4" />
                                            <div className="h-3 bg-slate-100 rounded-full w-1/2" />
                                            <div className="h-5 bg-slate-100 rounded-full w-1/3" />
                                            <div className="h-10 bg-slate-100 rounded-xl w-full mt-2" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : products.length === 0 ? (
                            <div className="text-center py-28 bg-white rounded-2xl border border-slate-200">
                                <div className="text-[56px] mb-5">👖</div>
                                <p className="text-[26px] font-extrabold text-slate-900 mb-3">No trousers found</p>
                                <p className="text-[16px] text-slate-500 max-w-sm mx-auto mb-8 leading-[1.7]">
                                    Try adjusting your filters, or check back soon — our collection is always growing.
                                </p>
                                <Link to="/shirts" className="inline-flex items-center gap-2 text-[16px] font-bold text-primary hover:text-primary-dark transition-colors">
                                    Browse Shirts Instead <HiOutlineArrowRight className="w-4 h-4" />
                                </Link>
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
