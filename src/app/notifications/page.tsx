import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { NotificationList } from "@/components/notifications/NotificationList";

export const dynamic = "force-dynamic";
export const metadata = { title: "Notifications" };

export default async function NotificationsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/notifications");
  return (
    <div className="container-x max-w-3xl py-10">
      <h1 className="section-title mb-8">Notifi<span className="text-lime">cations</span></h1>
      <NotificationList />
    </div>
  );
}
