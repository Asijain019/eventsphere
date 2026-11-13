import Link from "next/link";
import { Avatar } from "./Avatar";
export type PersonLite = { id: string; name: string; avatarUrl: string | null; collegeName: string | null; skills: string[]; bio: string | null };
export function PersonCard({ person, action, extra }: { person: PersonLite; action?: React.ReactNode; extra?: React.ReactNode }) {
  return (
    <div className="card flex h-full flex-col gap-3 p-5">
      <Link href={`/u/${person.id}`} className="flex items-center gap-3 rounded-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-lime">
        <Avatar name={person.name} src={person.avatarUrl} size={52} />
        <div className="min-w-0">
          <p className="truncate font-display text-lg font-bold leading-tight">{person.name}</p>
          <p className="truncate text-xs text-white/55">{person.collegeName ?? "College not listed"}</p>
        </div>
      </Link>
      {person.bio && <p className="line-clamp-2 text-sm text-white/65">{person.bio}</p>}
      {person.skills.length > 0 && <div className="flex flex-wrap gap-1.5">{person.skills.slice(0, 4).map((s) => <span key={s} className="chip !py-0.5">{s}</span>)}</div>}
      {extra}
      {action && <div className="mt-auto pt-1">{action}</div>}
    </div>
  );
}
