import { useCallback, useEffect, useState } from "react";
import API from "../services/api";

// The whole catalogue (it is small: a single shop's racks), loaded once and shared by every
// component that needs to talk about real stock: price bands, biggest markdowns, the delivery line.
// Cached for the session so the ticker, home page and shipping page do not each refetch.
let cache = null; // { at, products }
let inflight = null;
const TTL = 5 * 60 * 1000;

function load(force = false) {
    if (!force && cache && Date.now() - cache.at < TTL) return Promise.resolve(cache.products);
    if (!force && inflight) return inflight;
    // Every page, not just the first 100: the delivery line promises something about *all* stock.
    // shortcut: whole catalogue in memory, fine to ~2,000 products; past that move these numbers to /products/facets
    const page = (n) => API.get(`/products?limit=100&sort=newest&page=${n}`).then(({ data }) => data);
    inflight = page(1)
        .then(async (first) => {
            const rest = await Promise.all(Array.from({ length: Math.max(0, (first.pages || 1) - 1) }, (_, i) => page(i + 2)));
            const products = [first, ...rest].flatMap((d) => d.products || []);
            cache = { at: Date.now(), products };
            return products;
        })
        .finally(() => { inflight = null; });
    return inflight;
}

/** status: "loading" | "ready" | "error" */
export default function useShopStock() {
    const [state, setState] = useState(() =>
        cache ? { status: "ready", products: cache.products } : { status: "loading", products: [] }
    );

    const run = useCallback((force) => {
        if (force) setState({ status: "loading", products: [] });
        load(force)
            .then((products) => setState({ status: "ready", products }))
            .catch(() => setState({ status: "error", products: [] }));
    }, []);

    useEffect(() => { run(false); }, [run]);

    return { ...state, retry: () => run(true) };
}

/** What delivery costs across the stock, worded only from real data. */
export function deliveryLine(products) {
    if (!products?.length) return null;
    const inStock = products.filter((p) => p.stock > 0);
    const list = inStock.length ? inStock : products;
    const charged = list.filter((p) => Number(p.shippingCost) > 0);
    if (charged.length === 0) return { free: true, text: "Free delivery on everything in stock" };
    if (charged.length < list.length) return { free: false, text: "Free delivery on many pieces, charge shown before you pay" };
    return { free: false, text: "Delivery charge shown on each piece, before you pay" };
}
