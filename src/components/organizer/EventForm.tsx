"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, Trash2, Save, Rocket } from "lucide-react";
import { api } from "@/lib/client";
import { ImageUpload } from "@/components/forms/ImageUpload";
import { Alert, ErrorState } from "@/components/ui/States";
import { toISTInput, fromISTInput } from "@/modules/organizer/datetime";
import { Field, Spinner } from "./ui";

type Opts = { cities: { id: string; name: string; slug: string }[]; colleges: { id: string; name: string; cityId: string }[]; categories: { id: string; name: string }[] };
type F = {
  title: string; description: string; categoryId: string; cityId: string; collegeId: string; tags: string;
  mode: "OFFLINE" | "ONLINE" | "HYBRID"; startAt: string; endAt: string; registrationDeadline: string;
  venueName: string; venueAddress: string; venueLocality: string; lat: string; lng: string;
  capacity: string; feeRupees: string; eligibility: string;
  teamsEnabled: boolean; minTeamSize: string; maxTeamSize: string;
  posterUrl: string | null; gallery: string[]; schedule: { time: string; title: string; description: string }[];
};
const EMPTY: F = {
  title: "", description: "", categoryId: "", cityId: "", collegeId: "", tags: "", mode: "OFFLINE", startAt: "", endAt: "", registrationDeadline: "",
  venueName: "", venueAddress: "", venueLocality: "", lat: "", lng: "", capacity: "100", feeRupees: "0", eligibility: "", teamsEnabled: false, minTeamSize: "1", maxTeamSize: "4",
  posterUrl: null, gallery: [], schedule: [],
};

function validate(f: F): Record<string, string> {
  const e: Record<string, string> = {};
  if (f.title.trim().length < 3) e.title = "Title must be at least 3 characters";
  if (f.description.trim().length < 20) e.description = "Description must be at least 20 characters";
  if (!f.categoryId) e.categoryId = "Choose a category";
  if (!f.cityId) e.cityId = "Choose a city";
  if (!f.startAt) e.startAt = "Start date and time are required";
  if (!f.endAt) e.endAt = "End date and time are required";
  if (f.startAt && f.endAt && f.endAt <= f.startAt) e.endAt = "End must be after the start";
  if (f.registrationDeadline && f.startAt && f.registrationDeadline > f.startAt) e.registrationDeadline = "Deadline must be on or before the event start";
  if (f.mode !== "ONLINE" && (f.venueName || f.venueAddress)) {
    if (f.venueName.trim().length < 2) e.venueName = "Venue name is required";
    if (f.venueAddress.trim().length < 3) e.venueAddress = "Venue address is required";
  }
  const cap = Number(f.capacity); if (!Number.isInteger(cap) || cap < 1) e.capacity = "Capacity must be a whole number of at least 1";
  const fee = Number(f.feeRupees); if (isNaN(fee) || fee < 0) e.feeRupees = "Enter 0 for a free event";
  if (f.teamsEnabled && Number(f.minTeamSize) > Number(f.maxTeamSize)) e.maxTeamSize = "Max team size must be at least the minimum";
  if (f.lat && (isNaN(Number(f.lat)) || Math.abs(Number(f.lat)) > 90)) e.lat = "Latitude must be between -90 and 90";
  if (f.lng && (isNaN(Number(f.lng)) || Math.abs(Number(f.lng)) > 180)) e.lng = "Longitude must be between -180 and 180";
  f.schedule.forEach((s, i) => { if (!s.time.trim() || !s.title.trim()) e[`schedule.${i}`] = "Each schedule item needs a time and a title"; });
  return e;
}

