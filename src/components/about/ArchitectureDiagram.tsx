"use client";
import { useState } from "react";
import { ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";

type Node = { id: string; label: string; sub?: string; body: string[] };
type Layer = { id: string; title: string; tone: string; nodes: Node[] };

/** Recreated from EventSphere_InterCollege_Architecture.png. Content mirrors the real module layout in src/modules. */
const LAYERS: Layer[] = [
  { id: "presentation", title: "Presentation tier", tone: "#2F8CFF", nodes: [
    { id: "attendee", label: "Student / Attendee app", body: ["Discover, register, join communities, connect", "Next.js App Router pages + Framer Motion"] },
    { id: "organizer", label: "Organizer & college portal", body: ["Create/publish events, manage registrations", "Volunteer and contestant review"] },
    { id: "admin", label: "Admin / moderator", body: ["Handle reports and platform oversight", "Role: PLATFORM_ADMIN"] },
  ] },
  { id: "edge", title: "Edge & API tier", tone: "#8B35FF", nodes: [
    { id: "edge", label: "HTTPS · Routing · Auth · Roles · Validation · Rate limiting", body: ["Route handlers under /api/v1 wrapped by one route() helper", "JWT session cookie, role checks, zod validation, rate limiting and uniform JSON errors", "No business logic here: handlers call module services"] },
  ] },
  { id: "modules", title: "Application tier: modular monolith", tone: "#22C55E", nodes: [
    { id: "identity", label: "Identity", sub: "& college profiles", body: ["Sign up, login, bcrypt hashing, profiles, roles", "src/modules/identity"] },
    { id: "events", label: "Event discovery", sub: "& management", body: ["Search, filters, sorting, favourites, event pages", "src/modules/events"] },
    { id: "registration", label: "Registration", sub: "& team formation", body: ["Transactional capacity checks, duplicate prevention, teams and join requests", "src/modules/events (registration, teams)"] },
    { id: "social", label: "Communities", sub: "& social graph", body: ["Communities, posts, connection requests, messaging only after acceptance, block and report", "src/modules/communities, connections, messaging"] },
    { id: "participation", label: "Participation", sub: "& volunteers", body: ["Contestant/performer applications, volunteer roles, shifts and statuses", "src/modules/participation, volunteer"] },
    { id: "organizerN", label: "Organizer", sub: "& notifications", body: ["Dashboards, analytics, announcements, in-app notifications via an async queue", "src/modules/organizer, notifications"] },
  ] },
  { id: "data", title: "Data layer", tone: "#FF7A1A", nodes: [
    { id: "pg", label: "PostgreSQL", sub: "Users · Events · Registrations", body: ["Primary relational store, normalised with FKs, unique constraints and indexes", "Drizzle ORM schema + SQL migrations in /drizzle"] },
    { id: "redis", label: "Redis", sub: "Cache · Rate limits", body: ["Planned shared store for rate limits and caching", "MVP uses an in-memory limiter with the same interface"] },
    { id: "obj", label: "Object storage", sub: "Posters · Portfolios", body: ["Uploads go to configurable storage (local in dev, S3-compatible in production)", "Never stored as database blobs"] },
    { id: "queue", label: "Queue / worker", sub: "Notifications · Indexing", body: ["Lightweight async notification queue", "Keeps request paths fast and rollback-safe"] },
    { id: "search", label: "Search / geo index", sub: "Optional at scale", body: ["Postgres filters serve the MVP", "A dedicated search index is a future option"] },
  ] },
  { id: "external", title: "External services", tone: "#A566FF", nodes: [
    { id: "maps", label: "Maps / geocoding", body: ["Venue coordinates and map embeds", "Provider is swappable"] },
    { id: "email", label: "Email / push provider", body: ["Delivery channel for notifications", "In-app notifications are built; email/push are future"] },
    { id: "pay", label: "Optional payment gateway", body: ["Free registration for the MVP", "Paid ticketing is a documented future integration"] },
  ] },
];

export function ArchitectureDiagram() {
  const [sel, setSel] = useState<Node & { tone: string; layer: string }>({ ...LAYERS[2].nodes[2], tone: LAYERS[2].tone, layer: LAYERS[2].title });
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="space-y-2" role="group" aria-label="Interactive architecture diagram">
        {LAYERS.map((l, li) => (
          <div key={l.id}>
            <div className="rounded-3xl border border-white/10 bg-ink2/70 p-4">
              <p className="mb-3 text-[11px] font-bold uppercase tracking-[.2em]" style={{ color: l.tone }}>{l.title}</p>
              <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(auto-fit, minmax(${l.nodes.length > 4 ? 130 : l.nodes.length === 1 ? 240 : 150}px, 1fr))` }}>
                {l.nodes.map((n) => {
                  const active = sel.id === n.id;
                  return (
                    <button key={n.id} type="button" onClick={() => setSel({ ...n, tone: l.tone, layer: l.title })} onMouseEnter={() => setSel({ ...n, tone: l.tone, layer: l.title })} onFocus={() => setSel({ ...n, tone: l.tone, layer: l.title })} aria-pressed={active}
                      className={cn("rounded-2xl border px-3 py-3 text-left text-sm transition hover:-translate-y-0.5", active ? "text-ink shadow-lg" : "border-white/10 bg-white/5 hover:bg-white/10")}
                      style={active ? { background: l.tone, borderColor: l.tone } : undefined}>
                      <span className="block font-display font-bold leading-tight">{n.label}</span>
                      {n.sub && <span className={cn("block text-xs", active ? "text-ink/70" : "text-white/55")}>{n.sub}</span>}
                    </button>
                  );
                })}
              </div>
            </div>
            {li < LAYERS.length - 1 && <div className="flex justify-center py-1 text-white/30" aria-hidden><ArrowDown size={18} /></div>}
          </div>
        ))}
      </div>
      <aside className="h-fit rounded-3xl border p-6 lg:sticky lg:top-24" style={{ borderColor: sel.tone + "88", background: sel.tone + "14" }} aria-live="polite">
        <p className="text-[11px] font-bold uppercase tracking-[.2em]" style={{ color: sel.tone }}>{sel.layer}</p>
        <h3 className="mt-2 font-display text-2xl font-bold leading-tight">{sel.label}{sel.sub ? ` ${sel.sub}` : ""}</h3>
        <ul className="mt-4 space-y-2 text-sm text-white/75">{sel.body.map((b) => <li key={b} className="flex gap-2"><span style={{ color: sel.tone }}>●</span>{b}</li>)}</ul>
        <p className="mt-5 text-xs text-white/40">Hover or tap any node. MVP = one backend application with clear internal modules; split services only when scale justifies it.</p>
      </aside>
    </div>
  );
}
