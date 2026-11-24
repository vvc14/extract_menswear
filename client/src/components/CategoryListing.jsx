import { useState, useEffect, useCallback, useRef } from "react";
import { useDispatch } from "react-redux";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { HiOutlineAdjustments, HiOutlineX } from "react-icons/hi";
import API from "../services/api";
import { showAlert } from "../redux/alertSlice";
import { buildQueryString } from "../utils/filterLogic";
import ProductCard from "./ProductCard";
import FilterSidebar from "./FilterSidebar";
import { Eagle } from "./brand/Logo";

const PER_PAGE = 12;

const SORTS = [
    { value: "newest", label: "Newest first" },
    { value: "price-low", label: "Price: low to high" },
    { value: "price-high", label: "Price: high to low" },
    { value: "name-az", label: "Name: A to Z" },
    { value: "name-za", label: "Name: Z to A" },
];

function SkeletonCard() {
    return (
        <div className="animate-pulse bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700" aria-hidden="true">
            <div className="aspect-[3/4] bg-slate-100 dark:bg-slate-800" />
            <div className="p-4 space-y-3">
                <div className="h-3 bg-slate-100 dark:bg-slate-800 w-1/3" />
                <div className="h-4 bg-slate-100 dark:bg-slate-800 w-3/4" />
                <div className="h-7 bg-slate-100 dark:bg-slate-800 w-1/3" />
                <div className="h-11 bg-slate-100 dark:bg-slate-800 w-full" />
            </div>
        </div>
    );
}

/**
 * Shared rack page for /shirts and /trousers.
 * config: { category, path, title, plural, blurb, heroImage, other: { to, label } }
 */
