import { useEffect, useRef, useState, type ReactNode } from "react";

type Props = {
  children: ReactNode;
  className?: string;
  /** Stagger slot 1–4 */
  delay?: 1 | 2 | 3 | 4;
};

/** Fade-up when scrolled into view. */
export function Reveal({ children, className = "", delay }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [on, setOn] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setOn(true);
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setOn(true);
          io.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const stagger =
    delay === 1
      ? "bx-stagger-1"
      : delay === 2
        ? "bx-stagger-2"
        : delay === 3
          ? "bx-stagger-3"
          : delay === 4
            ? "bx-stagger-4"
            : "";

  return (
    <div
      ref={ref}
      className={`bx-reveal ${on ? "bx-reveal-in" : ""} ${stagger} ${className}`.trim()}
    >
      {children}
    </div>
  );
}
