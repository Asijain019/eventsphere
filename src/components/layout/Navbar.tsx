"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { Menu, X, Bell, Plus, LogOut, User as UserIcon, Ticket, LayoutDashboard } from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/client";

const LINKS = [
  { href: "/", label: "Home" }, { href: "/events", label: "Explore Events" }, { href: "/communities", label: "Communities" },
  { href: "/participate", label: "Participate" }, { href: "/volunteer", label: "Volunteer" }, { href: "/teams", label: "Find Team" }, { href: "/about", label: "About" },
];
type U = { id: string; name: string; role: string } | null;

export function Navbar({ user, unread = 0 }: { user: U; unread?: number }) {
  const path = usePathname(); const router = useRouter();
  const [open, setOpen] = useState(false); const [menu, setMenu] = useState(false);
  const isOrganizer = !!user && ["ORGANIZER", "COLLEGE_ADMIN", "PLATFORM_ADMIN"].includes(user.role);
  async function logout() { await api("/api/v1/auth/logout", { method: "POST" }); setMenu(false); router.push("/"); router.refresh(); }
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-ink/80 backdrop-blur-xl">
      <div className="container-x flex h-16 items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2" aria-label="EventSphere home">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-gradient font-display text-lg font-black shadow-glow">E</span>
          <span className="font-display text-xl font-bold tracking-tight">Event<span className="text-lime">Sphere</span></span>
        </Link>
        <nav className="hidden items-center gap-1 lg:flex" aria-label="Main">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} className={cn("rounded-full px-3 py-2 text-sm font-medium text-white/70 transition hover:bg-white/10 hover:text-white", (l.href === "/" ? path === "/" : path.startsWith(l.href)) && "bg-white/10 text-white")}>{l.label}</Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          {isOrganizer && <Link href="/organizer/events/new" className="btn-lime hidden sm:inline-flex"><Plus size={16} />Create Event</Link>}
          {user ? (
            <>
              <Link href="/notifications" aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`} className="relative grid h-10 w-10 place-items-center rounded-full border border-white/15 bg-white/5 hover:bg-white/10">
                <Bell size={18} />{unread > 0 && <span className="absolute -right-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-magenta px-1 text-[10px] font-bold">{unread > 9 ? "9+" : unread}</span>}
              </Link>
              <div className="relative">
                <button onClick={() => setMenu((v) => !v)} aria-haspopup="menu" aria-expanded={menu} className="grid h-10 w-10 place-items-center rounded-full bg-brand-gradient font-display text-sm font-bold">{user.name.slice(0, 1).toUpperCase()}</button>
                {menu && (
                  <div role="menu" className="card absolute right-0 mt-2 w-56 overflow-hidden p-1.5 text-sm" onClick={() => setMenu(false)}>
                    <p className="truncate px-3 py-2 text-xs text-white/50">{user.name}</p>
                    <Link role="menuitem" href="/profile" className="flex items-center gap-2 rounded-xl px-3 py-2 hover:bg-white/10"><UserIcon size={15} />My profile</Link>
                    <Link role="menuitem" href="/my/registrations" className="flex items-center gap-2 rounded-xl px-3 py-2 hover:bg-white/10"><Ticket size={15} />My events</Link>
                    <Link role="menuitem" href="/my/network" className="flex items-center gap-2 rounded-xl px-3 py-2 hover:bg-white/10"><UserIcon size={15} />Network & messages</Link>
                    {isOrganizer && <Link role="menuitem" href="/organizer" className="flex items-center gap-2 rounded-xl px-3 py-2 hover:bg-white/10"><LayoutDashboard size={15} />Organizer dashboard</Link>}
                    <button role="menuitem" onClick={logout} className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-red-300 hover:bg-red-500/10"><LogOut size={15} />Log out</button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link href="/login" className="btn-ghost hidden sm:inline-flex">Log in</Link>
              <Link href="/signup" className="btn-primary">Sign up</Link>
            </>
          )}
          <button className="grid h-10 w-10 place-items-center rounded-full border border-white/15 lg:hidden" aria-label="Toggle menu" aria-expanded={open} onClick={() => setOpen((v) => !v)}>{open ? <X size={18} /> : <Menu size={18} />}</button>
        </div>
      </div>
      {open && (
        <nav className="container-x grid gap-1 pb-4 lg:hidden" aria-label="Mobile" onClick={() => setOpen(false)}>
          {LINKS.map((l) => <Link key={l.href} href={l.href} className="rounded-xl px-3 py-3 font-medium hover:bg-white/10">{l.label}</Link>)}
          {isOrganizer && <Link href="/organizer/events/new" className="btn-lime mt-2">Create Event</Link>}
          {!user && <Link href="/login" className="btn-ghost mt-2">Log in</Link>}
        </nav>
      )}
    </header>
  );
}
