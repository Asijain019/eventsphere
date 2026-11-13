import { Skeleton } from "@/components/ui/States";
export default function Loading() {
  return (
    <div className="container-x grid gap-10 py-10 lg:grid-cols-[1.15fr_1fr]" aria-busy>
      <Skeleton className="aspect-[16/10] rounded-3xl" />
      <div className="space-y-4"><Skeleton className="h-6 w-40" /><Skeleton className="h-16 w-full" /><Skeleton className="h-6 w-2/3" /><Skeleton className="h-6 w-1/2" /></div>
    </div>
  );
}
