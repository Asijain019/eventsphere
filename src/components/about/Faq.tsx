"use client";
import { useState } from "react";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export function Faq({ items }: { items: { q: string; a: string }[] }) {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className="divide-y divide-white/10 rounded-3xl border border-white/10 bg-ink2/70">
      {items.map((it, i) => (
        <div key={it.q}>
          <h3><button type="button" aria-expanded={open === i} aria-controls={`faq-${i}`} onClick={() => setOpen(open === i ? null : i)} className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left font-display text-lg font-bold hover:text-lime">
            {it.q}<Plus size={20} className={cn("shrink-0 transition-transform", open === i && "rotate-45 text-lime")} />
          </button></h3>
          <div id={`faq-${i}`} role="region" hidden={open !== i} className="px-5 pb-5 text-sm leading-relaxed text-white/65">{it.a}</div>
        </div>
      ))}
    </div>
  );
}
