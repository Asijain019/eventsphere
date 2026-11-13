import type { Metadata } from "next";
import { OpportunityDetail } from "@/components/participation/OpportunityDetail";
export const metadata: Metadata = { title: "Opportunity | EventSphere" };
export default function Page({ params }: { params: { opportunityId: string } }) { return <OpportunityDetail id={params.opportunityId} />; }
