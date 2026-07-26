import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { api, setToken } from "../../lib/api";

type User = { id: string; name: string; email: string; role: string };
type Ctx = {
  user: User | null;
  login: (e: string, p: string) => Promise<void>;
  register: (n: string, e: string, p: string, role?: string) => Promise<void>;
  loginGoogle: () => void;
  logout: () => void;
};
const AuthCtx = createContext<Ctx>(null!);
export const useAuth = () => useContext(AuthCtx);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const s = localStorage.getItem("bx_user");
    return s ? JSON.parse(s) : null;
  });

  const persist = (u: User, token: string) => {
    setToken(token);
    setUser(u);
    localStorage.setItem("bx_user", JSON.stringify(u));
  };

  const clearSession = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("bx_user");
  };

  const login = async (email: string, password: string) => {
    const { data } = await api.post("/auth/login", { email, password });
    persist(data.user, data.accessToken);
  };

  const register = async (name: string, email: string, password: string, role = "customer") => {
    const { data } = await api.post("/auth/register", { name, email, password, role });
    persist(data.user, data.accessToken);
  };

  const loginGoogle = () => {
    window.location.href = (import.meta.env.VITE_API_URL ?? "") + "/auth/google";
  };

  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } catch {}
    clearSession();
  };

  useEffect(() => {
    const onLogout = () => clearSession();
    window.addEventListener("bx:logout", onLogout);
    return () => window.removeEventListener("bx:logout", onLogout);
  }, []);

  return (
    <AuthCtx.Provider value={{ user, login, register, loginGoogle, logout }}>
      {children}
    </AuthCtx.Provider>
  );
}
