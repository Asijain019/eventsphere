import type { Metadata } from "next";
import { RoleDetail } from "@/components/volunteer/RoleDetail";
export const metadata: Metadata = { title: "Volunteer role | EventSphere" };
export default function Page({ params }: { params: { roleId: string } }) { return <RoleDetail id={params.roleId} />; }
