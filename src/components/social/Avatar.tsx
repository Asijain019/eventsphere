import { cn, initials } from "@/lib/utils";
/** Round avatar: image if present, otherwise brand-gradient initials. */
export function Avatar({ name, src, size = 44, className }: { name: string; src?: string | null; size?: number; className?: string }) {
  const style = { width: size, height: size, fontSize: Math.max(11, size * 0.36) };
  return src ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={name} style={style} className={cn("shrink-0 rounded-full object-cover", className)} />
  ) : (
    <span role="img" aria-label={name} style={style} className={cn("grid shrink-0 place-items-center rounded-full bg-brand-gradient font-display font-bold", className)}>{initials(name)}</span>
  );
}
