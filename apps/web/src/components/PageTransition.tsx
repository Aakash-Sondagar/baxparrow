import { useLocation } from "react-router-dom";
import type { ReactNode } from "react";

/** Remount + fade-up on route change. */
export function PageTransition({ children }: { children: ReactNode }) {
  const { pathname, search } = useLocation();
  return (
    <div key={pathname + search} className="animate-page">
      {children}
    </div>
  );
}