export default function CategoryListing({ config }) {
    const { category, path, title, plural, blurb, heroImage, other } = config;
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const location = useLocation();
    const [products, setProducts] = useState([]);
    const [status, setStatus] = useState("loading"); // loading | ready | error
    const [loadingMore, setLoadingMore] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(false);
    const [total, setTotal] = useState(0);

    const urlFabric = new URLSearchParams(location.search).get("fabric");

    const [filters, setFilters] = useState({
        fabric: urlFabric ? [urlFabric] : [],
        style: [],
        size: [],
        minPrice: 0,
        maxPrice: null, // no price limit until the shopper picks one
    });
    const [sortBy, setSortBy] = useState("newest");
    const [showMobileFilter, setShowMobileFilter] = useState(false);
    const loadMoreRef = useRef(null);
    // Only the latest request may update the list (older responses can arrive later)
    const requestSeq = useRef(0);

    // Keep the fabric filter in step with ?fabric= in the URL
    useEffect(() => {
        const f = new URLSearchParams(location.search).get("fabric");
        setFilters((prev) => ({ ...prev, fabric: f ? [f] : [] }));
    }, [location.search]);

    const fetchPage = useCallback(async (f, pageNum, append = false) => {
        const seq = ++requestSeq.current;
        if (pageNum === 1) setStatus("loading");
        else setLoadingMore(true);
        try {
            const qs = buildQueryString({ ...f, category, sort: sortBy });
            const { data } = await API.get(`/products?${qs}&page=${pageNum}&limit=${PER_PAGE}`);
            if (seq !== requestSeq.current) return;
            // Arrived from a fabric link (e.g. the home page) and nothing matches: say so and show everything
            const linkedFabric = new URLSearchParams(window.location.search).get("fabric");
            if (pageNum === 1 && linkedFabric && data.products && data.total === 0) {
                dispatch(showAlert({
                    title: "Fabric not available",
                    message: `We don't have any ${linkedFabric} ${plural} right now. Showing all ${plural} instead.`,
                }));
                navigate(path, { replace: true });
                return;
            }
            if (data.products) {
                setProducts((prev) => (append ? [...prev, ...data.products] : data.products));
                setHasMore(data.hasMore);
                setTotal(data.total);
                setPage(data.page);
            } else {
                setProducts(Array.isArray(data) ? data : []);
                setHasMore(false);
                setTotal(Array.isArray(data) ? data.length : 0);
            }
            setStatus("ready");
        } catch {
            if (seq !== requestSeq.current) return;
            if (!append) { setProducts([]); setStatus("error"); }
            setHasMore(false);
        } finally {
            if (seq === requestSeq.current) setLoadingMore(false);
        }
    }, [sortBy, dispatch, navigate, category, plural, path]);

    useEffect(() => {
        setProducts([]);
        setPage(1);
        setHasMore(false);
        fetchPage(filters, 1, false);
    }, [filters, sortBy, fetchPage]);

    const loadMore = useCallback(() => {
        if (loadingMore || !hasMore) return;
        fetchPage(filters, page + 1, true);
    }, [filters, page, hasMore, loadingMore, fetchPage]);

    // Infinite scroll
    useEffect(() => {
        if (!loadMoreRef.current) return;
        const observer = new IntersectionObserver(
            ([entry]) => { if (entry.isIntersecting && hasMore && !loadingMore) loadMore(); },
            { rootMargin: "300px" }
        );
        observer.observe(loadMoreRef.current);
        return () => observer.disconnect();
    }, [hasMore, loadingMore, loadMore]);

    return (
        <main id="main-content">
            {/* Rack header */}
            <section className="board relative overflow-hidden border-b-2 border-ink">
                <img src={heroImage} alt="" width="1920" height="2880" fetchPriority="high" className="hidden md:block absolute right-0 top-0 h-full w-[38%] object-cover border-l-2 border-ink" />
                <Eagle className="pointer-events-none absolute left-[45%] -bottom-20 h-[320px] w-auto text-white opacity-[0.06]" />
                <div className="page-wrap relative py-12 sm:py-16 md:pr-[42%]">
                    <nav aria-label="Breadcrumb" className="mb-6 text-[14px] font-semibold text-white/80">
                        <Link to="/" className="hover:text-sign underline-offset-4 hover:underline">Home</Link>
                        <span className="mx-2" aria-hidden="true">/</span>
                        <span aria-current="page" className="text-white">{title}</span>
                    </nav>
                    <h1 className="display sign-type text-[56px] sm:text-[88px] lg:text-[110px]">{title}</h1>
                    <p className="mt-5 max-w-md text-[16px] sm:text-[18px] leading-relaxed text-white/90">{blurb}</p>
                </div>
            </section>

            <div className="page-wrap pt-8 pb-16 flex flex-col gap-6">
                {/* Toolbar */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-ink dark:border-slate-700 pb-4">
                    <p className="text-[15px] text-slate-600 dark:text-slate-400" aria-live="polite">
                        {status === "loading" ? `Loading ${plural}...` : status === "error" ? "Could not load" : (
                            <><span className="font-black text-slate-900 dark:text-white text-[18px] tabular-nums">{total}</span> {total === 1 ? plural.slice(0, -1) : plural}{filters.fabric.length ? ` in ${filters.fabric.join(", ")}` : ""}</>
                        )}
                    </p>
                    <div className="flex items-center gap-2 sm:gap-3 ml-auto">
                        <label htmlFor={`sort-${category}`} className="sr-only">Sort {plural}</label>
                        <select
                            id={`sort-${category}`}
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="appearance-none min-h-[44px] bg-white dark:bg-slate-900 border-2 border-ink dark:border-slate-600 pl-3 sm:pl-4 pr-9 text-[14px] font-bold text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800"
                            style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%2355568a' d='M6 8.825a.7.7 0 0 1-.5-.2L2.3 5.4a.7.7 0 0 1 1-1L6 7.125 8.7 4.4a.7.7 0 0 1 1 1L6.5 8.625a.7.7 0 0 1-.5.2Z'/%3E%3C/svg%3E")`, backgroundRepeat: "no-repeat", backgroundPosition: "right 12px center" }}
                        >
                            {SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                        </select>
                        <button
                            type="button"
                            onClick={() => setShowMobileFilter(!showMobileFilter)}
                            className={`lg:hidden flex items-center gap-2 min-h-[44px] px-4 border-2 border-ink dark:border-slate-600 text-[14px] font-bold transition-colors ${showMobileFilter ? "bg-ink text-sign dark:bg-sign dark:text-ink" : "text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800"}`}
                            aria-expanded={showMobileFilter}
                            aria-controls={`filters-${category}`}
                        >
                            {showMobileFilter ? <HiOutlineX className="w-4 h-4" aria-hidden="true" /> : <HiOutlineAdjustments className="w-4 h-4" aria-hidden="true" />}
                            {showMobileFilter ? "Hide filters" : "Filters"}
                        </button>
                    </div>
                </div>

                <div className="flex flex-col lg:flex-row gap-6 lg:gap-10">
                    <div id={`filters-${category}`} className={`${showMobileFilter ? "block" : "hidden"} lg:block w-full lg:w-[260px] shrink-0`}>
                        <FilterSidebar category={category} selectedFabric={urlFabric || ""} onFilterChange={setFilters} />
                    </div>

                    <div className="flex-1 min-w-0">
                        {status === "loading" ? (
                            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-5" role="status" aria-label={`Loading ${plural}`}>
                                {[...Array(8)].map((_, i) => <SkeletonCard key={i} />)}
                            </div>
                        ) : status === "error" ? (
                            <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 p-8 sm:p-12 max-w-xl">
                                <p className="display text-[32px] text-slate-900 dark:text-white mb-3">Rack did not load</p>
                                <p className="text-[16px] text-slate-600 dark:text-slate-400 mb-6">We could not reach the store. Check your connection and try again.</p>
                                <button type="button" onClick={() => fetchPage(filters, 1, false)} className="btn-primary">Try again</button>
                            </div>
                        ) : products.length === 0 ? (
                            <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 p-8 sm:p-12 max-w-xl">
                                <p className="display text-[32px] text-slate-900 dark:text-white mb-3">Nothing on this rack</p>
                                <p className="text-[16px] text-slate-600 dark:text-slate-400 mb-6">
                                    No {plural} match these filters. Clear a filter or two, or try the other rack.
                                </p>
                                <Link to={other.to} className="btn-primary">{other.label}</Link>
                            </div>
                        ) : (
                            <>
                                <ul className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-5">
                                    {products.map((p, i) => (
                                        <li key={p._id}><ProductCard product={p} eager={i < 4} /></li>
                                    ))}
                                </ul>

                                <div ref={loadMoreRef} className="flex justify-center py-10" aria-live="polite">
                                    {loadingMore && (
                                        <p className="flex items-center gap-3 text-[15px] font-bold text-slate-600 dark:text-slate-400">
                                            <span className="w-5 h-5 border-[3px] border-slate-300 dark:border-slate-600 border-t-primary dark:border-t-sign rounded-full animate-spin" aria-hidden="true" />
                                            Loading more {plural}...
                                        </p>
                                    )}
                                    {!hasMore && !loadingMore && (
                                        <p className="text-[15px] font-bold text-slate-600 dark:text-slate-400">
                                            That is the whole rack: {total} {total === 1 ? plural.slice(0, -1) : plural}.{" "}
                                            <Link to={other.to} className="text-primary dark:text-sign underline underline-offset-4">{other.label}</Link>
                                        </p>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </main>
    );
}
