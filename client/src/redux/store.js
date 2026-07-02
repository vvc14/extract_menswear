import { configureStore } from "@reduxjs/toolkit";
import cartReducer from "./cartSlice";
import authReducer from "./authSlice";
import wishlistReducer from "./wishlistSlice";
import alertReducer from "./alertSlice";

const store = configureStore({
    reducer: {
        cart: cartReducer,
        auth: authReducer,
        wishlist: wishlistReducer,
        alert: alertReducer,
    },
});

export default store;
