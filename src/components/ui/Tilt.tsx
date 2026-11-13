"use client";
import { useRef } from "react";
import { cn } from "@/lib/utils";

/** CSS-3D mouse-follow tilt. Disabled automatically for reduced-motion users via CSS (transition-duration) and touch (no mousemove). */
export function Tilt({ children, className, max = 8 }: { children: React.ReactNode; className?: string; max?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const move = (e: React.MouseEvent) => {
    const el = ref.current; if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
    el.style.transform = `perspective(900px) rotateX(${(-y * max).toFixed(2)}deg) rotateY(${(x * max).toFixed(2)}deg) translateZ(0)`;
  };
  const leave = () => { if (ref.current) ref.current.style.transform = "perspective(900px) rotateX(0) rotateY(0)"; };
  return <div ref={ref} onMouseMove={move} onMouseLeave={leave} className={cn("transition-transform duration-200 ease-out will-change-transform [transform-style:preserve-3d]", className)}>{children}</div>;
}