function payload(f: F) {
  const hasVenue = f.mode !== "ONLINE" && f.venueName.trim() && f.venueAddress.trim();
  return {
    title: f.title.trim(), description: f.description.trim(), categoryId: f.categoryId, cityId: f.cityId, collegeId: f.collegeId || null,
    mode: f.mode, startAt: fromISTInput(f.startAt), endAt: fromISTInput(f.endAt), registrationDeadline: fromISTInput(f.registrationDeadline),
    venue: hasVenue ? { name: f.venueName.trim(), address: f.venueAddress.trim(), locality: f.venueLocality.trim() || null, lat: f.lat ? Number(f.lat) : null, lng: f.lng ? Number(f.lng) : null } : null,
    capacity: Number(f.capacity), feePaise: Math.round(Number(f.feeRupees || 0) * 100), eligibility: f.eligibility.trim() || null,
    posterUrl: f.posterUrl, gallery: f.gallery, tags: f.tags.split(",").map((t) => t.trim()).filter(Boolean).slice(0, 10),
    schedule: f.schedule.map((s) => ({ time: s.time.trim(), title: s.title.trim(), ...(s.description.trim() ? { description: s.description.trim() } : {}) })),
    teamsEnabled: f.teamsEnabled, minTeamSize: Number(f.minTeamSize), maxTeamSize: Number(f.maxTeamSize),
  };
}

function Section({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <section className="card p-6 sm:p-8">
      <h2 className="mb-6 flex items-center gap-3 font-display text-xl font-bold"><span className="grid h-8 w-8 place-items-center rounded-full bg-lime text-sm text-ink">{n}</span>{title}</h2>
      <div className="grid gap-5 sm:grid-cols-2">{children}</div>
    </section>
  );
}

