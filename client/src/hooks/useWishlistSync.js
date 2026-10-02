import { useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { fetchWishlist, syncWishlistToDB, removeFromWishlist } from "../redux/wishlistSlice";

const wishlistSignature = (items) => items.map((i) => i._id).sort().join(",");

// Hook: fetch wishlist on login, save it to the DB when its contents change
export default function useWishlistSync() {
    const dispatch = useDispatch();
    const user = useSelector((s) => s.auth.user);
    const items = useSelector((s) => s.wishlist.items);
    const synced = useSelector((s) => s.wishlist.synced);
    const cartItems = useSelector((s) => s.cart.items);
    const prevUser = useRef(null);
    const syncTimeout = useRef(null);
    const lastSaved = useRef(null);

    // Fetch wishlist from DB when user logs in
    useEffect(() => {
        if (user && user.id !== prevUser.current) {
            lastSaved.current = null;
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

    const signature = wishlistSignature(items);

    // Debounced save, only when the set of products actually changed
    useEffect(() => {
        if (!user || !synced) return;
        if (lastSaved.current === null) {
            lastSaved.current = signature;
            return;
        }
        if (signature === lastSaved.current) return;

        if (syncTimeout.current) clearTimeout(syncTimeout.current);
        syncTimeout.current = setTimeout(() => {
            lastSaved.current = signature;
            dispatch(syncWishlistToDB());
        }, 500);

        return () => { if (syncTimeout.current) clearTimeout(syncTimeout.current); };
    }, [signature, user, synced, dispatch]);
}
