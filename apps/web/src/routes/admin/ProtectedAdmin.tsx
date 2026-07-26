import { ReactNode } from "react";
import { useAuth } from "../../features/auth/AuthContext";
import AdminLogin from "./AdminLogin";
export function ProtectedAdmin({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  if (!user || user.role !== "admin") return <AdminLogin />;
  return <>{children}</>;
}
