import axios from "axios";

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// A GET that dies on a server/network hiccup gets one more try after a short
// pause. In production this is mostly Railway restarting Postgres or waking
// the backend: the request in flight 500s, and the very next one works.
// Only GETs - they're safe to repeat; a retried POST could e.g. create the
// same loan twice.
export const RETRY_DELAY_MS = 1500;
const RETRYABLE_STATUS = new Set([500, 502, 503, 504]);

const shouldRetry = (error) => {
  const { config } = error;
  if (!config || config._retried || axios.isCancel(error)) return false;
  if ((config.method || "get").toLowerCase() !== "get") return false;
  return !error.response || RETRYABLE_STATUS.has(error.response.status);
};

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (shouldRetry(error)) {
      error.config._retried = true;
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
      return axiosInstance(error.config);
    }

    if (error.response?.status === 401) {
      // Only the login/register screens themselves don't need this warning
      // (a 401 there just means "wrong password", handled inline) — anywhere
      // else it means the session expired mid-use, which is worth explaining
      // instead of silently bouncing to the login screen.
      const onAuthPage = window.location.pathname === "/login" || window.location.pathname === "/register";
      const hadSession = !!localStorage.getItem("token");
      if (hadSession && !onAuthPage) {
        sessionStorage.setItem("session_expired", "1");
      }
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      if (!onAuthPage) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;