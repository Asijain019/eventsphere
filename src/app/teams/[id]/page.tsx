import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Crown, Users } from "lucide-react";
import { getCurrentUser } from "@/lib/session";
import { ApiError } from "@/lib/api";
import { getTeam } from "@/modules/events/teams";
import { JoinTeamButton, RequestRow, TeamOwnerActions, LeaveTeamButton, InviteResponse } from "@/components/events/TeamActions";
import { SmartImage } from "@/components/ui/SmartImage";
import { ErrorState } from "@/components/ui/States";
import { formatDate, initials } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Team" };

function Person({ u, badge }: { u: { id: string; name: string; avatarUrl: string | null; skills: string[]; collegeName: string | null }; badge?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      {u.avatarUrl ? <SmartImage src={u.avatarUrl} alt="" className="h-11 w-11 shrink-0 rounded-full" /> : <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-brand-gradient font-display text-sm font-bold">{initials(u.name)}</span>}
      <div className="min-w-0"><Link href={`/u/${u.id}`} className="flex items-center gap-2 truncate font-semibold hover:text-lime">{u.name}{badge}</Link>
        <p className="truncate text-xs text-white/55">{[u.collegeName, u.skills.slice(0, 3).join(" · ")].filter(Boolean).join(" — ")}</p></div>
    </div>
  );
}

export default async function TeamPage({ params }: { params: { id: string } }) {
  const user = await getCurrentUser().catch(() => null);
  let t: Awaited<ReturnType<typeof getTeam>>;
  try { t = await getTeam(params.id, user?.id); }
  catch (e) { if (e instanceof ApiError && e.status === 404) notFound(); console.error("[team page]", e); return <div className="container-x py-20"><ErrorState message="Couldn't load this team. Please refresh." /></div>; }
  const full = t.memberCount >= t.maxSize;
  const canRegister = t.viewer.isCaptain && t.status !== "DISBANDED" && t.event.status === "PUBLISHED";
  const joinBlocked = t.status === "DISBANDED" ? "Team disbanded" : t.status === "REGISTERED" ? "Team registered" : full ? "Team is full" : undefined;

  return (
    <div className="container-x py-10">
      <Link href="/teams" className="text-sm text-white/60 hover:text-lime">← All teams</Link>
      <div className="mt-4 grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="space-y-8">
          <header className="card relative overflow-hidden p-6 sm:p-8">
            <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-magenta/25 blur-3xl" aria-hidden />
            <div className="relative">
              <Link href={`/events/${t.event.slug}`} className="text-xs uppercase tracking-wider text-violet-400 hover:text-lime">{t.event.title} · {formatDate(t.event.startAt)}</Link>
              <h1 className="mt-2 font-display text-4xl font-bold sm:text-5xl">{t.name}</h1>
              <div className="mt-3 flex flex-wrap gap-2"><span className="chip"><Users size={12} />{t.memberCount}/{t.maxSize} members</span><span className="chip">{t.status === "FORMING" ? "Recruiting" : t.status.charAt(0) + t.status.slice(1).toLowerCase()}</span></div>
              {t.description && <p className="mt-4 whitespace-pre-line text-white/75">{t.description}</p>}
              {t.openRoles.length > 0 && <div className="mt-5"><p className="mb-2 text-xs uppercase tracking-wider text-white/50">Skills needed</p><div className="flex flex-wrap gap-2">{t.openRoles.map((r) => <span key={r} className="chip !border-magenta/40 !text-magenta">{r}</span>)}</div></div>}
            </div>
          </header>

          <section aria-labelledby="mem"><h2 id="mem" className="mb-4 font-display text-2xl font-bold">Members</h2>
            <ul className="grid gap-3 sm:grid-cols-2">{t.members.map((m) => <li key={m.id} className="card p-4"><Person u={m} badge={m.isCaptain ? <Crown size={14} className="text-lime" aria-label="Captain" /> : null} /></li>)}
              {Array.from({ length: t.spotsLeft }, (_, i) => <li key={i} className="grid place-items-center rounded-3xl border border-dashed border-white/20 p-4 text-sm text-white/40">Open spot</li>)}</ul></section>

          {t.viewer.isCaptain && (
            <section aria-labelledby="req"><h2 id="req" className="mb-4 font-display text-2xl font-bold">Join requests {t.requests.length > 0 && <span className="ml-1 rounded-full bg-lime px-2 py-0.5 text-sm text-ink">{t.requests.length}</span>}</h2>
              {t.requests.length === 0 ? <p className="text-sm text-white/55">No pending requests. Share your team link to attract teammates.</p> :
                <ul className="space-y-3">{t.requests.map((r) => <RequestRow key={r.memberId} teamId={t.id} memberId={r.memberId} name={r.user.name} message={r.message}><Person u={r.user} /></RequestRow>)}</ul>}
              {t.invites.length > 0 && <p className="mt-3 text-xs text-white/50">Invitations pending: {t.invites.map((i) => i.user.name).join(", ")}</p>}
            </section>
          )}
        </div>

        <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          <div className="card space-y-4 p-6">
            {t.viewer.invited && <InviteResponse teamId={t.id} teamName={t.name} />}
            {t.viewer.isCaptain && <TeamOwnerActions teamId={t.id} eventId={t.event.id} status={t.status} canRegister={canRegister} memberCount={t.memberCount} minSize={t.event.minTeamSize} />}
            {t.viewer.isMember && <LeaveTeamButton teamId={t.id} isCaptain={t.viewer.isCaptain} />}
            {!t.viewer.isMember && !t.viewer.invited && (t.viewer.requestPending
              ? <button className="btn-ghost w-full" disabled>Request pending ✓</button>
              : <JoinTeamButton teamId={t.id} teamName={t.name} loggedIn={!!user} disabledReason={joinBlocked} className="w-full" />)}
            <p className="text-xs text-white/45">Team size {t.event.minTeamSize === t.event.maxTeamSize ? t.event.maxTeamSize : `${t.event.minTeamSize}–${t.event.maxTeamSize}`}. Only names, colleges and skills are shown — contact details stay private.</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
