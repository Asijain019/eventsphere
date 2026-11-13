"use client";
import { useState } from "react";
import { SmartImage } from "@/components/ui/SmartImage";
import { cn } from "@/lib/utils";

export function Gallery({ images, title }: { images: string[]; title: string }) {
  const [i, setI] = useState(0);
  const list = images.length ? images : [""];
  const activeIndex = Math.min(i, list.length - 1);
  return (
    <div className="min-w-0 max-w-full space-y-3">
      <div className="relative aspect-[16/10] overflow-hidden rounded-3xl border border-white/10 shadow-card">
        <SmartImage src={list[activeIndex]} alt={`${title} — image ${activeIndex + 1}`} className="h-full w-full" fallbackLabel={title} priority />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/70 via-transparent to-transparent" />
      </div>
      {list.length > 1 && (
        <ul className="flex min-w-0 max-w-full gap-3 overflow-x-auto pb-1" aria-label="Gallery thumbnails">
          {list.map((src, n) => (
            <li key={src + n} className="shrink-0"><button type="button" onClick={() => setI(n)} aria-label={`Show image ${n + 1}`} aria-current={n === activeIndex} className={cn("block h-16 w-24 overflow-hidden rounded-xl border-2 transition", n === activeIndex ? "border-lime" : "border-transparent opacity-60 hover:opacity-100")}>
              <SmartImage src={src} alt="" className="h-full w-full" /></button></li>
          ))}
        </ul>
      )}
    </div>
  );
}
