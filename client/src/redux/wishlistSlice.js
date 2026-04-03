import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import API from "../services/api";

// ─── Async thunks for DB sync ───

export const fetchWishlist = createAsyncThunk("wishlist/fetchWishlist", async (_, { getState }) => {
    const { auth } = getState();
    if (!auth.user) return [];
    const { data } = await API.get("/wishlist");
    return data;
});

export const syncWishlistToDB = createAsyncThunk("wishlist/syncToDB", async (_, { getState }) => {
    const { auth, wishlist } = getState();
    if (!auth.user) return wishlist.items;
    const { data } = await API.post("/wishlist/sync", {
        items: wishlist.items.map((i) => ({
            productId: i._id,
            name: i.name,
            price: i.price,
            imageUrl: i.imageUrl,
            category: i.category,
            fabric: i.fabric,
            style: i.style,
            discount: i.discount,
            originalPrice: i.originalPrice,
        })),
    });
    return data;
});

// ─── Slice ───

const wishlistSlice = createSlice({
    name: "wishlist",
    initialState: { items: [], synced: false },
    reducers: {
        toggleWishlist: (state, action) => {
            const index = state.items.findIndex((i) => i._id === action.payload._id);
            if (index >= 0) {
                state.items.splice(index, 1);
            } else {
                state.items.push({ ...action.payload });
            }
        },
        removeFromWishlist: (state, action) => {
            state.items = state.items.filter((i) => i._id !== action.payload);
        },
        clearWishlist: (state) => {
            state.items = [];
        },
        resetWishlist: (state) => {
            state.items = [];
            state.synced = false;
        },
    },
    extraReducers: (builder) => {
        builder.addCase(fetchWishlist.fulfilled, (state, action) => {
            state.items = (action.payload || []).map((i) => ({
                _id: i.productId?._id || i.productId,
                name: i.name,
                price: i.price,
                imageUrl: i.imageUrl,
                category: i.category,
                fabric: i.fabric,
                style: i.style,
                discount: i.discount || 0,
                originalPrice: i.originalPrice || 0,
            }));
            state.synced = true;
        });
    },
});

export const { toggleWishlist, removeFromWishlist, clearWishlist, resetWishlist } = wishlistSlice.actions;
export default wishlistSlice.reducer;
