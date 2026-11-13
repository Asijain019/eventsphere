import type { Metadata } from "next";
export const metadata: Metadata = { title: "Privacy Policy" };
const SECTIONS: { h: string; p: string }[] = [
  { h: "What we collect", p: "Account details you provide (name, email, college, city, skills, interests, bio, avatar), your registrations and applications, community posts and messages, and basic server logs." },
  { h: "How passwords are handled", p: "Passwords are hashed with bcrypt and never stored or logged in plain text. Sessions use a signed, HTTP-only cookie." },
  { h: "Who can see what", p: "Your profile visibility is yours to set. You only appear in an event attendee list if you opted into attendee discovery. Your email and other contact details are never shown to people you have not connected with." },
  { h: "Messaging", p: "One-to-one messages are only possible after a connection request is accepted. You can block or report anyone." },
  { h: "Contact form", p: "Messages sent through the Contact page are validated and logged by the demo server. They are not stored in the database or emailed." },
  { h: "Cookies", p: "We use a session cookie to keep you signed in and a preference cookie (es_city) to remember your selected city." },
  { h: "Your choices", p: "You can edit your profile, leave communities, withdraw applications and cancel registrations at any time. Ask to have your account removed through the Contact page." }
];
export default function Page() {
  return (
    <article className="container-x max-w-3xl py-14">
      <p className="mb-3 text-xs font-bold uppercase tracking-[.25em] text-lime">Legal</p>
      <h1 className="font-display text-5xl font-bold leading-[.95] sm:text-6xl">Privacy Policy</h1>
      <p className="mt-4 rounded-2xl border border-violet/40 bg-violet/10 p-4 text-sm text-white/75">EventSphere is a college System Design and DevOps project. This page is plain-language demo content, not legal advice, and no real service is being offered.</p>
      <div className="mt-8 space-y-8">
        {SECTIONS.map((s) => (<section key={s.h}><h2 className="font-display text-2xl font-bold">{s.h}</h2><p className="mt-2 leading-relaxed text-white/65">{s.p}</p></section>))}
      </div>
    </article>
  );
}
