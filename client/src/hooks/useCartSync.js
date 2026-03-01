import { useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { fetchCart, syncCartToDB } from "../redux/cartSlice";

// Hook: fetch cart on login, sync to DB on every cart change
export default function useCartSync() {
    const dispatch = useDispatch();
    const user = useSelector((s) => s.auth.user);
    const items = useSelector((s) => s.cart.items);
    const synced = useSelector((s) => s.cart.synced);
    const prevUser = useRef(null);
    const syncTimeout = useRef(null);

    // Fetch cart from DB when user logs in
    useEffect(() => {
        if (user && user.id !== prevUser.current) {
            dispatch(fetchCart());
        }
        prevUser.current = user?.id || null;
    }, [user, dispatch]);

    // Debounced sync to DB on cart changes (after initial fetch)
    useEffect(() => {
        if (!user || !synced) return;

        if (syncTimeout.current) clearTimeout(syncTimeout.current);
        syncTimeout.current = setTimeout(() => {
            dispatch(syncCartToDB());
        }, 500);

        return () => { if (syncTimeout.current) clearTimeout(syncTimeout.current); };
    }, [items, user, synced, dispatch]);
}