export function EventForm({ eventId }: { eventId?: string }) {
  const router = useRouter();
  const [opts, setOpts] = useState<Opts | null>(null);
  const [f, setF] = useState<F>(EMPTY);
  const [status, setStatus] = useState<string>("DRAFT");
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [banner, setBanner] = useState<{ kind: "error" | "success"; msg: string; problems?: string[] } | null>(null);
  const [saving, setSaving] = useState<null | "draft" | "publish">(null);
  const set = <K extends keyof F>(k: K, v: F[K]) => setF((p) => ({ ...p, [k]: v }));

  useEffect(() => {
    let live = true;
    (async () => {
      try {
        const o = await api<Opts>("/api/v1/organizer/form-options");
        if (!live) return; setOpts(o);
        if (eventId) {
          const { event: ev } = await api<{ event: any }>(`/api/v1/organizer/events/${eventId}`);
          if (!live) return;
          setStatus(ev.status);
          setF({
            title: ev.title, description: ev.description, categoryId: ev.categoryId, cityId: ev.cityId, collegeId: ev.collegeId ?? "", tags: (ev.tags ?? []).join(", "), mode: ev.mode,
            startAt: toISTInput(ev.startAt), endAt: toISTInput(ev.endAt), registrationDeadline: toISTInput(ev.registrationDeadline),
            venueName: ev.venue?.name ?? "", venueAddress: ev.venue?.address ?? "", venueLocality: ev.venue?.locality ?? "", lat: ev.venue?.lat != null ? String(ev.venue.lat) : "", lng: ev.venue?.lng != null ? String(ev.venue.lng) : "",
            capacity: String(ev.capacity), feeRupees: String(ev.feePaise / 100), eligibility: ev.eligibility ?? "", teamsEnabled: ev.teamsEnabled, minTeamSize: String(ev.minTeamSize), maxTeamSize: String(ev.maxTeamSize),
            posterUrl: ev.posterUrl, gallery: ev.gallery ?? [], schedule: (ev.schedule ?? []).map((s: any) => ({ time: s.time, title: s.title, description: s.description ?? "" })),
          });
        } else {
          const city = o.cities.find((c) => c.slug === (process.env.NEXT_PUBLIC_DEFAULT_CITY || "jaipur")) ?? o.cities[0];
          setF((p) => ({ ...p, cityId: city?.id ?? "" }));
        }
      } catch (e) { if (live) setLoadErr((e as Error).message); }
      finally { if (live) setLoading(false); }
    })();
    return () => { live = false; };
  }, [eventId]);

  const colleges = useMemo(() => (opts?.colleges ?? []).filter((c) => !f.cityId || c.cityId === f.cityId), [opts, f.cityId]);
  const locked = status === "CANCELLED" || status === "COMPLETED";

  async function save(intent: "draft" | "publish") {
    setBanner(null);
    const v = validate(f); setErrors(v);
    if (Object.keys(v).length) { setBanner({ kind: "error", msg: "Please fix the highlighted fields." }); window.scrollTo({ top: 0, behavior: "smooth" }); return; }
    setSaving(intent);
    try {
      let id = eventId;
      if (eventId) await api(`/api/v1/organizer/events/${eventId}`, { method: "PATCH", json: payload(f) });
      else { const r = await api<{ event: { id: string } }>("/api/v1/organizer/events", { method: "POST", json: payload(f) }); id = r.event.id; }
      if (intent === "publish" && status !== "PUBLISHED") {
        try { await api(`/api/v1/organizer/events/${id}/publish`, { method: "POST" }); }
        catch (e: any) {
          setBanner({ kind: "error", msg: `Saved as draft, but it cannot be published yet: ${e.message}`, problems: e.details?.problems });
          if (!eventId) { router.replace(`/organizer/events/${id}/edit`); }
          setSaving(null); return;
        }
      }
      router.push(`/organizer/events/${id}`); router.refresh();
    } catch (e: any) {
      const fe = e.details?.fieldErrors as Record<string, string[]> | undefined;
      if (fe) setErrors(Object.fromEntries(Object.entries(fe).map(([k, v]) => [k, v[0]])));
      setBanner({ kind: "error", msg: e.message, problems: e.details?.problems });
      window.scrollTo({ top: 0, behavior: "smooth" });
      setSaving(null);
    }
  }

  if (loading) return <div className="container-x"><Spinner /></div>;
  if (loadErr) return <div className="container-x py-12"><ErrorState message={loadErr} retry={() => location.reload()} /></div>;
  const err = (k: string) => errors[k];

  return (
    <main className="container-x max-w-4xl py-10">
      <Link href={eventId ? `/organizer/events/${eventId}` : "/organizer"} className="mb-6 inline-flex items-center gap-2 text-sm text-white/60 hover:text-white"><ArrowLeft size={16} />Back</Link>
      <h1 className="section-title !text-4xl sm:!text-5xl">{eventId ? "Edit event" : "Create an event"}</h1>
      <p className="mt-3 text-white/60">{eventId ? "Changes to date, venue or deadline of a published event notify all registered attendees." : "Start with the essentials. You can save a draft and publish when you are ready."}</p>
      {locked && <div className="mt-4"><Alert kind="info">This event is {status.toLowerCase()} and can no longer be edited.</Alert></div>}
      {banner && <div className="mt-6"><Alert kind={banner.kind}>{banner.msg}{banner.problems && <ul className="mt-1 list-disc pl-5">{banner.problems.map((p) => <li key={p}>{p}</li>)}</ul>}</Alert></div>}

      <form className="mt-8 space-y-6" onSubmit={(e) => { e.preventDefault(); void save("draft"); }} noValidate>
        <fieldset disabled={locked || !!saving} className="space-y-6">
          <Section n={1} title="The basics">
            <Field label="Event title" error={err("title")} className="sm:col-span-2"><input className="input" value={f.title} maxLength={120} onChange={(e) => set("title", e.target.value)} placeholder="Jaipur Code Sprint 2026" /></Field>
            <Field label="Category" error={err("categoryId")}>
              <select className="input" value={f.categoryId} onChange={(e) => set("categoryId", e.target.value)}><option value="">Select a category</option>{opts?.categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
            </Field>
            <Field label="City" error={err("cityId")}>
              <select className="input" value={f.cityId} onChange={(e) => { set("cityId", e.target.value); set("collegeId", ""); }}><option value="">Select a city</option>{opts?.cities.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
            </Field>
            <Field label="College / university (optional)" hint="Shown as the hosting institution." className="sm:col-span-2">
              <select className="input" value={f.collegeId} onChange={(e) => set("collegeId", e.target.value)}><option value="">Independent organizer</option>{colleges.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
            </Field>
            <Field label="Description" error={err("description")} hint={`${f.description.trim().length}/5000`} className="sm:col-span-2"><textarea className="input min-h-36" maxLength={5000} value={f.description} onChange={(e) => set("description", e.target.value)} placeholder="What is this event about? Who is it for? What will attendees experience?" /></Field>
            <Field label="Tags" hint="Comma separated, up to 10" className="sm:col-span-2"><input className="input" value={f.tags} onChange={(e) => set("tags", e.target.value)} placeholder="ai, hackathon, 24-hours" /></Field>
          </Section>

          <Section n={2} title="When and where">
            <Field label="Format"><select className="input" value={f.mode} onChange={(e) => set("mode", e.target.value as F["mode"])}><option value="OFFLINE">In person</option><option value="ONLINE">Online</option><option value="HYBRID">Hybrid</option></select></Field>
            <div className="hidden sm:block" />
            <Field label="Starts (IST)" error={err("startAt")}><input type="datetime-local" className="input" value={f.startAt} onChange={(e) => set("startAt", e.target.value)} /></Field>
            <Field label="Ends (IST)" error={err("endAt")}><input type="datetime-local" className="input" value={f.endAt} onChange={(e) => set("endAt", e.target.value)} /></Field>
            <Field label="Registration deadline (optional)" error={err("registrationDeadline")} className="sm:col-span-2"><input type="datetime-local" className="input sm:max-w-xs" value={f.registrationDeadline} onChange={(e) => set("registrationDeadline", e.target.value)} /></Field>
            {f.mode !== "ONLINE" && (<>
              <Field label="Venue name" error={err("venueName")}><input className="input" value={f.venueName} onChange={(e) => set("venueName", e.target.value)} placeholder="Convention Hall A" /></Field>
              <Field label="Locality" ><input className="input" value={f.venueLocality} onChange={(e) => set("venueLocality", e.target.value)} placeholder="Malviya Nagar" /></Field>
              <Field label="Address" error={err("venueAddress")} className="sm:col-span-2"><input className="input" value={f.venueAddress} onChange={(e) => set("venueAddress", e.target.value)} placeholder="JLN Marg, Jaipur" /></Field>
              <Field label="Latitude (optional)" error={err("lat")}><input inputMode="decimal" className="input" value={f.lat} onChange={(e) => set("lat", e.target.value)} placeholder="26.8512" /></Field>
              <Field label="Longitude (optional)" error={err("lng")}><input inputMode="decimal" className="input" value={f.lng} onChange={(e) => set("lng", e.target.value)} placeholder="75.8100" /></Field>
            </>)}
          </Section>

          <Section n={3} title="Schedule">
            <div className="space-y-3 sm:col-span-2">
              {f.schedule.length === 0 && <p className="text-sm text-white/50">No schedule items yet. Add the agenda so attendees know what to expect.</p>}
              {f.schedule.map((s, i) => (
                <div key={i} className="rounded-2xl border border-white/10 bg-ink/40 p-3">
                  <div className="grid gap-3 sm:grid-cols-[9rem_1fr_auto]">
                    <input aria-label={`Schedule item ${i + 1} time`} className="input" placeholder="10:00 AM" value={s.time} onChange={(e) => set("schedule", f.schedule.map((x, j) => (j === i ? { ...x, time: e.target.value } : x)))} />
                    <input aria-label={`Schedule item ${i + 1} title`} className="input" placeholder="Opening keynote" value={s.title} onChange={(e) => set("schedule", f.schedule.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)))} />
                    <button type="button" aria-label={`Remove schedule item ${i + 1}`} className="btn-danger !px-3" onClick={() => set("schedule", f.schedule.filter((_, j) => j !== i))}><Trash2 size={15} /></button>
                  </div>
                  <input aria-label={`Schedule item ${i + 1} description`} className="input mt-3" placeholder="Details (optional)" value={s.description} onChange={(e) => set("schedule", f.schedule.map((x, j) => (j === i ? { ...x, description: e.target.value } : x)))} />
                  {err(`schedule.${i}`) && <p role="alert" className="mt-1 text-xs text-red-300">{err(`schedule.${i}`)}</p>}
                </div>
              ))}
              <button type="button" className="btn-ghost" disabled={f.schedule.length >= 30} onClick={() => set("schedule", [...f.schedule, { time: "", title: "", description: "" }])}><Plus size={15} />Add schedule item</button>
            </div>
          </Section>

          <Section n={4} title="Tickets and eligibility">
            <Field label="Capacity" error={err("capacity")} hint={eventId ? "Cannot go below the number of confirmed registrations." : undefined}><input inputMode="numeric" className="input" value={f.capacity} onChange={(e) => set("capacity", e.target.value)} /></Field>
            <Field label="Price per ticket (INR)" error={err("feeRupees")} hint="0 = free. Payments are a future integration; paid events are listed with a price only."><input inputMode="decimal" className="input" value={f.feeRupees} onChange={(e) => set("feeRupees", e.target.value)} /></Field>
            <Field label="Eligibility (optional)" className="sm:col-span-2"><input className="input" value={f.eligibility} onChange={(e) => set("eligibility", e.target.value)} placeholder="Open to all undergraduate students with a valid college ID" /></Field>
          </Section>

          <Section n={5} title="Team settings">
            <label className="flex items-center gap-3 sm:col-span-2"><input type="checkbox" className="h-5 w-5 accent-[#D6FF55]" checked={f.teamsEnabled} onChange={(e) => set("teamsEnabled", e.target.checked)} /><span className="text-sm">Enable team registration and the <b>Find My Team</b> board for this event</span></label>
            {f.teamsEnabled && (<>
              <Field label="Minimum team size"><input inputMode="numeric" className="input" value={f.minTeamSize} onChange={(e) => set("minTeamSize", e.target.value)} /></Field>
              <Field label="Maximum team size" error={err("maxTeamSize")}><input inputMode="numeric" className="input" value={f.maxTeamSize} onChange={(e) => set("maxTeamSize", e.target.value)} /></Field>
            </>)}
          </Section>

          <Section n={6} title="Poster and gallery">
            <ImageUpload label="Poster" folder="poster" shape="poster" value={f.posterUrl} onChange={(u) => set("posterUrl", u)} hint="Portrait 4:5 works best. A category image is used if you skip this." />
            <div>
              <p className="label">Gallery (up to 6)</p>
              <div className="grid grid-cols-3 gap-3">
                {f.gallery.map((g, i) => <ImageUpload key={g + i} folder="gallery" shape="square" value={g} onChange={(u) => set("gallery", u ? f.gallery.map((x, j) => (j === i ? u : x)) : f.gallery.filter((_, j) => j !== i))} />)}
                {f.gallery.length < 6 && <ImageUpload key={`new-${f.gallery.length}`} folder="gallery" shape="square" value={null} onChange={(u) => u && set("gallery", [...f.gallery, u])} />}
              </div>
            </div>
          </Section>
        </fieldset>

        <div className="sticky bottom-3 z-20 flex flex-wrap items-center justify-end gap-3 rounded-3xl border border-white/10 bg-ink/90 p-4 backdrop-blur-xl">
          <Link href={eventId ? `/organizer/events/${eventId}` : "/organizer"} className="btn-ghost">Cancel</Link>
          <button type="submit" disabled={locked || !!saving} className="btn-ghost"><Save size={16} />{saving === "draft" ? "Saving..." : eventId ? "Save changes" : "Save draft"}</button>
          {status !== "PUBLISHED" && !locked && <button type="button" disabled={!!saving} onClick={() => save("publish")} className="btn-lime"><Rocket size={16} />{saving === "publish" ? "Publishing..." : "Save & publish"}</button>}
        </div>
      </form>
    </main>
  );
}
