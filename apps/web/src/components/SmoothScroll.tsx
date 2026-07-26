import { useEffect, useState, type ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { ReactLenis, useLenis } from "lenis/react";
import "lenis/dist/lenis.css";

/** Jump top on route change (works with Lenis). */
function LenisScrollReset() {
  const { pathname, search } = useLocation();
  const lenis = useLenis();

  useEffect(() => {
    if (lenis) lenis.scrollTo(0, { immediate: true });
    else window.scrollTo(0, 0);
  }, [pathname, search, lenis]);

  return null;
}

/**
 * [Lenis](https://www.lenis.dev/) smooth scroll for storefront.
 * Skips when user prefers reduced motion.
 */
export function SmoothScroll({ children }: { children: ReactNode }) {
  const [ok, setOk] = useState(true);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setOk(!mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  if (!ok) {
    return (
      <>
        <NativeScrollReset />
        {children}
      </>
    );
  }

  return (
    <ReactLenis
      root
      options={{
        lerp: 0.09,
        duration: 1.15,
        smoothWheel: true,
        syncTouch: false,
        touchMultiplier: 1.2,
        wheelMultiplier: 1,
        autoRaf: true,
      }}
    >
      <LenisScrollReset />
      {children}
    </ReactLenis>
  );
}

function NativeScrollReset() {
  const { pathname, search } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname, search]);
  return null;
}
