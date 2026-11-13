import { Skeleton } from "@/components/ui/States";
export default function Loading() {
  return (
    <div className="container-x py-14" role="status" aria-label="Loading">
      <Skeleton className="h-12 w-2/3 max-w-xl" />
      <Skeleton className="mt-4 h-5 w-1/2 max-w-md" />
      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="aspect-[4/5] w-full !rounded-3xl" />)}</div>
    </div>
  );
}
