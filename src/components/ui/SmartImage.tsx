"use client";
import { useState } from "react";
import { cn } from "@/lib/utils";

/** <img> with object-fit cover and a branded gradient fallback if the file is missing (e.g. reference images not yet added). */
export function SmartImage({ src, alt, className, imgClassName, fallbackLabel, priority }: {
  src?: string | null; alt: string; className?: string; imgClassName?: string; fallbackLabel?: string; priority?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  return (
    <div className={cn("relative overflow-hidden bg-ink3", className)}>
      {src && !failed ? (
        <img src={src} alt={alt} loading={priority ? "eager" : "lazy"} onError={() => setFailed(true)} className={cn("h-full w-full object-cover", imgClassName)} />
      ) : (
        <div role="img" aria-label={alt} className="flex h-full w-full items-end bg-[radial-gradient(circle_at_30%_20%,#E83EAB_0,transparent_45%),radial-gradient(circle_at_80%_80%,#8B35FF_0,transparent_50%),#1A1A22] p-3">
          {fallbackLabel && <span className="font-display text-sm font-bold text-white/80">{fallbackLabel}</span>}
        </div>
      )}
    </div>
  );
}
