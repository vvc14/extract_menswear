import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import API from "../services/api";

const GUEST_CART_KEY = "extractGuestCart";
// Matches the server-side per-line limit
export const MAX_QTY_PER_LINE = 20;

// ─── Guest cart persistence (localStorage; storage can be unavailable) ───
export const loadGuestCart = () => {
    try {
        const raw = JSON.parse(localStorage.getItem(GUEST_CART_KEY));
        return Array.isArray(raw) ? raw.filter((i) => i && i._id && i.quantity > 0) : [];
    } catch {
        return [];
    }
};

export const saveGuestCart = (items) => {
    try {
        if (items.length) localStorage.setItem(GUEST_CART_KEY, JSON.stringify(items));
        else localStorage.removeItem(GUEST_CART_KEY);
    } catch {
        // ignore storage errors (private mode, quota)
    }
};

const clearGuestCart = () => {
    try { localStorage.removeItem(GUEST_CART_KEY); } catch { /* ignore */ }
};

// Server line → client line
const fromServer = (i) => ({
    _id: String(i.productId?._id || i.productId),
    name: i.name,
    price: i.price,
    imageUrl: i.imageUrl,
    images: i.images || [],
    category: i.category,
    fabric: i.fabric,
    style: i.style,
    shippingCost: i.shippingCost || 0,
    quantity: i.quantity,
    size: i.size || "",
    sizes: i.productId?.sizes || [],
    stock: i.stock ?? i.productId?.stock ?? 0,
});

const toServer = (items) => items.map((i) => ({ productId: i._id, size: i.size || "", quantity: i.quantity }));

const lineKey = (i) => `${i._id}::${i.size || ""}`;

// ─── Async thunks for DB sync ───

// On login: load the saved cart and merge any items added while signed out
export const fetchCart = createAsyncThunk("cart/fetchCart", async (_, { getState }) => {
    const { auth, cart } = getState();
    if (!auth.user) return [];
    const { data: dbItems } = await API.get("/cart");

    const guest = cart.synced ? [] : cart.items;
    if (guest.length === 0) return dbItems;

    const merged = new Map(toServer(dbItems.map(fromServer)).map((l) => [`${l.productId}::${l.size}`, l]));
    for (const g of toServer(guest)) {
        const key = `${g.productId}::${g.size}`;
        const existing = merged.get(key);
        if (existing) existing.quantity += g.quantity;
        else merged.set(key, g);
    }
    // The server validates, re-prices and clamps each line to available stock
    const { data } = await API.post("/cart/sync", { items: [...merged.values()] });
    clearGuestCart();
    return data;
});

export const syncCartToDB = createAsyncThunk("cart/syncToDB", async (_, { getState }) => {
    const { auth, cart } = getState();
    if (!auth.user) return null;
    const { data } = await API.post("/cart/sync", { items: toServer(cart.items) });
    return data;
});

// ─── Slice ───

const cartSlice = createSlice({
    name: "cart",
    initialState: { items: loadGuestCart(), synced: false },
    reducers: {
        // payload: product fields + size + qtyToAdd + stock (available units for that size)
        addToCart: (state, action) => {
            const { _id, size, stock, qtyToAdd } = action.payload;
            const existing = state.items.find((i) => i._id === _id && (i.size || "") === (size || ""));
            const maxStock = Math.min(Number.isFinite(stock) ? stock : 0, MAX_QTY_PER_LINE);
            const amountToAdd = qtyToAdd !== undefined ? qtyToAdd : 1;
            if (maxStock <= 0) return;
            if (existing) {
                existing.stock = maxStock;
                existing.quantity = Math.min(maxStock, existing.quantity + amountToAdd);
            } else {
                state.items.push({
                    _id,
                    name: action.payload.name,
                    price: action.payload.price,
                    imageUrl: action.payload.imageUrl,
                    images: action.payload.images || [],
                    category: action.payload.category,
                    fabric: action.payload.fabric,
                    style: action.payload.style,
                    shippingCost: action.payload.shippingCost || 0,
                    sizes: action.payload.sizes || [],
                    stock: maxStock,
                    quantity: Math.min(maxStock, amountToAdd),
                    size: size || "",
                });
            }
        },
        removeFromCart: (state, action) => {
            const { id, size } = action.payload;
            state.items = state.items.filter((i) => !(i._id === id && (i.size || "") === (size || "")));
        },
        updateQuantity: (state, action) => {
            const { id, size, quantity } = action.payload;
            const item = state.items.find((i) => i._id === id && (i.size || "") === (size || ""));
            if (item) {
                const maxStock = Math.min(Number.isFinite(item.stock) ? item.stock : 1, MAX_QTY_PER_LINE);
                item.quantity = Math.max(1, Math.min(maxStock || 1, quantity));
            }
        },
        clearCart: (state) => {
            state.items = [];
        },
        resetCart: (state) => {
            state.items = [];
            state.synced = false;
        },
        // payload: array of { id, size, stock, price, shippingCost, name, sizes } from fresh product data
        updateCartStocks: (state, action) => {
            action.payload.forEach((u) => {
                state.items.forEach((item) => {
                    if (item._id !== u.id || (item.size || "") !== (u.size || "")) return;
                    item.stock = u.stock;
                    if (u.price !== undefined) item.price = u.price;
                    if (u.shippingCost !== undefined) item.shippingCost = u.shippingCost;
                    if (u.name) item.name = u.name;
                    if (u.sizes) item.sizes = u.sizes;
                });
            });
            // Drop lines whose product no longer exists
            const removed = new Set(action.payload.filter((u) => u.deleted).map((u) => u.id));
            if (removed.size) state.items = state.items.filter((i) => !removed.has(i._id));
        },
    },
    extraReducers: (builder) => {
        builder.addCase(fetchCart.fulfilled, (state, action) => {
            state.items = (action.payload || []).map(fromServer);
            state.synced = true;
        });
        // On fetchCart failure we stay unsynced on purpose: syncing now could overwrite
        // the saved cart with only the local items. The next login retries the fetch.
        builder.addCase(syncCartToDB.fulfilled, (state, action) => {
            if (!Array.isArray(action.payload)) return;
            // Refresh server-owned fields (price, stock, name) without touching quantities
            // the user may have changed while the request was in flight
            // Only assign values that actually changed: assigning a new (even identical) array
            // would create a new state object, re-trigger the sync effect and loop forever.
            const fresh = new Map(action.payload.map((i) => { const l = fromServer(i); return [lineKey(l), l]; }));
            state.items.forEach((item) => {
                const f = fresh.get(lineKey(item));
                if (!f) return;
                if (item.price !== f.price) item.price = f.price;
                if (item.stock !== f.stock) item.stock = f.stock;
                if (item.name !== f.name) item.name = f.name;
                if (item.shippingCost !== f.shippingCost) item.shippingCost = f.shippingCost;
                if ((item.sizes || []).join("|") !== (f.sizes || []).join("|")) item.sizes = f.sizes;
            });
        });
    },
});

export const { addToCart, removeFromCart, updateQuantity, clearCart, resetCart, updateCartStocks } = cartSlice.actions;
export default cartSlice.reducer;
