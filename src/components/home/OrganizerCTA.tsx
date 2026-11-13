import Link from "next/link";
import { BarChart3, Megaphone, Users2 } from "lucide-react";
import { SmartImage } from "@/components/ui/SmartImage";
import { Reveal } from "@/components/ui/Reveal";
import { Tilt } from "@/components/ui/Tilt";
import { IMG } from "@/lib/images";

/** Megaphone art has a white background, so it sits on a paper panel (multiply blend) to look intentional. */
export function OrganizerCTA() {
  return (
    <section className="container-x pb-8">
      <Reveal>
        <div className="grid overflow-hidden rounded-[2.5rem] bg-paper text-ink lg:grid-cols-[1.1fr_.9fr]">
          <div className="p-8 sm:p-14">
            <p className="mb-3 text-xs font-bold uppercase tracking-[.25em] text-violet">For organizers</p>
            <h2 className="font-display text-4xl font-bold leading-[.95] sm:text-6xl">Have an event worth sharing?<br /><span className="text-violet">Bring it to EventSphere.</span></h2>
            <ul className="mt-6 space-y-2 text-sm text-ink/70">
              <li className="flex items-center gap-2"><Megaphone size={16} className="text-magenta" /> Publish in minutes with posters, schedule and capacity.</li>
              <li className="flex items-center gap-2"><Users2 size={16} className="text-magenta" /> Manage registrations, volunteers and contestants.</li>
              <li className="flex items-center gap-2"><BarChart3 size={16} className="text-magenta" /> See basic analytics for every event.</li>
            </ul>
            <div className="mt-8 flex flex-wrap gap-3"><Link href="/organizer/events/new" className="btn bg-ink px-6 py-3 text-paper hover:bg-violet">Host an Event</Link><Link href="/organizer" className="btn border border-ink/20 px-6 py-3 hover:bg-ink/5">Organizer dashboard</Link></div>
          </div>
          <Tilt max={6} className="relative min-h-[320px]">
            <SmartImage src={IMG.megaphone} alt="Halftone megaphone with magazine strips" className="absolute inset-0 !bg-paper" imgClassName="object-contain object-center mix-blend-multiply" />
          </Tilt>
        </div>
      </Reveal>
    </section>
  );
}
