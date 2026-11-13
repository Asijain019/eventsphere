"use client";
import { useState, useTransition, useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import * as Icons from "lucide-react";
import { Search, SlidersHorizontal, X, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

type Meta = {
  cities: { id: string; name: string; slug: string }[];
  colleges: { id: string; name: string; slug: string; citySlug: string }[];
  categories: { id: string; name: string; slug: string; color: string; icon: string; count: number }[];
};
const PRESETS = [{ v: "today", l: "Today" }, { v: "this-week", l: "This week" }, { v: "this-month", l: "This month" }];

/** URL-driven filter panel. Every control pushes searchParams; the server page re-queries. */
export function EventFilters({ meta, defaultCity, children }: { meta: Meta; defaultCity: string; children: React.ReactNode }) {
  const router = useRouter(); const path = usePathname(); const sp = useSearchParams();
  const [pending, start] = useTransition(); const [open, setOpen] = useState(false);
  const [q, setQ] = useState(sp.get("q") ?? "");
  useEffect(() => setQ(sp.get("q") ?? ""), [sp]);
  const get = (k: string) => sp.get(k) ?? "";
  const city = get("city") || defaultCity;

  function set(updates: Record<string, string | null>) {
    const p = new URLSearchParams(sp.toString());
    for (const [k, v] of Object.entries(updates)) { if (v) p.set(k, v); else p.delete(k); }
    if (updates.preset) { p.delete("from"); p.delete("to"); }
    if (updates.from || updates.to) p.delete("preset");
    p.delete("page");
    start(() => router.push(`${path}?${p.toString()}`, { scroll: false }));
  }
  const colleges = meta.colleges.filter((c) => city === "all" || c.citySlug === city);
  const active = ["q", "category", "college", "fee", "mode", "preset", "from", "to"].filter((k) => get(k)).length + (get("city") && get("city") !== defaultCity ? 1 : 0);
  const pill = (on: boolean) => cn("rounded-full border px-3 py-1.5 text-xs font-semibold transition", on ? "border-lime bg-lime text-ink" : "border-white/15 bg-white/5 text-white/75 hover:bg-white/10");
  const Group = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <fieldset className="space-y-2.5"><legend className="label mb-2 text-xs uppercase tracking-wider text-white/50">{title}</legend>{children}</fieldset>
  );

  const panel = (
    <div className="space-y-6">
      <Group title="City">
        <div className="relative"><MapPin size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-magenta" />
          <select aria-label="City" className="input !pl-9" value={city} onChange={(e) => set({ city: e.target.value === defaultCity ? null : e.target.value, college: null })}>
            {meta.cities.map((c) => <option key={c.id} value={c.slug}>{c.name}</option>)}
            <option value="all">All cities</option>
          </select></div>
      </Group>
      <Group title="Category">
        <div className="flex flex-wrap gap-2">
          <button type="button" className={pill(!get("category"))} onClick={() => set({ category: null })}>All</button>
          {meta.categories.map((c) => {
            const Ic = (Icons as any)[c.icon] ?? Icons.Sparkles;
            return <button type="button" key={c.id} aria-pressed={get("category") === c.slug} className={cn(pill(get("category") === c.slug), "inline-flex items-center gap-1.5")} onClick={() => set({ category: get("category") === c.slug ? null : c.slug })}>
              <Ic size={13} style={{ color: get("category") === c.slug ? undefined : c.color }} />{c.name}<span className="opacity-60">{c.count}</span></button>;
          })}
        </div>
      </Group>
      <Group title="When">
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((p) => <button type="button" key={p.v} className={pill(get("preset") === p.v)} aria-pressed={get("preset") === p.v} onClick={() => set({ preset: get("preset") === p.v ? null : p.v })}>{p.l}</button>)}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <label className="text-xs text-white/50">From<input type="date" className="input mt-1" value={get("from")} onChange={(e) => set({ from: e.target.value || null })} /></label>
          <label className="text-xs text-white/50">To<input type="date" className="input mt-1" value={get("to")} min={get("from") || undefined} onChange={(e) => set({ to: e.target.value || null })} /></label>
        </div>
      </Group>
      <Group title="College">
        <select aria-label="College" className="input" value={get("college")} onChange={(e) => set({ college: e.target.value || null })}>
          <option value="">All colleges</option>{colleges.map((c) => <option key={c.id} value={c.slug}>{c.name}</option>)}
        </select>
      </Group>
      <Group title="Price">
        <div className="flex gap-2">{[["", "Any"], ["free", "Free"], ["paid", "Paid"]].map(([v, l]) => <button type="button" key={v} className={pill(get("fee") === v)} aria-pressed={get("fee") === v} onClick={() => set({ fee: v || null })}>{l}</button>)}</div>
      </Group>
      <Group title="Mode">
        <div className="flex gap-2">{[["", "Any"], ["OFFLINE", "Offline"], ["ONLINE", "Online"], ["HYBRID", "Hybrid"]].map(([v, l]) => <button type="button" key={v} className={pill(get("mode").toUpperCase() === v)} aria-pressed={get("mode").toUpperCase() === v} onClick={() => set({ mode: v || null })}>{l}</button>)}</div>
      </Group>
      {active > 0 && <button type="button" className="btn-ghost w-full" onClick={() => start(() => router.push(path))}>Clear all filters</button>}
    </div>
  );

  return (
    <>
      <div className="flex flex-col gap-3 sm:flex-row">
        <form role="search" className="relative flex-1" onSubmit={(e) => { e.preventDefault(); set({ q: q.trim() || null }); }}>
          <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
          <input aria-label="Search events" className="input !rounded-full !py-3.5 !pl-11 !pr-28" placeholder="Search events, tags, topics…" value={q} onChange={(e) => setQ(e.target.value)} />
          <button type="submit" className="btn-lime absolute right-1.5 top-1/2 -translate-y-1/2 !py-2">Search</button>
        </form>
        <div className="flex gap-2">
          <label className="sr-only" htmlFor="sort">Sort by</label>
          <select id="sort" className="input !w-auto !rounded-full !py-3" value={get("sort") || "upcoming"} onChange={(e) => set({ sort: e.target.value === "upcoming" ? null : e.target.value })}>
            <option value="upcoming">Upcoming</option><option value="popular">Most popular</option><option value="newest">Newest</option>
          </select>
          <button type="button" className="btn-ghost lg:hidden" onClick={() => setOpen(true)}><SlidersHorizontal size={16} />Filters{active > 0 && <span className="ml-1 rounded-full bg-lime px-1.5 text-xs text-ink">{active}</span>}</button>
        </div>
      </div>
      <div className="mt-6 grid gap-8 lg:grid-cols-[300px_1fr]" aria-busy={pending}>
        <aside className="hidden lg:block"><div className="card max-h-[calc(100vh-7rem)] overflow-y-auto p-5 lg:sticky lg:top-20">{panel}</div></aside>
        <div className={cn("min-w-0 transition-opacity", pending && "opacity-50")}>{children}</div>
      </div>
      {open && (
        <div className="fixed inset-0 z-[70] lg:hidden" role="dialog" aria-modal="true" aria-label="Filters">
          <div className="absolute inset-0 bg-black/70" onClick={() => setOpen(false)} />
          <div className="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-3xl border-t border-white/10 bg-ink2 p-5">
            <div className="mb-4 flex items-center justify-between"><h2 className="font-display text-xl font-bold">Filters</h2>
              <button type="button" aria-label="Close filters" className="grid h-9 w-9 place-items-center rounded-full bg-white/10" onClick={() => setOpen(false)}><X size={18} /></button></div>
            {panel}
            <button type="button" className="btn-primary mt-6 w-full" onClick={() => setOpen(false)}>Show results</button>
          </div>
        </div>
      )}
    </>
  );
}
