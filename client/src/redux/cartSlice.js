import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import API from "../services/api";

// ─── Async thunks for DB sync ───

export const fetchCart = createAsyncThunk("cart/fetchCart", async (_, { getState }) => {
    const { auth } = getState();
    if (!auth.user) return [];
    const { data } = await API.get("/cart");
    return data;
});

export const syncCartToDB = createAsyncThunk("cart/syncToDB", async (_, { getState }) => {
    const { auth, cart } = getState();
    if (!auth.user) return cart.items;
    const { data } = await API.post("/cart/sync", {
        items: cart.items.map((i) => ({
            productId: i._id,
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
        })),
    });
    return data;
});

// ─── Slice ───

const cartSlice = createSlice({
    name: "cart",
    initialState: { items: [], synced: false },
    reducers: {
        addToCart: (state, action) => {
            const { _id, size, stock, qtyToAdd } = action.payload;
            const existing = state.items.find((i) => i._id === _id && (i.size || "") === (size || ""));
            const maxStock = stock !== undefined ? stock : 99999;
            const amountToAdd = qtyToAdd !== undefined ? qtyToAdd : 1;
            if (existing) {
                existing.quantity = Math.min(maxStock, existing.quantity + amountToAdd);
            } else {
                state.items.push({ 
                    ...action.payload, 
                    quantity: Math.min(maxStock, amountToAdd), 
                    size: size || "" 
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
                const maxStock = item.stock !== undefined ? item.stock : 99999;
                item.quantity = Math.min(maxStock, Math.max(1, quantity));
            }
        },
        clearCart: (state) => {
            state.items = [];
        },
        resetCart: (state) => {
            state.items = [];
            state.synced = false;
        },
    },
    extraReducers: (builder) => {
        builder.addCase(fetchCart.fulfilled, (state, action) => {
            // Map DB items to frontend format (productId → _id)
            state.items = (action.payload || []).map((i) => ({
                _id: i.productId?._id || i.productId,
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
                stock: i.productId?.stock !== undefined ? i.productId.stock : (i.stock !== undefined ? i.stock : 99999),
            }));
            state.synced = true;
        });
    },
});

export const { addToCart, removeFromCart, updateQuantity, clearCart, resetCart } = cartSlice.actions;
export default cartSlice.reducer;
