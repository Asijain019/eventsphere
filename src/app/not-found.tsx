import Link from "next/link";
export default function NotFound() {
  return (
    <section className="container-x grid min-h-[60vh] place-items-center py-20 text-center">
      <div>
        <p className="font-display text-[clamp(6rem,22vw,14rem)] font-black leading-none text-transparent [-webkit-text-stroke:3px_#D6FF55]">404</p>
        <h1 className="mt-2 font-display text-3xl font-bold">This page left the venue.</h1>
        <p className="mx-auto mt-2 max-w-md text-white/60">The page you are looking for does not exist or has moved.</p>
        <div className="mt-6 flex justify-center gap-3"><Link href="/" className="btn-lime">Back home</Link><Link href="/events" className="btn-ghost">Explore events</Link></div>
      </div>
    </section>
  );
}
