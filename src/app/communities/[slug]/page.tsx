import Link from "next/link";
import { notFound } from "next/navigation";
import { Users } from "lucide-react";
import { getCurrentUser } from "@/lib/session";
import { ApiError } from "@/lib/api";
import { getCommunity } from "@/modules/communities/service";
import { SmartImage } from "@/components/ui/SmartImage";
import { CommunityView } from "@/components/communities/CommunityView";
import { IMG } from "@/lib/images";

export const dynamic = "force-dynamic";

export default async function CommunityPage({ params }: { params: { slug: string } }) {
  const viewer = await getCurrentUser();
  let c;
  try { c = await getCommunity(viewer, params.slug); } catch (e) { if (e instanceof ApiError && e.status === 404) notFound(); throw e; }
  const data = JSON.parse(JSON.stringify(c));
  return (
    <>
      <section className="relative isolate overflow-hidden border-b border-white/10">
        <div aria-hidden className="pointer-events-none absolute inset-0"><SmartImage src={c.coverUrl ?? (c.type === "EVENT" ? IMG.venue : IMG.megaphone)} alt="" className="h-full w-full opacity-35" fallbackLabel="" /></div>
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink via-ink/70 to-ink/30" />
        <div className="container-x relative z-10 py-8 sm:py-10">
          <Link href="/communities" className="text-sm text-white/60 hover:text-white">&larr; All communities</Link>
          <div className="mt-4 flex flex-wrap items-center gap-2"><span className="chip !border-lime/50 text-lime">{c.type === "EVENT" ? "Event community" : "Interest community"}</span>{c.topic && <span className="chip">{c.topic}</span>}<span className="chip"><Users size={13} />{c.memberCount} members</span></div>
          <h1 className="section-title mt-3 max-w-3xl">{c.name}</h1>
          <p className="mt-4 max-w-2xl text-lg text-white/70">{c.description}</p>
        </div>
      </section>
      <div className="container-x py-6"><CommunityView community={data} viewerId={viewer?.id ?? null} /></div>
    </>
  );
}
