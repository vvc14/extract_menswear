import axios from "axios";

const API = axios.create({
    baseURL: import.meta.env.VITE_API_URL || "/api",
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
    } catch { }
    return config;
});

export default API;
