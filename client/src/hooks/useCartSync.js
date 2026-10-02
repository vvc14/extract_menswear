import { useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { fetchCart, syncCartToDB } from "../redux/cartSlice";

// What the server stores for a cart: product, size and quantity per line.
// Price/stock/name refreshes from the server must not trigger another save.
const cartSignature = (items) =>
    items.map((i) => `${i._id}:${i.size || ""}:${i.quantity}`).sort().join(",");

// Hook: fetch cart on login, save it to the DB when its contents change
export default function useCartSync() {
    const dispatch = useDispatch();
    const user = useSelector((s) => s.auth.user);
    const items = useSelector((s) => s.cart.items);
    const synced = useSelector((s) => s.cart.synced);
    const prevUser = useRef(null);
    const syncTimeout = useRef(null);
    const lastSaved = useRef(null);

    // Fetch cart from DB when user logs in
    useEffect(() => {
        if (user && user.id !== prevUser.current) {
            lastSaved.current = null;
            dispatch(fetchCart());
        }
        prevUser.current = user?.id || null;
    }, [user, dispatch]);

    const signature = cartSignature(items);

    // Debounced save, only when product/size/quantity actually changed
    useEffect(() => {
        if (!user || !synced) return;
        // The cart just loaded from the server is already saved
        if (lastSaved.current === null) {
            lastSaved.current = signature;
            return;
        }
        if (signature === lastSaved.current) return;

        if (syncTimeout.current) clearTimeout(syncTimeout.current);
        syncTimeout.current = setTimeout(() => {
            lastSaved.current = signature;
            dispatch(syncCartToDB());
        }, 500);

        return () => { if (syncTimeout.current) clearTimeout(syncTimeout.current); };
    }, [signature, user, synced, dispatch]);
}
