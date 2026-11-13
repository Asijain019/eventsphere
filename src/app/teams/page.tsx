import Link from "next/link";
import type { Metadata } from "next";
import { Plus } from "lucide-react";
import { getCurrentUser } from "@/lib/session";
import { SKILLS } from "@/lib/constants";
import { IMG } from "@/lib/images";
import { cleanParams } from "@/modules/events/schemas";
import { listTeams, listTeamEvents, myTeams } from "@/modules/events/teams";
import { TeamCard } from "@/components/events/TeamCard";
import { JoinTeamButton } from "@/components/events/TeamActions";
import { EmptyState, ErrorState } from "@/components/ui/States";
import { SmartImage } from "@/components/ui/SmartImage";
import { Reveal } from "@/components/ui/Reveal";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Find your team" };

export default async function TeamsPage({ searchParams }: { searchParams: Record<string, string | string[] | undefined> }) {
  const raw = cleanParams(searchParams);
  if (raw.event && !raw.eventId) raw.eventId = raw.event;
  const user = await getCurrentUser().catch(() => null);
  let data: Awaited<ReturnType<typeof listTeams>> | null = null; let evs: Awaited<ReturnType<typeof listTeamEvents>> = []; let mine: Awaited<ReturnType<typeof myTeams>> = []; let failed = false;
  try { [data, evs, mine] = await Promise.all([listTeams(raw), listTeamEvents(), user ? myTeams(user.id) : Promise.resolve([])]); }
  catch (e) { console.error("[teams page]", e); failed = true; }
  const href = (page: number) => { const p = new URLSearchParams(raw); p.set("page", String(page)); return `/teams?${p.toString()}`; };

  return (
    <>
      <section className="relative isolate overflow-hidden border-b border-white/10">
        <div aria-hidden className="pointer-events-none absolute inset-0"><SmartImage src={IMG.creativeNetworking} alt="" className="h-full w-full opacity-35" fallbackLabel="" /></div>
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-ink via-ink/85 to-ink/40" />
        <div className="container-x relative z-10 flex flex-wrap items-end justify-between gap-4 py-8 sm:py-10">
          <div className="max-w-3xl"><Reveal><p className="chip mb-3 !border-lime/40 !text-lime">Find my team</p></Reveal>
            <Reveal delay={0.05}><h1 className="font-display text-4xl font-bold leading-tight sm:text-6xl">Build the <span className="bg-brand-gradient bg-clip-text text-transparent">dream team.</span></h1></Reveal>
            <Reveal delay={0.1}><p className="mt-3 max-w-xl text-white/70">Hackathons and competitions are better together. Post the skills you need or join a team that needs yours.</p></Reveal></div>
          <Link href={user ? "/teams/new" : "/login?next=/teams/new"} className="btn-lime"><Plus size={16} />Create a team</Link>
        </div>
      </section>
      <div className="container-x py-6">
        <form method="get" className="card mb-6 grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-[1.4fr_1.4fr_1fr_auto_auto] lg:items-end" role="search">
          <div><label className="label" htmlFor="tq">Search</label><input id="tq" name="q" className="input" defaultValue={raw.q} placeholder="Team or event name" /></div>
          <div><label className="label" htmlFor="te">Event</label><select id="te" name="eventId" className="input" defaultValue={raw.eventId ?? ""}><option value="">All team events</option>{evs.map((e) => <option key={e.id} value={e.id}>{e.title}</option>)}</select></div>
          <div><label className="label" htmlFor="tk">Skill needed</label><select id="tk" name="skill" className="input" defaultValue={raw.skill ?? ""}><option value="">Any</option>{SKILLS.map((s) => <option key={s}>{s}</option>)}</select></div>
          <label className="flex items-center gap-2 pb-3 text-sm"><input type="checkbox" name="hasOpenSpots" value="true" defaultChecked={raw.hasOpenSpots === "true"} className="h-4 w-4 accent-[#D6FF55]" />Open spots only</label>
          <div className="flex gap-2"><button className="btn-primary">Filter</button><Link href="/teams" className="btn-ghost">Reset</Link></div>
        </form>
        {failed || !data ? <ErrorState message="We couldn't load teams right now. Please refresh." /> : data.items.length === 0 ? (
          <EmptyState title="No teams yet" body="Be the first to start one for a team event." action={<Link href={user ? "/teams/new" : "/login?next=/teams/new"} className="btn-primary">Create a team</Link>} />
        ) : (
          <>
            <p className="mb-4 text-sm text-white/60">{data.total} team{data.total === 1 ? "" : "s"}</p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {data.items.map((t, i) => {
                const rel = mine.find((m) => m.id === t.id);
                const full = t.status !== "FORMING" || t.memberCount >= t.maxSize;
                const action = rel?.memberStatus === "ACCEPTED" ? <Link href={`/teams/${t.id}`} className="btn-ghost">Your team — open</Link>
                  : rel?.memberStatus === "PENDING" ? <Link href={`/teams/${t.id}`} className="btn-ghost">{rel.memberRole === "INVITED" ? "Respond to invitation" : "Request pending"}</Link>
                  : full ? <button className="btn-ghost" disabled>Team full</button>
                  : <JoinTeamButton teamId={t.id} teamName={t.name} loggedIn={!!user} />;
                return <Reveal key={t.id} delay={(i % 3) * 0.05}><TeamCard t={t} action={action} /></Reveal>;
              })}
            </div>
            {data.totalPages > 1 && (
              <nav className="mt-10 flex items-center justify-center gap-3" aria-label="Pagination">
                {data.page > 1 ? <Link className="btn-ghost" href={href(data.page - 1)}>← Previous</Link> : <span className="btn-ghost pointer-events-none opacity-40">← Previous</span>}
                <span className="text-sm text-white/60">Page {data.page} of {data.totalPages}</span>
                {data.page < data.totalPages ? <Link className="btn-ghost" href={href(data.page + 1)}>Next →</Link> : <span className="btn-ghost pointer-events-none opacity-40">Next →</span>}
              </nav>
            )}
          </>
        )}
      </div>
    </>
  );
}
