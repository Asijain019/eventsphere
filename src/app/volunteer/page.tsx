import type { Metadata } from "next";
import Link from "next/link";
import { IMG } from "@/lib/images";
import { SmartImage } from "@/components/ui/SmartImage";
import { Tilt } from "@/components/ui/Tilt";
import { RoleBrowser } from "@/components/volunteer/RoleBrowser";

export const metadata: Metadata = { title: "Volunteer | EventSphere", description: "Help run college events, build your network and earn experience." };

export default function VolunteerPage({ searchParams }: { searchParams: { city?: string } }) {
  return (
    <main>
      <section className="relative overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(214,255,85,.18),transparent_45%),radial-gradient(circle_at_90%_80%,rgba(139,53,255,.4),transparent_50%)]" />
        <div className="container-x relative grid items-center gap-10 py-14 lg:grid-cols-2 lg:py-20">
          <div className="order-2 lg:order-1">
            <Tilt><SmartImage src={IMG.studentBrainstorm} alt="Students collaborating on a project" className="aspect-[4/3] rounded-3xl shadow-card" fallbackLabel="Volunteer crew" /></Tilt>
          </div>
          <div className="order-1 lg:order-2">
            <p className="chip mb-5 border-lime/40 text-lime">Volunteer connect</p>
            <h1 className="section-title">Be part of the <span className="text-lime">crew</span> behind the magic.</h1>
            <p className="mt-5 max-w-lg text-lg text-white/70">Ushers, designers, photographers, stage managers. Volunteer at events across your city, learn on the job and meet people who build things.</p>
            <div className="mt-8 flex flex-wrap gap-3"><a href="#roles" className="btn-primary">Find a role</a><Link href="/my/applications?tab=volunteer" className="btn-ghost">My volunteer applications</Link></div>
          </div>
        </div>
      </section>
      <RoleBrowser city={searchParams.city} />
    </main>
  );
}
