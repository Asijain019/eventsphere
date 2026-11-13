import type { Metadata } from "next";
import Link from "next/link";
import { Layers, Boxes, Database, Target, Heart } from "lucide-react";
import { ArchitectureDiagram } from "@/components/about/ArchitectureDiagram";
import { SmartImage } from "@/components/ui/SmartImage";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHead } from "@/components/home/SectionHead";
import { IMG } from "@/lib/images";

export const metadata: Metadata = { title: "About", description: "The story, architecture and team behind EventSphere." };

const STACK = ["Next.js 14 (App Router)", "TypeScript", "Tailwind CSS", "Framer Motion", "PostgreSQL", "Drizzle ORM", "Zod", "JWT sessions + bcrypt", "Vitest", "Docker", "GitHub Actions", "Vercel"];
const AREAS = [
  { n: "Attendee experience", r: "Discovery & participation", d: "Event discovery, registration, teams, profiles and attendee-facing flows." },
  { n: "Platform services", r: "APIs & data", d: "Authentication, event operations, communities, applications and social features." },
  { n: "Operations", r: "Testing & delivery", d: "Database migrations, automated checks, container builds and deployment configuration." },
];

export default function AboutPage() {
  return (
    <>
      <section className="container-x pb-16 pt-14">
        <Reveal><p className="mb-3 text-xs font-bold uppercase tracking-[.25em] text-lime">About EventSphere</p>
          <h1 className="font-display text-5xl font-bold leading-[.92] sm:text-7xl">Where events <span className="font-serif italic text-magenta">meet</span> people.</h1></Reveal>
        <div className="mt-10 grid gap-8 lg:grid-cols-[1.2fr_.8fr]">
          <Reveal delay={0.1}><div className="space-y-4 text-lg text-white/70">
            <p>College fests, hackathons, gigs and workshops are scattered across posters, WhatsApp groups and Instagram stories. Students miss events at the college next door, and organizers struggle to reach beyond their own campus.</p>
            <p>EventSphere is an inter-college and city-wide platform for discovering events, registering, taking part as a contestant or volunteer, and meeting the people who are going. It starts in Jaipur, and cities and colleges are data, so it can grow anywhere.</p>
            <p className="text-sm text-white/45">EventSphere is a college System Design and DevOps project. Events shown are demo data unless stated otherwise.</p>
          </div></Reveal>
          <Reveal delay={0.2}><div className="grid gap-3">
            {[[Target, "Mission", "Make every event in a city easy to find, join and enjoy."], [Heart, "Principles", "Privacy by default, honest UI, real working features."]].map(([I, t, d]: any) => (
              <div key={t} className="card flex gap-4 p-5"><I className="shrink-0 text-lime" /><div><p className="font-display font-bold">{t}</p><p className="text-sm text-white/60">{d}</p></div></div>
            ))}
          </div></Reveal>
        </div>
      </section>

      <section className="container-x py-12">
        <SectionHead kicker="Architecture" title={<>A three-tier <span className="text-lime">modular monolith.</span></>} sub="One deployable backend with clear internal module boundaries: simple to run and explain today, easy to split into services later." />
        <div className="mb-8 grid gap-4 md:grid-cols-3">
          {[[Layers, "Three tiers", "Presentation, application (API plus modules) and data layers, each with one job."], [Boxes, "Modular monolith", "Domain modules keep business logic organized behind service functions."], [Database, "Right-sized data", "PostgreSQL for persistence, configurable object storage for uploads, and in-process rate limiting and notifications."]].map(([I, t, d]: any) => (
            <Reveal key={t}><div className="card h-full p-5"><I className="mb-3 text-violet-400" /><p className="font-display text-lg font-bold">{t}</p><p className="mt-1 text-sm text-white/60">{d}</p></div></Reveal>
          ))}
        </div>
        <ArchitectureDiagram />
        <Reveal className="mt-8">
          <details className="card group overflow-hidden p-4">
            <summary className="cursor-pointer font-display font-bold">View the original architecture diagram</summary>
            <div className="mt-4 rounded-2xl bg-paper p-2"><SmartImage src={IMG.architecture} alt="Original EventSphere three-tier modular monolith architecture diagram" className="aspect-[16/10] w-full !bg-paper" imgClassName="object-contain" /></div>
            <a href={IMG.architecture} target="_blank" rel="noreferrer" className="mt-3 inline-block text-sm text-lime underline">Open the image in a new tab</a>
          </details>
        </Reveal>
      </section>

      <section className="container-x py-12">
        <SectionHead kicker="Technology" title={<>Built with <span className="text-magenta">care.</span></>} />
        <div className="flex flex-wrap gap-2.5">{STACK.map((s) => <span key={s} className="chip !px-4 !py-2 text-sm">{s}</span>)}</div>
      </section>

      <section className="container-x py-12">
        <SectionHead kicker="How it is built" title={<>One platform, <span className="text-lime">three workstreams.</span></>} sub="The project brings together product experience, platform services and reliable delivery." />
        <div className="grid gap-4 md:grid-cols-3">
          {AREAS.map((m, i) => (
            <Reveal key={m.n} delay={i * 0.08}><div className="card h-full p-6">
              <div className="mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-brand-gradient font-display text-xl font-black">{i + 1}</div>
              <p className="font-display text-xl font-bold">{m.n}</p><p className="text-sm font-semibold text-lime">{m.r}</p><p className="mt-2 text-sm text-white/60">{m.d}</p>
            </div></Reveal>
          ))}
        </div>
        <div className="mt-10 text-center"><Link href="/contact" className="btn-primary">Get in touch</Link></div>
      </section>
    </>
  );
}
