import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Reveal } from "@/components/ui/Reveal";

export function SectionHead({ kicker, title, sub, href, cta, light }: { kicker: string; title: React.ReactNode; sub?: string; href?: string; cta?: string; light?: boolean }) {
  return (
    <Reveal className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div className="max-w-2xl">
        <p className={`mb-3 text-xs font-bold uppercase tracking-[.25em] ${light ? "text-violet" : "text-lime"}`}>{kicker}</p>
        <h2 className="section-title">{title}</h2>
        {sub && <p className={`mt-4 text-base ${light ? "text-ink/70" : "text-white/60"}`}>{sub}</p>}
      </div>
      {href && <Link href={href} className={light ? "btn bg-ink text-paper hover:bg-violet" : "btn-ghost"}>{cta ?? "View all"} <ArrowRight size={16} /></Link>}
    </Reveal>
  );
}
