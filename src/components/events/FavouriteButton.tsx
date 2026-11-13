"use client";
import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Heart } from "lucide-react";
import { api } from "@/lib/client";
import { cn } from "@/lib/utils";

/** Heart toggle; redirects to /login?next= when logged out. Optimistic with rollback. */
export function FavouriteButton({ eventId, initial = false, loggedIn, className }: { eventId: string; initial?: boolean; loggedIn: boolean; className?: string }) {
  const [on, setOn] = useState(initial); const [busy, setBusy] = useState(false);
  const router = useRouter(); const path = usePathname();
  async function toggle() {
    if (!loggedIn) { router.push(`/login?next=${encodeURIComponent(path + (typeof window !== "undefined" ? window.location.search : ""))}`); return; }
    if (busy) return; setBusy(true); const next = !on; setOn(next);
    try { await api(`/api/v1/events/${eventId}/favourite`, { method: next ? "POST" : "DELETE" }); }
    catch { setOn(!next); } finally { setBusy(false); }
  }
  return (
    <button type="button" onClick={toggle} aria-pressed={on} aria-label={on ? "Remove from favourites" : "Save to favourites"} title={on ? "Saved" : "Save event"}
      className={cn("grid h-10 w-10 place-items-center rounded-full border border-white/15 bg-white/5 transition hover:bg-white/10 active:scale-90", on && "border-magenta/50 bg-magenta/15", className)}>
      <Heart size={18} className={cn("transition", on ? "fill-magenta text-magenta" : "text-white/70")} />
    </button>
  );
}
