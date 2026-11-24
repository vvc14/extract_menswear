import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useDispatch } from "react-redux";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { HiOutlineAdjustments, HiOutlineX } from "react-icons/hi";
import API from "../services/api";
import { showAlert } from "../redux/alertSlice";
import { buildQueryString } from "../utils/filterLogic";
import { PRICE_BANDS, bandById } from "../utils/priceBands";
import ProductCard from "./ProductCard";
import FilterSidebar from "./FilterSidebar";
import { Eagle } from "./brand/Logo";
import Hanger from "./brand/Hanger";

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
 *
 * Fabric and price live in the URL (?fabric=Cotton,Denim&price=under-500) so a filtered rack can be
 * linked to and shared; size and style are local to the visit.
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
    const [local, setLocal] = useState({ style: [], size: [] });
    const [sortBy, setSortBy] = useState("newest");
    const [showMobileFilter, setShowMobileFilter] = useState(false);
    const loadMoreRef = useRef(null);
    const requestSeq = useRef(0); // only the latest request may update the list
    // Arrived from a fabric link (home page): if that fabric is empty, say so and show the whole rack
    const cameFromLink = useRef(new URLSearchParams(location.search).has("fabric"));

    const filters = useMemo(() => {
        const q = new URLSearchParams(location.search);
        return {
            fabric: (q.get("fabric") || "").split(",").map((s) => s.trim()).filter(Boolean),
            price: bandById(q.get("price"))?.id || "",
            ...local,
        };
    }, [location.search, local]);

    const plural1 = (n) => (n === 1 ? plural.slice(0, -1) : plural);

    const setFilters = useCallback((next) => {
        cameFromLink.current = false;
        setLocal({ style: next.style, size: next.size });
        const q = new URLSearchParams();
        if (next.fabric.length) q.set("fabric", next.fabric.join(","));
        if (next.price) q.set("price", next.price);
        const search = q.toString() ? `?${q}` : "";
        if (search !== location.search) navigate(`${path}${search}`, { replace: true });
    }, [location.search, navigate, path]);

    const fetchPage = useCallback(async (f, pageNum, append = false) => {
        const seq = ++requestSeq.current;
        if (pageNum === 1) setStatus("loading");
        else setLoadingMore(true);
        try {
            const band = bandById(f.price);
            const qs = buildQueryString({
                fabric: f.fabric, style: f.style, size: f.size,
                minPrice: band?.min ?? 0, maxPrice: band?.max ?? null,
                category, sort: sortBy,
            });
            const { data } = await API.get(`/products?${qs}&page=${pageNum}&limit=${PER_PAGE}`);
            if (seq !== requestSeq.current) return;
            if (pageNum === 1 && cameFromLink.current && f.fabric.length && data.products && data.total === 0) {
                cameFromLink.current = false;
                dispatch(showAlert({
                    title: "Fabric not available",
                    message: `We don't have any ${f.fabric.join(", ")} ${plural} right now. Showing all ${plural} instead.`,
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

    useEffect(() => {
        if (!loadMoreRef.current) return;
        const observer = new IntersectionObserver(
            ([entry]) => { if (entry.isIntersecting && hasMore && !loadingMore) loadMore(); },
            { rootMargin: "300px" }
        );
        observer.observe(loadMoreRef.current);
        return () => observer.disconnect();
    }, [hasMore, loadingMore, loadMore]);

    // Removable chips for whatever is filtering the rack right now
    const activeChips = [
        ...(filters.price ? [{ key: "price", label: bandById(filters.price).label, remove: () => setFilters({ ...filters, price: "" }) }] : []),
        ...filters.size.map((s) => ({ key: `size-${s}`, label: `Size ${s}`, remove: () => setFilters({ ...filters, size: filters.size.filter((x) => x !== s) }) })),
        ...filters.fabric.map((f) => ({ key: `fabric-${f}`, label: f, remove: () => setFilters({ ...filters, fabric: filters.fabric.filter((x) => x !== f) }) })),
        ...filters.style.map((s) => ({ key: `style-${s}`, label: s, remove: () => setFilters({ ...filters, style: filters.style.filter((x) => x !== s) }) })),
    ];

    return (
        <main id="main-content">
            {/* Rack header: the rack's name on the board, its price bands hanging underneath */}
            <section className="board relative overflow-hidden border-b-2 border-ink">
                <img src={heroImage} alt="" width="1920" height="2880" fetchPriority="high" className="hidden md:block absolute right-0 top-0 h-full w-[38%] object-cover border-l-2 border-ink" />
                <Eagle className="pointer-events-none absolute left-[45%] -bottom-20 h-[320px] w-auto text-white opacity-[0.06]" />
                <div className="page-wrap relative pt-12 pb-10 sm:pt-16 sm:pb-12 md:pr-[42%]">
                    <nav aria-label="Breadcrumb" className="mb-6 text-[14px] font-semibold text-white/80">
                        <Link to="/" className="hover:text-sign underline-offset-4 hover:underline">Home</Link>
                        <span className="mx-2" aria-hidden="true">/</span>
                        <span aria-current="page" className="text-white">{title}</span>
                    </nav>
                    <h1 className="display sign-type text-[56px] sm:text-[88px] lg:text-[110px]">{title}</h1>
                    <p className="mt-5 max-w-md text-[16px] sm:text-[18px] leading-relaxed text-white/90">{blurb}</p>

                    <div className="mt-8">
                        <p className="text-[13px] font-black uppercase tracking-[0.06em] text-white/85 mb-2" style={{ fontStretch: "115%" }}>By price</p>
                        <ul className="flex flex-wrap gap-x-3 gap-y-4">
                            {PRICE_BANDS.map((band) => {
                                const active = filters.price === band.id;
                                return (
                                    <li key={band.id}>
                                        <button
                                            type="button"
                                            onClick={() => setFilters({ ...filters, price: active ? "" : band.id })}
                                            aria-pressed={active}
                                            className={`relative inline-flex items-center min-h-[44px] pl-6 pr-4 text-[15px] font-black border-2 border-ink transition-transform active:translate-y-px ${active
                                                ? "bg-white text-primary shadow-[3px_3px_0_#fff200] -rotate-2"
                                                : "bg-sign text-ink shadow-[3px_3px_0_#12123a] hover:-rotate-2"}`}
                                            style={{ fontStretch: "112%", clipPath: "polygon(12px 0, 100% 0, 100% 100%, 12px 100%, 0 50%)" }}
                                        >
                                            <span className="absolute left-[9px] top-1/2 -mt-[3px] w-[6px] h-[6px] rounded-full bg-primary" aria-hidden="true" />
                                            {band.label}
                                        </button>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                </div>
            </section>

            <div className="page-wrap pt-8 pb-16 flex flex-col gap-6">
                {/* Toolbar */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-ink dark:border-slate-700 pb-4">
                    <div className="flex flex-wrap items-center gap-2 min-w-0">
                        <p className="text-[15px] text-slate-600 dark:text-slate-400 mr-2" aria-live="polite">
                            {status === "loading" ? `Loading ${plural}...` : status === "error" ? "Could not load" : (
                                <><span className="font-black text-slate-900 dark:text-white text-[18px] tabular-nums">{total}</span> {plural1(total)}</>
                            )}
                        </p>
                        {activeChips.map((c) => (
                            <button
                                key={c.key}
                                type="button"
                                onClick={c.remove}
                                className="inline-flex items-center gap-1.5 min-h-[36px] px-2.5 text-[13px] font-extrabold bg-ink text-white dark:bg-sign dark:text-ink border-2 border-ink dark:border-black hover:bg-hot dark:hover:bg-white"
                                aria-label={`Remove filter: ${c.label}`}
                            >
                                {c.label}
                                <HiOutlineX className="w-3.5 h-3.5" aria-hidden="true" />
                            </button>
                        ))}
                    </div>
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
                        <div className="lg:sticky lg:top-32">
                            <FilterSidebar category={category} value={filters} onChange={setFilters} />
                        </div>
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
                            <div className="relative border-2 border-dashed border-slate-300 dark:border-slate-600 p-8 sm:p-12 max-w-xl">
                                <div className="flex gap-6 mb-6 text-slate-300 dark:text-slate-600" aria-hidden="true">
                                    <Hanger className="w-20" /><Hanger className="w-20 rotate-6" /><Hanger className="w-20 -rotate-3" />
                                </div>
                                <p className="display text-[32px] text-slate-900 dark:text-white mb-3">Empty hangers</p>
                                <p className="text-[16px] text-slate-600 dark:text-slate-400 mb-6">
                                    No {plural} match these filters. Clear a filter or two, or try the other rack.
                                </p>
                                <div className="flex flex-wrap gap-3">
                                    {activeChips.length > 0 && (
                                        <button type="button" onClick={() => setFilters({ fabric: [], style: [], size: [], price: "" })} className="btn-primary">Clear filters</button>
                                    )}
                                    <Link to={other.to} className="btn-outline">{other.label}</Link>
                                </div>
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
                                            That is the whole rack: {total} {plural1(total)}.{" "}
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
