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
      <section className="relative overflow-hidden border-b border-white/10">
        <SmartImage src={IMG.studentBrainstorm} alt="" className="absolute inset-0 opacity-40" fallbackLabel="" />
        <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink/80 to-transparent" />
        <div className="container-x relative grid items-center gap-8 py-16 md:grid-cols-[1.3fr_1fr]">
          <div>
            <p className="chip mb-4 !border-lime/50 text-lime">Communities</p>
            <h1 className="section-title">Find your <span className="bg-brand-gradient bg-clip-text text-transparent">people</span>.</h1>
            <p className="mt-4 max-w-xl text-lg text-white/70">Join interest groups, follow event communities, share ideas and meet students who care about the same things you do.</p>
          </div>
          <div className="relative hidden h-56 md:block" aria-hidden>
            <div className="absolute right-0 top-0 w-48 rotate-6 overflow-hidden rounded-3xl border-4 border-magenta shadow-glow"><SmartImage src={IMG.megaphone} alt="" className="aspect-[4/5]" /></div>
            <div className="absolute bottom-0 right-32 w-40 -rotate-6 overflow-hidden rounded-3xl border-4 border-lime shadow-glow"><SmartImage src={IMG.typography} alt="" className="aspect-square" /></div>
          </div>
        </div>
      </section>
      <div className="container-x py-10"><CommunityBrowser loggedIn={!!user} /></div>
    </>
  );
}
