import { useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { fetchWishlist, syncWishlistToDB, removeFromWishlist } from "../redux/wishlistSlice";

// Hook: fetch wishlist on login, sync to DB on every wishlist change
export default function useWishlistSync() {
    const dispatch = useDispatch();
    const user = useSelector((s) => s.auth.user);
    const items = useSelector((s) => s.wishlist.items);
    const synced = useSelector((s) => s.wishlist.synced);
    const cartItems = useSelector((s) => s.cart.items);
    const prevUser = useRef(null);
    const syncTimeout = useRef(null);

    // Fetch wishlist from DB when user logs in
    useEffect(() => {
        if (user && user.id !== prevUser.current) {
            dispatch(fetchWishlist());
        }
        prevUser.current = user?.id || null;
    }, [user, dispatch]);

    // If a product is in cart, remove it from the wishlist automatically
    useEffect(() => {
        if (items.length === 0 || cartItems.length === 0) return;
        items.forEach((item) => {
            const inCart = cartItems.some((c) => c._id === item._id);
            if (inCart) {
                dispatch(removeFromWishlist(item._id));
            }
        });
    }, [items, cartItems, dispatch]);

    // Debounced sync to DB on wishlist changes (after initial fetch)
    useEffect(() => {
        if (!user || !synced) return;

        if (syncTimeout.current) clearTimeout(syncTimeout.current);
        syncTimeout.current = setTimeout(() => {
            dispatch(syncWishlistToDB());
        }, 500);

        return () => { if (syncTimeout.current) clearTimeout(syncTimeout.current); };
    }, [items, user, synced, dispatch]);
}
