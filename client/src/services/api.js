import axios from "axios";

// In production the storefront and API live on different hosts, so VITE_API_URL must be set
// at build time (e.g. https://api.yourstore.com/api). "/api" only works with the Vite dev proxy.
if (import.meta.env.PROD && !import.meta.env.VITE_API_URL) {
    console.error("VITE_API_URL is not set: API requests will go to the storefront host and fail.");
}

const API = axios.create({
    baseURL: import.meta.env.VITE_API_URL || "/api",
    timeout: 20000,
});

// Called when the server rejects our session (expired, revoked, or role changed).
// Registered by the store to avoid a circular import.
let onUnauthorized = null;
export const setUnauthorizedHandler = (fn) => { onUnauthorized = fn; };

API.interceptors.request.use((config) => {
    try {
        // Check admin session first (sessionStorage), then user session (localStorage)
        const adminAuth = JSON.parse(sessionStorage.getItem("extractAdminAuth"));
        const userAuth = JSON.parse(localStorage.getItem("extractAuth"));
        const token = adminAuth?.token || userAuth?.token;
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
    } catch (err) {
        console.error("Error setting API token:", err);
    }
    return config;
});

const SAFE_METHODS = ["get", "head", "options"];

API.interceptors.response.use(
    (response) => response,
    async (error) => {
        const config = error.config || {};

        // While the server is starting (503) or briefly unreachable (network error / 502 from a proxy),
        // retry reads up to 3 times with a growing delay instead of showing an error.
        // Only idempotent reads: replaying a POST (e.g. checkout or payment verification) could duplicate it.
        const status = error.response?.status;
        const transient = error.message === "Network Error" || status === 502 || status === 503 || status === 504;
        config._retries = config._retries || 0;
        if (transient && config._retries < 3 && SAFE_METHODS.includes((config.method || "get").toLowerCase())) {
            config._retries += 1;
            await new Promise((r) => setTimeout(r, 1000 * config._retries));
            return API(config);
        }

        // Session no longer valid: sign out locally so the UI doesn't keep failing.
        // Login endpoints return 401 for wrong credentials, which says nothing about the current session.
        const url = config.url || "";
        const isCredentialCheck = url.startsWith("/auth/") && !url.startsWith("/auth/profile");
        if (error.response?.status === 401 && config.headers?.Authorization && !isCredentialCheck && onUnauthorized) {
            onUnauthorized();
        }
        return Promise.reject(error);
    }
);

// Human-readable message from an API error
export const apiErrorMessage = (err, fallback = "Something went wrong. Please try again.") =>
    err?.response?.data?.message || (err?.message === "Network Error" ? "Could not reach the server. Check your connection." : fallback);

export default API;
