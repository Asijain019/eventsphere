import Link from "next/link";
import { SmartImage } from "@/components/ui/SmartImage";
import { Reveal } from "@/components/ui/Reveal";
import { IMG } from "@/lib/images";

/** Magazine-style editorial band using the black-and-white stage photograph and serif display type. */
export function EditorialShowcase() {
  return (
    <section className="relative isolate overflow-hidden py-16 sm:py-24">
      <SmartImage src={IMG.movieReel} alt="Film reel and frames from a movie" className="!absolute inset-0 -z-10 h-full w-full" imgClassName="grayscale" />
      <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-r from-ink via-ink/70 to-ink/20" />
      <div className="container-x grid items-center gap-10 lg:grid-cols-[1.2fr_.8fr]">
        <div>
          <Reveal><p className="mb-6 text-xs font-bold uppercase tracking-[.3em] text-lime">The EventSphere Edit</p></Reveal>
          <Reveal delay={0.1}>
            <blockquote className="max-w-4xl font-serif text-[clamp(2.4rem,7vw,5.8rem)] font-semibold italic leading-[1] tracking-tight">
              Some nights you <span className="text-lime not-italic">attend.</span><br />Some nights you <span className="underline decoration-magenta decoration-[6px] underline-offset-[10px]">belong.</span>
            </blockquote>
          </Reveal>
          <Reveal delay={0.2}>
            <p className="mt-8 max-w-md text-white/70">From the front row of a fest to the last seat of a workshop, every event is a chance to meet your people.</p>
            <Link href="/events" className="btn-lime mt-6">Find your next night</Link>
          </Reveal>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          <SmartImage src={IMG.urbanPhotography} alt="Colorful city scenes photographed around the world" className="aspect-[4/5] rounded-2xl ring-1 ring-white/20" />
          <SmartImage src={IMG.travelCollage} alt="Travel photographs captured through a camera" className="mt-8 aspect-[4/5] rounded-2xl ring-1 ring-white/20" />
          <SmartImage src={IMG.communityBoard} alt="Community spelled out on colorful notes" className="-mt-8 aspect-[4/5] rounded-2xl ring-1 ring-white/20" />
          <SmartImage src={IMG.bookStack} alt="Illustration of a stack of books" className="aspect-[4/5] rounded-2xl bg-paper ring-1 ring-white/20" imgClassName="object-contain" />
        </div>
      </div>
    </section>
  );
}
