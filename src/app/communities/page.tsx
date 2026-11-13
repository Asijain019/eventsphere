import { getCurrentUser } from "@/lib/session";
import { IMG } from "@/lib/images";
import { SmartImage } from "@/components/ui/SmartImage";
import { CommunityBrowser } from "@/components/communities/CommunityBrowser";

export const dynamic = "force-dynamic";
export const metadata = { title: "Communities", description: "Join interest and event communities, find your people and start conversations." };

export default async function CommunitiesPage() {
  let user = null; try { user = await getCurrentUser(); } catch { /* render logged out */ }
  return (
    <>
      <section className="relative isolate overflow-hidden border-b border-white/10">
        <div aria-hidden className="pointer-events-none absolute inset-0"><SmartImage src={IMG.studentBrainstorm} alt="" className="h-full w-full opacity-40" fallbackLabel="" /></div>
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-ink/95 via-ink/80 to-ink/35" />
        <div className="container-x relative z-10 py-8 sm:py-10 md:min-h-[15rem] md:py-12">
          <div className="relative z-10 max-w-2xl md:max-w-[55%]">
            <p className="chip mb-3 !border-lime/50 text-lime">Communities</p>
            <h1 className="font-display text-4xl font-bold leading-tight sm:text-5xl">Find your <span className="bg-brand-gradient bg-clip-text text-transparent">people</span>.</h1>
            <p className="mt-3 max-w-xl text-white/70 sm:text-lg">Join interest groups, follow event communities, share ideas and meet students who care about the same things you do.</p>
          </div>
          <div className="pointer-events-none absolute inset-y-4 right-0 hidden w-[42%] md:block" aria-hidden>
            <div className="absolute right-6 top-1 w-36 rotate-6 overflow-hidden rounded-3xl border-4 border-magenta shadow-glow"><SmartImage src={IMG.megaphone} alt="" className="aspect-[4/5]" /></div>
            <div className="absolute bottom-0 right-28 w-32 -rotate-6 overflow-hidden rounded-3xl border-4 border-lime shadow-glow"><SmartImage src={IMG.typography} alt="" className="aspect-square" /></div>
          </div>
        </div>
      </section>
      <div className="container-x py-6"><CommunityBrowser loggedIn={!!user} /></div>
    </>
  );
}
