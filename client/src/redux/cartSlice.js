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
            category: i.category,
            fabric: i.fabric,
            style: i.style,
            quantity: i.quantity,
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
            const existing = state.items.find((i) => i._id === action.payload._id);
            if (existing) {
                existing.quantity += 1;
            } else {
                state.items.push({ ...action.payload, quantity: 1 });
            }
        },
        removeFromCart: (state, action) => {
            state.items = state.items.filter((i) => i._id !== action.payload);
        },
        updateQuantity: (state, action) => {
            const item = state.items.find((i) => i._id === action.payload.id);
            if (item) {
                item.quantity = Math.max(1, action.payload.quantity);
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
                category: i.category,
                fabric: i.fabric,
                style: i.style,
                quantity: i.quantity,
            }));
            state.synced = true;
        });
    },
});

export const { addToCart, removeFromCart, updateQuantity, clearCart, resetCart } = cartSlice.actions;
export default cartSlice.reducer;
