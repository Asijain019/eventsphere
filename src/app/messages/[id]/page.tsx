import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { MessagesApp } from "@/components/messages/MessagesApp";

export const dynamic = "force-dynamic";
export const metadata = { title: "Messages" };

export default async function ThreadPage({ params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(`/messages/${params.id}`)}`);
  return <div className="container-x py-6"><MessagesApp viewerId={user.id} activeId={params.id} /></div>;
}
