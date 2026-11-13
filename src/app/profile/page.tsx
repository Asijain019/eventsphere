import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/session";
import { getMe } from "@/modules/identity/service";
import { ProfileForm } from "@/components/profile/ProfileForm";
import { ErrorState } from "@/components/ui/States";

export const dynamic = "force-dynamic";
export const metadata = { title: "My profile" };

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/profile");
  const me = await getMe(user.id);
  if (!me) return <div className="container-x py-12"><ErrorState message="We couldn't load your profile." /></div>;
  return (
    <div className="container-x max-w-4xl py-10">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
        <div><h1 className="section-title">Your <span className="text-lime">profile</span></h1><p className="mt-2 text-white/60">This is how other EventSphere members see you.</p></div>
        <Link href={`/u/${me.id}`} className="btn-ghost">View public profile</Link>
      </div>
      <ProfileForm initial={{ ...me, skills: me.skills ?? [], interests: me.interests ?? [] } as any} />
    </div>
  );
}
