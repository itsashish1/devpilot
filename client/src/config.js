const isLocal = typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");

// Production: call backend directly via api subdomain (CORS is configured)
// Local dev: Vite proxy handles /api → localhost:5000 and /api/ai → localhost:8000
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (isLocal ? "" : "https://api.itsmeashishy.live");
export const AI_API_BASE_URL = import.meta.env.VITE_AI_API_BASE_URL || (isLocal ? "" : "https://api.itsmeashishy.live");

