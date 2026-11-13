import type { Metadata } from "next";
import { requireLogin } from "@/modules/organizer/guard";
import { MyApplications } from "@/components/applications/MyApplications";

export const metadata: Metadata = { title: "My applications | EventSphere" };
export const dynamic = "force-dynamic";

export default async function Page({ searchParams }: { searchParams: { tab?: string } }) {
  await requireLogin("/my/applications");
  return <MyApplications initialTab={searchParams.tab === "volunteer" ? "volunteer" : "contestant"} />;
}
