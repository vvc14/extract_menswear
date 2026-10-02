const loadRazorpayScript = () =>
    new Promise((resolve) => {
        if (window.Razorpay) return resolve(true);
        const existing = document.getElementById("razorpay-sdk");
        if (existing) {
            existing.addEventListener("load", () => resolve(true), { once: true });
            existing.addEventListener("error", () => resolve(false), { once: true });
            return;
        }
        const script = document.createElement("script");
        script.id = "razorpay-sdk";
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
    });

// Preload SDK eagerly so checkout opens instantly
export const preloadRazorpay = () => { loadRazorpayScript(); };

// The server holds stock for 30 minutes; close Checkout well before that.
const CHECKOUT_TIMEOUT_SECONDS = 15 * 60;

/**
 * Opens Razorpay Checkout.
 * onSuccess(response)  — payment completed (response has order/payment ids + signature)
 * onDismiss()          — customer closed Checkout or it timed out without a successful payment
 * onFailure(message)   — SDK failed to load, or a payment attempt failed (Checkout stays open for retry)
 */
// Phones and tablets: mobile browsers (iOS Safari, Brave, in-app browsers) block the pop-up window
// Razorpay opens for net banking and some wallets, so the payment fails. Redirect mode sends the
// whole page to the bank instead and Razorpay posts the result to our callback URL.
export const shouldUseRedirect = () =>
    /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) ||
    (navigator.maxTouchPoints > 1 && /Macintosh/.test(navigator.userAgent)); // iPadOS reports as Mac

// Absolute URL of the API callback that receives redirect-mode results
export const razorpayCallbackUrl = () => {
    const base = import.meta.env.VITE_API_URL || "/api";
    const apiBase = /^https?:\/\//i.test(base) ? base : `${window.location.origin}${base}`;
    return `${apiBase.replace(/\/+$/, "")}/payment/razorpay/callback?return=${encodeURIComponent(window.location.origin)}`;
};

export const initiateRazorpayPayment = async ({ orderId, amount, currency, prefill, onSuccess, onDismiss, onFailure }) => {
    const loaded = await loadRazorpayScript();
    if (!loaded || !window.Razorpay) {
        onFailure?.("Payment service failed to load. Please check your connection and try again.");
        onDismiss?.();
        return;
    }

    let completed = false;
    const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount,
        currency,
        order_id: orderId,
        name: "Extract Menswear",
        description: "Premium Menswear Purchase",
        theme: { color: "#1a1a1a" },
        prefill: prefill || {},
        timeout: CHECKOUT_TIMEOUT_SECONDS,
        retry: { enabled: true },
        // On phones: full-page redirect to the bank instead of a (blocked) pop-up; the result is
        // posted to our server, which verifies it and sends the shopper to the success page
        ...(shouldUseRedirect() ? { redirect: true, callback_url: razorpayCallbackUrl() } : {}),
        handler: (response) => {
            completed = true;
            onSuccess?.(response);
        },
        modal: {
            confirm_close: true,
            ondismiss: () => { if (!completed) onDismiss?.(); },
        },
    };

    const rzp = new window.Razorpay(options);
    rzp.on("payment.failed", (resp) => {
        onFailure?.(resp?.error?.description || "Payment failed. You can try again.");
    });
    rzp.open();
};
