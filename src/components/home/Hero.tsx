"use client";
import Link from "next/link";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { ArrowUpRight, CalendarDays, Building2, Users, Sparkles } from "lucide-react";
import { SmartImage } from "@/components/ui/SmartImage";
import { Tilt } from "@/components/ui/Tilt";
import { IMG } from "@/lib/images";
import { CitySelector } from "./CitySelector";

const LINES = [["Your", "City."], ["Your", "People."], ["Your", "Next", "Experience."]];
const COLORS: Record<string, string> = { City: "text-lime", People: "text-magenta", Experience: "text-violet-400" };

export function Hero({ cities, city, cityName, stats }: { cities: { slug: string; name: string }[]; city: string; cityName: string; stats: { events: number; colleges: number; members: number } }) {
  const reduce = useReducedMotion();
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 600], [0, reduce ? 0 : -70]);
  const y2 = useTransform(scrollY, [0, 600], [0, reduce ? 0 : 50]);
  let w = 0;
  return (
    <section className="relative overflow-hidden pb-16 pt-10 sm:pt-16 lg:pb-24">
      {/* ambient glow + floating shapes */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -left-32 top-0 h-96 w-96 rounded-full bg-violet/30 blur-[120px]" />
        <div className="absolute right-0 top-40 h-96 w-96 rounded-full bg-magenta/20 blur-[120px]" />
        <div className="absolute left-[6%] top-[58%] hidden h-16 w-16 animate-float rounded-2xl border-2 border-lime [--r:12deg] md:block" />
        <div className="absolute left-[44%] top-[8%] hidden h-5 w-5 animate-float rounded-full bg-magenta [animation-delay:1s] md:block" />
        <svg className="absolute bottom-10 left-[40%] hidden animate-float text-lime [--r:-8deg] [animation-delay:2s] md:block" width="54" height="54" viewBox="0 0 54 54" fill="currentColor"><path d="M27 0l5 19 22 8-22 8-5 19-5-19L0 27l22-8z" /></svg>
      </div>

      <div className="container-x relative grid items-center gap-8 lg:grid-cols-[1.05fr_.95fr]">
        <div>
          <motion.div initial={reduce ? false : { opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 flex flex-wrap items-center gap-3">
            <span className="chip border-lime/40 text-lime"><Sparkles size={12} /> Discover. Experience. Connect.</span>
            <CitySelector cities={cities} current={city} />
          </motion.div>

          <h1 className="font-display text-[clamp(2.8rem,8.4vw,6.4rem)] font-bold leading-[.92] tracking-tight" aria-label="Your City. Your People. Your Next Experience.">
            {LINES.map((line, li) => (
              <span key={li} className="block overflow-hidden pb-1" aria-hidden>
                {line.map((word) => {
                  const clean = word.replace(".", ""); const i = w++;
                  return (
                    <motion.span key={word} className={`mr-[.22em] inline-block ${COLORS[clean] ?? ""}`}
                      initial={reduce ? false : { y: "110%", rotate: 4 }} animate={{ y: 0, rotate: 0 }}
                      transition={{ duration: 0.8, delay: 0.1 + i * 0.09, ease: [0.22, 1, 0.36, 1] }}>{word}</motion.span>
                  );
                })}
              </span>
            ))}
          </h1>

          <motion.p initial={reduce ? false : { opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8, duration: 0.6 }} className="mt-6 max-w-xl text-lg text-white/70">
            Discover events across colleges, meet people who share your interests, find your team and be part of something unforgettable.
          </motion.p>

          <motion.div initial={reduce ? false : { opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.95, duration: 0.6 }} className="mt-8 flex flex-wrap gap-3">
            <Link href="/events" className="btn-lime !px-7 !py-3.5 text-base">Explore Events <ArrowUpRight size={18} /></Link>
            <Link href="/organizer/events/new" className="btn-ghost !px-7 !py-3.5 text-base">Host an Event</Link>
          </motion.div>
          <p className="mt-4 text-xs text-white/40">Currently showing events in {cityName}. More cities are added by changing data, not code.</p>
        </div>

        {/* layered interactive collage */}
        <Tilt max={6} className="relative mx-auto aspect-[4/5] w-full max-w-[520px] sm:aspect-[5/4]">
          <motion.div style={{ y: y1 }} className="absolute left-0 top-0 h-[62%] w-[68%] [transform:translateZ(30px)]">
            <SmartImage src={IMG.studentBrainstorm} alt="Students sharing ideas at a campus gathering" className="h-full w-full rounded-[2rem] rotate-[-3deg] shadow-card ring-1 ring-white/20" priority />
          </motion.div>
          <motion.div style={{ y: y2 }} className="absolute right-0 top-[12%] h-[44%] w-[44%] [transform:translateZ(60px)]">
            <SmartImage src={IMG.vintagePhotography} alt="Vintage camera and photographs arranged on a table" className="h-full w-full rounded-[1.6rem] rotate-[5deg] shadow-pop ring-2 ring-lime" priority />
          </motion.div>
          <motion.div style={{ y: y1 }} className="absolute bottom-0 left-[8%] h-[40%] w-[46%] [transform:translateZ(50px)]">
            <SmartImage src={IMG.musicHeadphones} alt="Music-themed headphones poster" className="h-full w-full rounded-[1.6rem] rotate-[3deg] shadow-card ring-1 ring-white/20" priority />
          </motion.div>
          <motion.div style={{ y: y2 }} className="absolute bottom-[4%] right-[2%] h-[46%] w-[40%] [transform:translateZ(40px)]">
            <SmartImage src={IMG.readingRainbows} alt="Colorful illustration celebrating books and reading" className="h-full w-full rounded-[1.6rem] rotate-[-4deg] shadow-card ring-1 ring-white/20" priority />
          </motion.div>
          <div className="absolute left-1/2 top-[52%] grid h-24 w-24 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-lime text-center font-display text-xs font-black uppercase leading-tight text-ink [transform:translateZ(90px)]">
            <span className="animate-float">Live<br />in {cityName.slice(0, 10)}</span>
          </div>

          {/* stat chips */}
          <motion.div animate={reduce ? undefined : { y: [0, -8, 0] }} transition={{ repeat: Infinity, duration: 5 }} className="glass absolute -left-4 top-[46%] flex items-center gap-2 !rounded-2xl px-3 py-2 text-sm [transform:translateZ(80px)]">
            <CalendarDays size={16} className="text-lime" /><b className="font-display">{stats.events}</b><span className="text-white/60">live events</span>
          </motion.div>
          <motion.div animate={reduce ? undefined : { y: [0, 8, 0] }} transition={{ repeat: Infinity, duration: 6 }} className="glass absolute right-[-10px] top-[2%] flex items-center gap-2 !rounded-2xl px-3 py-2 text-sm [transform:translateZ(80px)]">
            <Building2 size={16} className="text-magenta" /><b className="font-display">{stats.colleges}</b><span className="text-white/60">colleges</span>
          </motion.div>
          <motion.div animate={reduce ? undefined : { y: [0, -6, 0] }} transition={{ repeat: Infinity, duration: 7 }} className="glass absolute bottom-[-8px] left-[42%] flex items-center gap-2 !rounded-2xl px-3 py-2 text-sm [transform:translateZ(80px)]">
            <Users size={16} className="text-violet-400" /><b className="font-display">{stats.members}</b><span className="text-white/60">members</span>
          </motion.div>
        </Tilt>
      </div>
    </section>
  );
}
