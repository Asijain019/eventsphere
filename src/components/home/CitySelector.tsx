"use client";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { MapPin, ChevronDown, Loader2 } from "lucide-react";

/** City picker: persists to cookie `es_city`, updates `?city=` so server sections refetch. Options come from the DB (props). */
export function CitySelector({ cities, current }: { cities: { slug: string; name: string }[]; current: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const list = cities.length ? cities : [{ slug: current, name: current.charAt(0).toUpperCase() + current.slice(1) }];
  function change(slug: string) {
    document.cookie = `es_city=${slug}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
    start(() => router.replace(`/?city=${slug}`, { scroll: false }));
  }
  return (
    <label className="glass relative inline-flex items-center gap-2 !rounded-full py-2 pl-4 pr-3 text-sm font-semibold">
      <MapPin size={16} className="text-lime" aria-hidden />
      <span className="sr-only">Select your city</span>
      <select value={current} onChange={(e) => change(e.target.value)} className="appearance-none bg-transparent pr-6 font-semibold focus:outline-none [&>option]:bg-ink2 [&>option]:text-paper" aria-label="Select your city">
        {list.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
      </select>
      {pending ? <Loader2 size={14} className="absolute right-3 animate-spin text-white/60" /> : <ChevronDown size={14} className="pointer-events-none absolute right-3 text-white/60" />}
    </label>
  );
}
