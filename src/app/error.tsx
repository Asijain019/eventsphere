"use client";
import { useEffect } from "react";
import Link from "next/link";
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error); }, [error]);
  return (
    <section className="container-x grid min-h-[60vh] place-items-center py-20 text-center" role="alert">
      <div>
        <p className="font-display text-6xl font-black text-magenta">Oops.</p>
        <h1 className="mt-2 font-display text-3xl font-bold">Something went wrong.</h1>
        <p className="mx-auto mt-2 max-w-md text-white/60">An unexpected error occurred. You can try again, or head back home.{error.digest && <span className="block text-xs text-white/30">Ref: {error.digest}</span>}</p>
        <div className="mt-6 flex justify-center gap-3"><button className="btn-lime" onClick={reset}>Try again</button><Link href="/" className="btn-ghost">Home</Link></div>
      </div>
    </section>
  );
}
