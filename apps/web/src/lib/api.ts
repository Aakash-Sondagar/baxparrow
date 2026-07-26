import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:4000/api/v1",
  withCredentials: true,
});

let token: string | null = localStorage.getItem("bx_token");
export const setToken = (tk: string | null) => {
  token = tk;
  if (tk) localStorage.setItem("bx_token", tk);
  else localStorage.removeItem("bx_token");
};

api.interceptors.request.use((cfg) => {
  if (token) cfg.headers.Authorization = "Bearer " + token;
  const cartKey = localStorage.getItem("bx_cart_key");
  if (cartKey && !cfg.headers["X-Cart-Key"]) cfg.headers["X-Cart-Key"] = cartKey;
  return cfg;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      setToken(null);
      localStorage.removeItem("bx_user");
      // Soft clear — AuthProvider re-reads on next navigation/remount via storage events if needed
      window.dispatchEvent(new Event("bx:logout"));
    }
    return Promise.reject(err);
  }
);
