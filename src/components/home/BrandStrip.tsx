import { SmartImage } from "@/components/ui/SmartImage";
import { Reveal } from "@/components/ui/Reveal";
import { IMG } from "@/lib/images";

/** Brand-identity band: the cut-paper lettering reference sits on a light paper card (white background image). */
export function BrandStrip() {
  return (
    <section className="container-x py-16">
      <Reveal>
        <div className="grid items-center gap-8 overflow-hidden rounded-[2.5rem] bg-paper p-6 text-ink sm:p-10 md:grid-cols-[.8fr_1.2fr]">
          <SmartImage src={IMG.typography} alt="Colourful cut-paper creative lettering" className="aspect-[4/3] w-full rounded-3xl !bg-paper" imgClassName="object-contain mix-blend-multiply" />
          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-[.25em] text-violet">Where events meet people</p>
            <h2 className="font-display text-4xl font-bold leading-[.95] sm:text-6xl">Events are better <span className="font-serif italic text-magenta">together.</span></h2>
            <p className="mt-4 max-w-lg text-ink/70">EventSphere brings every college fest, gig, hack night and workshop in your city into one place, so the only thing left to decide is who you are going with.</p>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
