import Link from "next/link";
import * as Icons from "lucide-react";
import { ArrowUpRight } from "lucide-react";
import { SmartImage } from "@/components/ui/SmartImage";
import { Reveal } from "@/components/ui/Reveal";
import { CATEGORIES } from "@/lib/constants";
import { IMG } from "@/lib/images";

type Tile = { img?: string; span: string; light?: boolean; pos?: string };
/** Mosaic layout: photo-led tiles use reference images; light (white-background) art sits on paper panels. */
const TILES: Record<string, Tile> = {
  "music-concerts": { img: IMG.musicHeadphones, span: "sm:col-span-2 sm:row-span-2 min-h-[320px]" },
  "cultural-fests": { img: IMG.cultureWordCloud, span: "sm:col-span-2 min-h-[170px]", light: true },
  hackathons: { img: IMG.hackathon, span: "sm:row-span-2 min-h-[320px]", pos: "object-top" },
  technology: { img: IMG.creativeNetworking, span: "min-h-[150px]" },
  sports: { img: IMG.tableTennis, span: "sm:col-span-2 min-h-[190px]", light: true },
  workshops: { img: IMG.calligraphyWorkshop, span: "min-h-[150px]" },
  entrepreneurship: { img: IMG.collaborativePuzzle, span: "min-h-[150px]" },
  "dance-performing-arts": { img: IMG.openMicPoster, span: "min-h-[150px]" },
  "photography-art": { img: IMG.creativeArtClub, span: "min-h-[150px]", light: true, pos: "object-top" },
  gaming: { img: IMG.gameOn, span: "min-h-[150px]", light: true },
  literature: { img: IMG.readingRainbows, span: "min-h-[150px]" },
  "social-impact": { img: IMG.peopleNetwork, span: "min-h-[150px]" },
};

export function CategoryMosaic({ counts }: { counts: Record<string, number> }) {
  return (
    <div className="grid auto-rows-[minmax(150px,auto)] grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-5 lg:gap-4">
      {CATEGORIES.map((c, i) => {
        const t = TILES[c.slug] ?? { span: "" };
        const Icon = (Icons as any)[c.icon] ?? Icons.Sparkles;
        const n = counts[c.slug] ?? 0;
        return (
          <Reveal key={c.slug} delay={(i % 4) * 0.05} className={`${t.span} ${i === 0 ? "col-span-2" : ""}`}>
            <Link href={`/events?category=${c.slug}`} className="group relative flex h-full min-h-[inherit] flex-col justify-between overflow-hidden rounded-[1.75rem] border border-white/10 p-4 transition hover:-translate-y-1 hover:shadow-glow focus-visible:outline focus-visible:outline-2 focus-visible:outline-lime"
              style={!t.img ? { background: `linear-gradient(145deg, ${c.color}40, #1A1A22 70%)` } : t.light ? { background: "#F8F7F2" } : undefined}>
              {t.img && (
                <SmartImage src={t.img} alt="" className="!absolute inset-0 h-full w-full" fallbackLabel={c.name}
                  imgClassName={`transition-transform duration-700 group-hover:scale-110 ${t.pos ?? ""} ${t.light ? "object-contain p-2 mix-blend-multiply" : ""}`} />
              )}
              {t.img && !t.light && <div className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/20 to-transparent" />}
              {t.img && t.light && <div className="absolute inset-0 bg-gradient-to-t from-paper via-transparent to-transparent" />}
              <span className="relative grid h-10 w-10 place-items-center rounded-xl text-ink" style={{ background: c.color }}><Icon size={20} /></span>
              <span className="relative">
                <span className={`block font-display text-lg font-bold leading-tight sm:text-xl ${t.light ? "text-ink" : ""}`}>{c.name}</span>
                <span className={`mt-1 flex items-center gap-1 text-xs ${t.light ? "text-ink/60" : "text-white/60"}`}>
                  {n > 0 ? `${n} upcoming` : "Explore"} <ArrowUpRight size={12} className="transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </span>
              </span>
            </Link>
          </Reveal>
        );
      })}
    </div>
  );
}
