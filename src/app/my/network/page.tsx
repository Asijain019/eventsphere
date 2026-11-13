import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { NetworkTabs } from "@/components/social/NetworkTabs";

export const dynamic = "force-dynamic";
export const metadata = { title: "My network" };
const TABS = ["connections", "received", "sent", "blocked"] as const;

export default async function NetworkPage({ searchParams }: { searchParams: { tab?: string } }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/my/network");
  const tab = (TABS as readonly string[]).includes(searchParams.tab ?? "") ? (searchParams.tab as (typeof TABS)[number]) : "connections";
  return (
    <div className="container-x py-10">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
        <div><h1 className="section-title">My <span className="text-lime">network</span></h1><p className="mt-2 text-white/60">People you know through EventSphere. Messaging unlocks once a request is accepted.</p></div>
        <Link href="/messages" className="btn-primary">Open messages</Link>
      </div>
      <NetworkTabs initial={tab} />
    </div>
  );
}
