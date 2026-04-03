import { useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { fetchWishlist, syncWishlistToDB } from "../redux/wishlistSlice";

// Hook: fetch wishlist on login, sync to DB on every wishlist change
export default function useWishlistSync() {
    const dispatch = useDispatch();
    const user = useSelector((s) => s.auth.user);
    const items = useSelector((s) => s.wishlist.items);
    const synced = useSelector((s) => s.wishlist.synced);
    const prevUser = useRef(null);
    const syncTimeout = useRef(null);

    // Fetch wishlist from DB when user logs in
    useEffect(() => {
        if (user && user.id !== prevUser.current) {
            dispatch(fetchWishlist());
        }
        prevUser.current = user?.id || null;
    }, [user, dispatch]);

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
