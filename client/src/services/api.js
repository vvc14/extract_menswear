import axios from "axios";

const API = axios.create({
    baseURL: import.meta.env.VITE_API_URL || "/api",
});

API.interceptors.request.use((config) => {
    try {
        const auth = JSON.parse(localStorage.getItem("extractAuth"));
        if (auth?.token) {
            config.headers.Authorization = `Bearer ${auth.token}`;
        }
    } catch { }
    return config;
});

export default API;
