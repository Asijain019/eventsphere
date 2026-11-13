import Link from "next/link";
import { EmptyState } from "@/components/ui/States";
export default function NotFound() {
  return <div className="container-x py-24"><EmptyState title="Event not found" body="It may have been unpublished or the link is wrong." action={<Link href="/events" className="btn-primary">Browse events</Link>} /></div>;
}
