import { CATEGORIES } from "@/lib/constants";

/** Infinite CSS marquee (pure CSS, paused for reduced-motion by the global rule). */
export function Marquee() {
  const words = [...CATEGORIES.map((c) => c.name), "Discover", "Experience", "Connect"];
  const row = (
    <ul className="flex shrink-0 items-center gap-8 pr-8" aria-hidden>
      {words.map((w, i) => (
        <li key={w + i} className="flex items-center gap-8 font-display text-3xl font-bold uppercase tracking-tight sm:text-5xl">
          <span className={i % 3 === 0 ? "text-lime" : i % 3 === 1 ? "text-transparent [-webkit-text-stroke:1.5px_#F8F7F2]" : "text-magenta"}>{w}</span>
          <span className="text-violet-400">✺</span>
        </li>
      ))}
    </ul>
  );
  return (
    <div className="relative -rotate-1 overflow-hidden border-y border-white/10 bg-ink2 py-5" role="presentation">
      <div className="flex w-max animate-marquee">{row}{row}</div>
    </div>
  );
}
