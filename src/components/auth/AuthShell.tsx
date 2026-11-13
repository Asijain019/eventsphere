import Link from "next/link";
import { SmartImage } from "@/components/ui/SmartImage";
import { IMG } from "@/lib/images";

/** Split-screen layout: form on the left, image collage on the right (hidden on small screens). */
export function AuthShell({ children, quote }: { children: React.ReactNode; quote: string }) {
  return (
    <div className="grid min-h-[calc(100vh-4rem)] lg:grid-cols-2">
      <div className="flex items-center justify-center px-4 py-10 sm:px-8">{children}</div>
      <aside className="relative hidden overflow-hidden lg:block" aria-hidden>
        <SmartImage src={IMG.djHands} alt="" className="absolute inset-0" fallbackLabel="EventSphere" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/40 to-violet/30" />
        <div className="absolute right-10 top-12 w-48 -rotate-6 overflow-hidden rounded-3xl border-4 border-lime shadow-glow"><SmartImage src={IMG.crowd} alt="" className="aspect-[3/4]" /></div>
        <div className="absolute left-10 top-40 w-40 rotate-6 overflow-hidden rounded-3xl border-4 border-magenta shadow-glow"><SmartImage src={IMG.stageBW} alt="" className="aspect-square" /></div>
        <div className="absolute inset-x-10 bottom-12">
          <p className="font-display text-4xl font-bold leading-[1.05]">{quote}</p>
          <p className="mt-3 text-sm text-white/70">Discover. Experience. Connect.</p>
          <Link href="/events" className="btn-lime mt-5 pointer-events-auto">Browse events first</Link>
        </div>
      </aside>
    </div>
  );
}
