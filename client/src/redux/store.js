import { configureStore } from "@reduxjs/toolkit";
import cartReducer, { resetCart, saveGuestCart } from "./cartSlice";
import authReducer, { logout } from "./authSlice";
import wishlistReducer, { resetWishlist } from "./wishlistSlice";
import alertReducer from "./alertSlice";
import { setUnauthorizedHandler } from "../services/api";

const store = configureStore({
    reducer: {
        cart: cartReducer,
        auth: authReducer,
        wishlist: wishlistReducer,
        alert: alertReducer,
    },
});

// Persist the guest cart so it survives refreshes and can be merged on login
let lastSavedItems = null;
store.subscribe(() => {
    const { auth, cart } = store.getState();
    if (auth.user) return;
    if (cart.items !== lastSavedItems) {
        lastSavedItems = cart.items;
        saveGuestCart(cart.items);
    }
});

setUnauthorizedHandler(() => {
    if (!store.getState().auth.token) return;
    store.dispatch(logout());
    store.dispatch(resetCart());
    store.dispatch(resetWishlist());
});

export default store;
