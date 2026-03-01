const loadRazorpayScript = () =>
    new Promise((resolve) => {
        if (document.getElementById("razorpay-sdk")) return resolve(true);
        const script = document.createElement("script");
        script.id = "razorpay-sdk";
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
    });

export const initiateRazorpayPayment = async ({ orderId, amount, currency, onSuccess, onFailure }) => {
    const loaded = await loadRazorpayScript();
    if (!loaded) {
        onFailure?.("Razorpay SDK failed to load");
        return;
    }

    const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount,
        currency,
        order_id: orderId,
        name: "Extract Menswear",
        description: "Premium Menswear Purchase",
        theme: { color: "#1a1a1a" },
        handler: (response) => onSuccess?.(response),
        modal: { ondismiss: () => onFailure?.("Payment cancelled") },
    };

    const rzp = new window.Razorpay(options);
    rzp.open();
};
