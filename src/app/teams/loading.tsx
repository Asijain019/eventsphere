import { Skeleton } from "@/components/ui/States";
export default function Loading() {
  return <div className="container-x py-10" aria-busy><Skeleton className="mb-8 h-40 rounded-3xl" /><div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="h-64 rounded-3xl" />)}</div></div>;
}
