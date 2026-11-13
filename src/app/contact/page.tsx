import type { Metadata } from "next";
import { Mail, MapPin, Info } from "lucide-react";
import { ContactForm } from "@/components/about/ContactForm";

export const metadata: Metadata = { title: "Contact" };
export default function ContactPage() {
  return (
    <section className="container-x grid gap-10 py-14 lg:grid-cols-[.8fr_1.2fr]">
      <div>
        <p className="mb-3 text-xs font-bold uppercase tracking-[.25em] text-lime">Contact</p>
        <h1 className="font-display text-5xl font-bold leading-[.92] sm:text-6xl">Say <span className="text-magenta">hello.</span></h1>
        <p className="mt-4 text-white/65">Questions, feedback or want to host an event? Drop us a note.</p>
        <ul className="mt-8 space-y-4 text-sm text-white/70">
          <li className="flex gap-3"><MapPin className="shrink-0 text-lime" size={18} /> Jaipur, Rajasthan, India</li>
          <li className="flex gap-3"><Mail className="shrink-0 text-lime" size={18} /> Replace with your project email before submission</li>
          <li className="flex gap-3 rounded-2xl border border-violet/40 bg-violet/10 p-4"><Info className="shrink-0 text-violet-400" size={18} /> This form is a demo inbox: your message is validated and logged on the server but not stored or emailed.</li>
        </ul>
      </div>
      <ContactForm />
    </section>
  );
}
