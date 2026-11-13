import { notFound } from "next/navigation";
import { MapPin, GraduationCap, Lock, ExternalLink } from "lucide-react";
import { getCurrentUser } from "@/lib/session";
import { ApiError } from "@/lib/api";
import { getPublicProfile } from "@/modules/connections/profile";
import { Avatar } from "@/components/social/Avatar";
import { ProfileActions } from "@/components/profile/ProfileActions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Profile" };

export default async function PublicProfilePage({ params }: { params: { id: string } }) {
  const viewer = await getCurrentUser();
  let p;
  try { p = await getPublicProfile(viewer?.id ?? null, params.id); }
  catch (e) { if (e instanceof ApiError && e.status === 404) notFound(); throw e; }
  const full = p.visibility === "FULL";
  return (
    <div className="container-x max-w-3xl py-12">
      <div className="card overflow-hidden">
        <div className="h-32 bg-brand-gradient" aria-hidden />
        <div className="px-6 pb-8">
          <div className="-mt-14 flex flex-wrap items-end justify-between gap-4">
            <Avatar name={p.name} src={p.avatarUrl} size={112} className="border-4 border-ink2" />
            <ProfileActions userId={p.id} state={p.connection} loggedIn={!!viewer} />
          </div>
          <h1 className="mt-4 font-display text-4xl font-bold">{p.name}</h1>
          {full ? (
            <>
              <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-white/60">
                {p.collegeName && <span className="inline-flex items-center gap-1.5"><GraduationCap size={15} />{p.collegeName}{p.year ? ` · ${p.year}` : ""}</span>}
                {p.cityName && <span className="inline-flex items-center gap-1.5"><MapPin size={15} />{p.cityName}</span>}
                {p.linkedinUrl && <a href={p.linkedinUrl} target="_blank" rel="noopener noreferrer nofollow" className="inline-flex items-center gap-1.5 hover:text-lime"><ExternalLink size={15} />LinkedIn</a>}
              </div>
              {p.bio ? <p className="mt-5 whitespace-pre-line text-white/80">{p.bio}</p> : <p className="mt-5 text-white/40">No bio yet.</p>}
              <Tags title="Skills" items={p.skills ?? []} /><Tags title="Interests" items={p.interests ?? []} />
            </>
          ) : (
            <div className="mt-6 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/65"><Lock size={18} aria-hidden />{p.note}</div>
          )}
        </div>
      </div>
    </div>
  );
}
function Tags({ title, items }: { title: string; items: string[] }) {
  if (!items.length) return null;
  return <div className="mt-6"><h2 className="label">{title}</h2><div className="flex flex-wrap gap-2">{items.map((s) => <span key={s} className="chip">{s}</span>)}</div></div>;
}
