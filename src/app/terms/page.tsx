import type { Metadata } from "next";
export const metadata: Metadata = { title: "Terms of Use" };
const SECTIONS: { h: string; p: string }[] = [
  { h: "Using EventSphere", p: "Use the platform to discover and take part in events, and to meet other people respectfully. You are responsible for the accuracy of what you post." },
  { h: "Accounts", p: "Keep your password safe. Organizer features are for people who run real events and may be restricted by role." },
  { h: "Registrations and capacity", p: "Seats are first come, first served and checked on the server. Organizers may cancel or change events, and you will be notified in-app." },
  { h: "Community conduct", p: "No harassment, spam, hate or illegal content. We may remove content and restrict accounts that break these rules." },
  { h: "Sample data", p: "Events, colleges and communities marked Sample or Demo are fictional placeholders for this project." },
  { h: "No warranty", p: "This is a student project provided as is, without guarantees of availability. Paid ticketing is not offered." },
  { h: "Changes", p: "These terms may change as the project evolves." }
];
export default function Page() {
  return (
    <article className="container-x max-w-3xl py-14">
      <p className="mb-3 text-xs font-bold uppercase tracking-[.25em] text-lime">Legal</p>
      <h1 className="font-display text-5xl font-bold leading-[.95] sm:text-6xl">Terms of Use</h1>
      <p className="mt-4 rounded-2xl border border-violet/40 bg-violet/10 p-4 text-sm text-white/75">EventSphere is a college System Design and DevOps project. This page is plain-language demo content, not legal advice, and no real service is being offered.</p>
      <div className="mt-8 space-y-8">
        {SECTIONS.map((s) => (<section key={s.h}><h2 className="font-display text-2xl font-bold">{s.h}</h2><p className="mt-2 leading-relaxed text-white/65">{s.p}</p></section>))}
      </div>
    </article>
  );
}
