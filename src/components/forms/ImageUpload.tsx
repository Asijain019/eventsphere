"use client";
import { useEffect, useId, useRef, useState } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  value?: string | null;
  onChange: (url: string | null) => void;
  folder?: "poster" | "avatar" | "gallery";
  label?: string;
  hint?: string;
  /** Preview shape. */
  shape?: "poster" | "wide" | "square" | "round";
  className?: string;
  disabled?: boolean;
};
const SHAPE = { poster: "aspect-[4/5]", wide: "aspect-[16/9]", square: "aspect-square", round: "aspect-square rounded-full" } as const;
const OK = ["image/jpeg", "image/png", "image/webp", "image/gif"];

/** Reusable image uploader: client-side validation, live preview, real upload progress (XHR) and error display. Posts to /api/v1/uploads. */
export function ImageUpload({ value, onChange, folder = "poster", label, hint, shape = "poster", className, disabled }: Props) {
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  function pick(file?: File) {
    if (!file) return;
    setError(null);
    if (!OK.includes(file.type)) return setError("Use a JPEG, PNG, WebP or GIF image.");
    if (file.size > 5 * 1024 * 1024) return setError("Image must be 5 MB or smaller.");
    const local = URL.createObjectURL(file);
    setPreview(local); setProgress(0);
    const fd = new FormData(); fd.append("file", file); fd.append("folder", folder);
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/v1/uploads");
    xhr.upload.onprogress = (e) => { if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 100)); };
    xhr.onerror = () => { setProgress(null); setPreview(null); setError("Network error while uploading. Please try again."); };
    xhr.onload = () => {
      setProgress(null);
      let data: { url?: string; error?: string } = {};
      try { data = JSON.parse(xhr.responseText); } catch { /* ignore */ }
      if (xhr.status >= 200 && xhr.status < 300 && data.url) { onChange(data.url); setPreview(null); }
      else { setPreview(null); setError(data.error || (xhr.status === 401 ? "Please log in again to upload." : "Upload failed.")); }
    };
    xhr.send(fd);
    if (input.current) input.current.value = "";
  }

  const shown = preview ?? value ?? null;
  const uploading = progress !== null;
  return (
    <div className={className}>
      {label && <label htmlFor={id} className="label">{label}</label>}
      <div className={cn("group relative w-full overflow-hidden border border-dashed border-white/20 bg-ink2 transition hover:border-violet", SHAPE[shape], shape !== "round" && "rounded-2xl")}>
        {shown ? <img src={shown} alt={label ? `${label} preview` : "Uploaded image preview"} className="h-full w-full object-cover" /> : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 p-4 text-center text-white/50"><ImagePlus size={28} /><span className="text-xs">Click to upload<br />JPEG, PNG, WebP or GIF, up to 5 MB</span></div>
        )}
        {uploading && (
          <div className="absolute inset-0 grid place-items-center bg-ink/70 backdrop-blur-sm" role="status" aria-live="polite">
            <div className="w-2/3 text-center"><Loader2 className="mx-auto mb-2 animate-spin" size={22} /><div className="h-1.5 overflow-hidden rounded-full bg-white/15"><div className="h-full bg-lime transition-all" style={{ width: `${progress}%` }} /></div><p className="mt-1 text-xs text-white/70">Uploading {progress}%</p></div>
          </div>
        )}
        <input id={id} ref={input} type="file" accept={OK.join(",")} disabled={disabled || uploading} onChange={(e) => pick(e.target.files?.[0])} className="absolute inset-0 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed" aria-label={label ?? "Upload image"} />
        {value && !uploading && (
          <button type="button" onClick={() => onChange(null)} disabled={disabled} aria-label="Remove image" className="absolute right-2 top-2 z-10 grid h-8 w-8 place-items-center rounded-full bg-ink/80 text-white hover:bg-red-500"><X size={15} /></button>
        )}
      </div>
      {hint && !error && <p className="mt-1.5 text-xs text-white/45">{hint}</p>}
      {error && <p role="alert" className="mt-1.5 text-xs text-red-300">{error}</p>}
    </div>
  );
}
export default ImageUpload;
