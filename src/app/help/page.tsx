import type { Metadata } from "next";
import Link from "next/link";
import { Faq } from "@/components/about/Faq";

export const metadata: Metadata = { title: "Help" };
const FAQ = [
  { q: "How do I register for an event?", a: "Open any event, then choose Register. You need an account. Free events confirm instantly while seats remain, and the server checks capacity so you never get a seat that is not there. Find it later under My Registrations." },
  { q: "Can I register as a team?", a: "Yes, when the organizer enables teams for that event. Create or join a team from the event page or from Find Team." },
  { q: "Are tickets paid?", a: "For this project, registration is free. Paid ticketing with a payment gateway is a planned future integration." },
  { q: "How do I connect with other attendees?", a: "Turn on attendee discovery in your profile, then open an event you are registered for to see others who opted in. Send a connection request. Messaging only unlocks after the other person accepts." },
  { q: "Who can see my profile?", a: "You control visibility in your profile settings. Contact details are never shown to people you are not connected to." },
  { q: "How do I volunteer or compete?", a: "Visit Volunteer or Participate, open an opportunity and apply. Track the status of every application in My Applications." },
  { q: "How do I host an event?", a: "Sign up as an organizer, then use Host an Event. You can save a draft, add a poster and schedule, then publish when ready." },
  { q: "Are the events real?", a: "Events marked Sample are demo data created for this college project." },
  { q: "I found a bug or someone behaving badly.", a: "Use Report on a profile, or send us a message from the Contact page." },
];
export default function HelpPage() {
  return (
    <section className="container-x max-w-3xl py-14">
      <p className="mb-3 text-xs font-bold uppercase tracking-[.25em] text-lime">Help centre</p>
      <h1 className="mb-8 font-display text-5xl font-bold leading-[.95] sm:text-6xl">Frequently asked <span className="text-magenta">questions.</span></h1>
      <Faq items={FAQ} />
      <p className="mt-8 text-sm text-white/60">Still stuck? <Link href="/contact" className="text-lime underline">Contact us</Link>.</p>
    </section>
  );
}
