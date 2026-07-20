const isLocal = typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (isLocal ? "http://localhost:5000" : "");
export const AI_API_BASE_URL = import.meta.env.VITE_AI_API_BASE_URL || (isLocal ? "http://localhost:8000" : "");

