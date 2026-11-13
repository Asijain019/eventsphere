import Link from "next/link";
import { Reveal } from "@/components/ui/Reveal";
import { SKILLS } from "@/lib/constants";

export function TeamTeaser() {
  const tones = ["bg-violet", "bg-magenta", "bg-lime text-ink", "bg-sky", "bg-orange text-ink"];
  return (
    <section className="container-x pb-14 sm:pb-16">
      <Reveal>
        <div className="relative overflow-hidden rounded-[2.5rem] bg-brand-gradient p-8 sm:p-12">
          <div aria-hidden className="absolute -right-10 -top-10 h-56 w-56 rounded-full border-[28px] border-white/15" />
          <div className="relative grid items-center gap-8 lg:grid-cols-2">
            <div>
              <p className="mb-3 text-xs font-bold uppercase tracking-[.25em] text-lime">Find my team</p>
              <h2 className="section-title">Got the idea?<br />Find the people.</h2>
              <p className="mt-4 max-w-md text-white/85">Post the skills your hackathon team needs, or browse open roles and request to join. Team leads accept or decline.</p>
              <div className="mt-6 flex flex-wrap gap-3"><Link href="/teams" className="btn-lime">Browse teams</Link><Link href="/teams/new" className="btn bg-ink/40 text-white hover:bg-ink/60">Create a team</Link></div>
            </div>
            <div className="flex flex-wrap gap-2.5 lg:justify-end" aria-label="Example skills teams look for">
              {SKILLS.map((s, i) => <span key={s} className={`${tones[i % tones.length]} rounded-full px-4 py-2 font-display text-sm font-bold shadow-lg`} style={{ transform: `rotate(${((i * 37) % 9) - 4}deg)` }}>{s}</span>)}
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
