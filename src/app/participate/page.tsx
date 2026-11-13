import type { Metadata } from "next";
import Link from "next/link";
import { IMG } from "@/lib/images";
import { SmartImage } from "@/components/ui/SmartImage";
import { Tilt } from "@/components/ui/Tilt";
import { OpportunityBrowser } from "@/components/participation/OpportunityBrowser";

export const metadata: Metadata = { title: "Participate | EventSphere", description: "Compete, perform and speak at college events across your city." };

export default function ParticipatePage({ searchParams }: { searchParams: { type?: string; city?: string } }) {
  return (
    <main>
      <section className="relative overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(232,62,171,.35),transparent_45%),radial-gradient(circle_at_10%_90%,rgba(139,53,255,.35),transparent_50%)]" />
        <div className="container-x relative grid items-center gap-8 py-8 md:grid-cols-2 md:py-10 lg:gap-10 lg:py-12">
          <div>
            <p className="chip mb-5 border-lime/40 text-lime">Participate</p>
            <h1 className="section-title">Don&apos;t just attend.<br /><span className="text-lime">Take the stage.</span></h1>
            <p className="mt-5 max-w-lg text-lg text-white/70">Apply to hackathons, dance-offs, open mics, quizzes, sports meets and talks. Pitch yourself, track your application and get selected.</p>
            <div className="mt-8 flex flex-wrap gap-3"><a href="#opportunities" className="btn-primary">Browse opportunities</a><Link href="/my/applications" className="btn-ghost">My applications</Link></div>
          </div>
          <div className="relative mx-auto grid max-w-lg grid-cols-2 gap-3 sm:gap-4">
            <Tilt className="translate-y-4"><SmartImage src={IMG.sportsIllustration} alt="Colourful geometric sports illustration" className="aspect-[4/3] rounded-3xl shadow-card" /></Tilt>
            <Tilt><SmartImage src={IMG.djHands} alt="DJ performing at a live event" className="aspect-[4/3] rounded-3xl shadow-card" /></Tilt>
            <span className="absolute -bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-lime px-4 py-2 text-xs font-bold text-ink shadow-pop">Apply. Perform. Win.</span>
          </div>
        </div>
      </section>
      <OpportunityBrowser initialType={searchParams.type} city={searchParams.city} />
    </main>
  );
}
