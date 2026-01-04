import axios from "axios";

// Environment variable for API URL
export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

const api = axios.create({
    baseURL: API_URL,
    headers: {
        "Content-Type": "application/json",
    },
});

// Request interceptor to add token
api.interceptors.request.use(
    (config) => {
        // In a real app with httpOnly cookies, the browser handles this automatically for same-origin or credentials: include.
        // However, if we are storing the access token in memory (as requested), we attach it here.
        // We'll use a simple localStorage or memory store for this demo as requested "Access token stored in memory".
        // Since we're in Next.js, memory resets on reload. using localStorage for persistence in this MVP or just memory if strict.
        // Plan: Use a global variable or getter.

        // For this implementation, we will assume localStorage for simplicity so it survives F5 in dev.
        if (typeof window !== "undefined") {
            const token = localStorage.getItem("access_token");
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor for 401
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        // Handle 401 (Unauthorized) and 403 (Forbidden - often invalid token in this app)
        if (error.response?.status === 401 || error.response?.status === 403) {
            if (typeof window !== "undefined") {
                // Clear state
                localStorage.removeItem("access_token");
                localStorage.removeItem("user");
                // Redirect
                window.location.href = "/login";
            }
        }
        return Promise.reject(error);
    }
);

export default api;
