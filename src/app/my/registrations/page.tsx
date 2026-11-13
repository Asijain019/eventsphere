import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/session";
import { IMG } from "@/lib/images";
import { listMyRegistrations } from "@/modules/events/registration";
import { MyRegistrations } from "@/components/events/MyRegistrations";
import { ErrorState } from "@/components/ui/States";
import { SmartImage } from "@/components/ui/SmartImage";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "My registrations" };

export default async function Page() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/my/registrations");
  let data: Awaited<ReturnType<typeof listMyRegistrations>> | null = null;
  try { data = await listMyRegistrations(user.id); } catch (e) { console.error("[my registrations]", e); }
  return (
    <>
      <section className="relative overflow-hidden border-b border-white/10">
        <SmartImage src={IMG.passes} alt="" className="absolute inset-0 h-full w-full opacity-30" />
        <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink/85 to-transparent" />
        <div className="container-x relative py-12 sm:py-16">
          <p className="chip mb-3 !border-lime/40 !text-lime">Your tickets</p>
          <h1 className="font-display text-4xl font-bold sm:text-6xl">My registrations</h1>
          <p className="mt-3 max-w-lg text-white/70">Every event you&apos;ve signed up for, with your ticket reference for check-in.</p>
        </div>
      </section>
      <div className="container-x py-10">
        {data ? <MyRegistrations upcoming={data.upcoming as any} past={data.past as any} cancelled={data.cancelled as any} /> : <ErrorState message="We couldn't load your registrations. Please refresh." />}
      </div>
    </>
  );
}
