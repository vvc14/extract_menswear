import axios from "axios";

const API = axios.create({
    baseURL: import.meta.env.VITE_API_URL || "/api",
    timeout: 15000,
});

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

// Auto-retry on network errors (ECONNRESET / 502) — fixes first-login failures
API.interceptors.response.use(
    (response) => response,
    async (error) => {
        const config = error.config;
        // Only retry once, only for network errors or 502 (proxy not ready)
        if (
            !config._retried &&
            (error.message === "Network Error" || error.response?.status === 502)
        ) {
            config._retried = true;
            // Wait 1 second for server to be ready, then retry
            await new Promise((r) => setTimeout(r, 1000));
            return API(config);
        }
        return Promise.reject(error);
    }
);

export default API;
