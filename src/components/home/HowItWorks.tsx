import { Search, Ticket, Trophy, Handshake } from "lucide-react";
import { SmartImage } from "@/components/ui/SmartImage";
import { Reveal } from "@/components/ui/Reveal";
import { IMG } from "@/lib/images";
import { SectionHead } from "./SectionHead";

const STEPS = [
  { n: "01", t: "Discover", d: "Browse events by city, college, category, date and price.", I: Search, c: "#D6FF55" },
  { n: "02", t: "Register", d: "Secure a seat in one click. Capacity is checked on the server.", I: Ticket, c: "#E83EAB" },
  { n: "03", t: "Participate", d: "Compete, perform or volunteer, and track every application.", I: Trophy, c: "#2F8CFF" },
  { n: "04", t: "Connect", d: "Meet fellow attendees and message after you both connect.", I: Handshake, c: "#8B35FF" },
];

export function HowItWorks() {
  return (
    <section className="container-x py-14 sm:py-16">
      <SectionHead kicker="How EventSphere works" title={<>Four steps to <span className="text-lime">in.</span></>} />
      <ol className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {STEPS.map((s, i) => (
          <Reveal key={s.n} delay={i * 0.1}>
            <li className="card relative h-full overflow-hidden p-6">
              <span className="absolute -right-2 -top-4 font-display text-8xl font-black text-white/[.05]">{s.n}</span>
              <span className="mb-5 grid h-12 w-12 place-items-center rounded-2xl text-ink" style={{ background: s.c }}><s.I size={22} /></span>
              <h3 className="font-display text-2xl font-bold">{s.t}</h3>
              <p className="mt-2 text-sm text-white/60">{s.d}</p>
              {i === 1 && (
                <div className="relative mt-5 h-28">
                  <SmartImage src={IMG.passes} alt="Event passes and badges" className="absolute inset-0 rounded-xl opacity-60" />
                  <div className="absolute inset-x-3 top-3 flex rotate-[-3deg] overflow-hidden rounded-lg bg-paper text-ink shadow-card">
                    <div className="flex-1 p-3"><p className="font-display text-xs font-black uppercase">EventSphere pass</p><p className="text-[10px] text-ink/60">ES-DEMO · Admit one</p></div>
                    <div className="grid w-12 place-items-center border-l-2 border-dashed border-ink/30 bg-lime font-display text-xs font-black [writing-mode:vertical-rl]">ENTRY</div>
                  </div>
                </div>
              )}
            </li>
          </Reveal>
        ))}
      </ol>
    </section>
  );
}
