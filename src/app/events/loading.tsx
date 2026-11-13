import { Skeleton } from "@/components/ui/States";
export default function Loading() {
  return (
    <div className="container-x py-10" aria-busy aria-label="Loading events">
      <Skeleton className="mb-8 h-40 w-full rounded-3xl" />
      <Skeleton className="mb-6 h-12 w-full rounded-full" />
      <div className="grid gap-8 lg:grid-cols-[300px_1fr]">
        <Skeleton className="hidden h-[520px] rounded-3xl lg:block" />
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">{Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="h-96 rounded-3xl" />)}</div>
      </div>
    </div>
  );
}
