import Link from "next/link";
import { Users, MessageCircle, UserPlus, ShieldCheck, ArrowRight } from "lucide-react";
import { SmartImage } from "@/components/ui/SmartImage";
import { Reveal } from "@/components/ui/Reveal";
import { Tilt } from "@/components/ui/Tilt";
import { IMG } from "@/lib/images";
import { INTERESTS } from "@/lib/constants";
import type { HomeCommunity } from "@/modules/home/service";
import { SectionHead } from "./SectionHead";

const ACCENT = ["#8B35FF", "#E83EAB", "#D6FF55", "#2F8CFF", "#FF7A1A", "#14B8A6"];

export function CommunitiesSection({ communities }: { communities: HomeCommunity[] }) {
  return (
    <section className="container-x py-20">
      <SectionHead kicker="Communities & people" title={<>Find your <span className="text-magenta">crowd.</span></>} sub="Join interest communities, meet people attending the same events, and only chat once you both agree to connect." href="/communities" cta="Browse communities" />
      <div className="grid gap-8 lg:grid-cols-[1.1fr_.9fr]">
        <div className="grid content-start gap-4 sm:grid-cols-2">
          {communities.length ? communities.map((c, i) => (
            <Reveal key={c.slug} delay={(i % 2) * 0.08}>
              <Link href={`/communities/${c.slug}`} className="card group block h-full p-5 transition hover:-translate-y-1 hover:shadow-glow">
                <span className="mb-4 grid h-11 w-11 place-items-center rounded-2xl font-display text-lg font-black text-ink" style={{ background: ACCENT[i % ACCENT.length] }}>{c.name[0]}</span>
                <h3 className="font-display text-lg font-bold group-hover:text-lime">{c.name}</h3>
                <p className="mt-1 line-clamp-2 text-sm text-white/60">{c.description}</p>
                <p className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-white/50"><Users size={13} /> {c.members} {c.members === 1 ? "member" : "members"}</p>
              </Link>
            </Reveal>
          )) : (
            <div className="card col-span-full p-6">
              <p className="font-display text-lg font-bold">Communities are warming up</p>
              <p className="mt-1 text-sm text-white/60">Pick an interest and start the first one.</p>
              <div className="mt-4 flex flex-wrap gap-2">{INTERESTS.map((t) => <span key={t} className="chip">{t}</span>)}</div>
              <Link href="/communities" className="btn-lime mt-5">Open communities</Link>
            </div>
          )}
        </div>

        <Reveal>
          <Tilt max={5}>
            <div className="relative overflow-hidden rounded-[2rem] border border-white/10">
              {/* student-brainstorm.jpg was not supplied: SmartImage shows the branded gradient until the file is added to public/assets/ref */}
              <SmartImage src={IMG.studentBrainstorm} alt="Students brainstorming together" className="aspect-[4/3] w-full" fallbackLabel="Students collaborating" />
              <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/30 to-transparent" />
              <div className="absolute inset-x-4 bottom-4 glass !rounded-2xl p-4">
                <p className="font-display text-xl font-bold">Meet people who are going too</p>
                <ul className="mt-3 space-y-2 text-sm text-white/75">
                  <li className="flex gap-2"><UserPlus size={16} className="mt-0.5 shrink-0 text-lime" /> Opt in to attendee discovery, per event.</li>
                  <li className="flex gap-2"><ShieldCheck size={16} className="mt-0.5 shrink-0 text-lime" /> No contact details shared until you connect.</li>
                  <li className="flex gap-2"><MessageCircle size={16} className="mt-0.5 shrink-0 text-lime" /> Messaging unlocks after a request is accepted.</li>
                </ul>
                <Link href="/my/network" className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-lime">Your network <ArrowRight size={14} /></Link>
              </div>
            </div>
          </Tilt>
        </Reveal>
      </div>
    </section>
  );
}
