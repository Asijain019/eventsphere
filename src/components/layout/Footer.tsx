import Link from "next/link";
import { Camera, AtSign, Briefcase, Code2 } from "lucide-react";
export function Footer() {
  const cols = [
    { h: "Discover", l: [["Explore events", "/events"], ["Communities", "/communities"], ["Find a team", "/teams"], ["Volunteer", "/volunteer"]] },
    { h: "Company", l: [["About", "/about"], ["Contact", "/contact"], ["Help", "/help"]] },
    { h: "Legal", l: [["Privacy", "/privacy"], ["Terms", "/terms"]] },
  ];
  return (
    <footer className="mt-24 border-t border-white/10 bg-ink2/60">
      <div className="container-x grid gap-10 py-14 md:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div>
          <p className="font-display text-3xl font-bold">Event<span className="text-lime">Sphere</span></p>
          <p className="mt-2 text-sm font-medium text-lime">Discover. Experience. Connect.</p>
          <p className="mt-3 max-w-xs text-sm text-white/55">Inter-college and city-wide events, communities and people — starting in Jaipur.</p>
          <div className="mt-5 flex gap-2">
            {[[Camera, "Instagram", "https://instagram.com"], [AtSign, "X / Twitter", "https://x.com"], [Briefcase, "LinkedIn", "https://linkedin.com"], [Code2, "GitHub", "https://github.com"]].map(([I, n, h]: any) => (
              <a key={n} href={h} target="_blank" rel="noreferrer" aria-label={n} className="grid h-10 w-10 place-items-center rounded-full border border-white/15 hover:bg-white/10"><I size={16} /></a>
            ))}
          </div>
        </div>
        {cols.map((c) => (
          <div key={c.h}>
            <p className="label">{c.h}</p>
            <ul className="space-y-2 text-sm">{c.l.map(([t, h]) => <li key={h}><Link href={h} className="text-white/70 hover:text-lime">{t}</Link></li>)}</ul>
          </div>
        ))}
      </div>
      <div className="border-t border-white/10 py-5 text-center text-xs text-white/40">© {new Date().getFullYear()} EventSphere · College System Design & DevOps project · Sample events are demo data</div>
    </footer>
  );
}
