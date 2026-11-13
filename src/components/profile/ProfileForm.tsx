"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/client";
import { SKILLS, INTERESTS } from "@/lib/constants";
import { Alert } from "@/components/ui/States";
import { ImageUpload } from "@/components/forms/ImageUpload";
import { cn } from "@/lib/utils";

type Me = {
  name: string; email: string; bio: string | null; avatarUrl: string | null; skills: string[] | null; interests: string[] | null; collegeId: string | null;
  homeCityId: string | null; year: string | null; linkedinUrl: string | null; discoverable: boolean; profileVisibility: "PUBLIC" | "CONNECTIONS" | "PRIVATE"; role: string;
};
type Meta = { cities?: { id: string; name: string }[]; colleges?: { id: string; name: string; cityId?: string }[] };
const YEARS = ["1st year", "2nd year", "3rd year", "4th year", "Postgraduate", "Alumni", "Not a student"];

export function ProfileForm({ initial }: { initial: Me }) {
  const [f, setF] = useState({
    name: initial.name, bio: initial.bio ?? "", avatarUrl: initial.avatarUrl ?? "", collegeId: initial.collegeId ?? "", homeCityId: initial.homeCityId ?? "",
    year: initial.year ?? "", linkedinUrl: initial.linkedinUrl ?? "", skills: initial.skills ?? [], interests: initial.interests ?? [],
    discoverable: initial.discoverable, profileVisibility: initial.profileVisibility,
  });
  const [meta, setMeta] = useState<Meta>({});
  const [busy, setBusy] = useState(false); const [msg, setMsg] = useState<{ kind: "success" | "error"; text: string } | null>(null);
  useEffect(() => { api<Meta>("/api/v1/meta").then(setMeta).catch(() => setMeta({})); }, []);
  const toggle = (k: "skills" | "interests", v: string) => setF((p) => ({ ...p, [k]: p[k].includes(v) ? p[k].filter((x) => x !== v) : [...p[k], v] }));

  async function save(e: React.FormEvent) {
    e.preventDefault(); setMsg(null);
    if (f.name.trim().length < 2) return setMsg({ kind: "error", text: "Name is too short" });
    if (f.linkedinUrl && !/^https?:\/\//.test(f.linkedinUrl)) return setMsg({ kind: "error", text: "LinkedIn URL must start with https://" });
    setBusy(true);
    try {
      await api("/api/v1/me", { method: "PATCH", json: {
        name: f.name.trim(), bio: f.bio || null, avatarUrl: f.avatarUrl || null, collegeId: f.collegeId || null, homeCityId: f.homeCityId || null,
        year: f.year || null, linkedinUrl: f.linkedinUrl, skills: f.skills, interests: f.interests, discoverable: f.discoverable, profileVisibility: f.profileVisibility,
      } });
      setMsg({ kind: "success", text: "Profile saved." });
    } catch (err: any) { setMsg({ kind: "error", text: err.message }); } finally { setBusy(false); }
  }
  const colleges = (meta.colleges ?? []).filter((c) => !f.homeCityId || !c.cityId || c.cityId === f.homeCityId);

  return (
    <form onSubmit={save} className="space-y-8" noValidate>
      {msg && <Alert kind={msg.kind}>{msg.text}</Alert>}
      <section className="card grid gap-6 p-6 md:grid-cols-[200px_1fr]">
        <div>
          <ImageUpload folder="avatar" shape="round" value={f.avatarUrl || null} onChange={(url) => setF((p) => ({ ...p, avatarUrl: url ?? "" }))} label="Profile picture" hint="JPG, PNG or WebP" />
        </div>
        <div className="space-y-4">
          <div><label className="label" htmlFor="p-name">Name</label><input id="p-name" className="input" value={f.name} maxLength={80} onChange={(e) => setF({ ...f, name: e.target.value })} /></div>
          <div><label className="label" htmlFor="p-email">Email (private)</label><input id="p-email" className="input opacity-60" value={initial.email} disabled /></div>
          <div><label className="label" htmlFor="p-bio">Bio</label><textarea id="p-bio" className="input min-h-24" maxLength={500} value={f.bio} onChange={(e) => setF({ ...f, bio: e.target.value })} placeholder="Tell people what you're into..." /><p className="mt-1 text-right text-xs text-white/40">{f.bio.length}/500</p></div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div><label className="label" htmlFor="p-city">City</label><select id="p-city" className="input" value={f.homeCityId} onChange={(e) => setF({ ...f, homeCityId: e.target.value, collegeId: "" })}><option value="">Select city</option>{(meta.cities ?? []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
            <div><label className="label" htmlFor="p-col">College / university</label><select id="p-col" className="input" value={f.collegeId} onChange={(e) => setF({ ...f, collegeId: e.target.value })}><option value="">Select college</option>{colleges.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
            <div><label className="label" htmlFor="p-year">Year</label><select id="p-year" className="input" value={f.year} onChange={(e) => setF({ ...f, year: e.target.value })}><option value="">Select</option>{YEARS.map((y) => <option key={y}>{y}</option>)}</select></div>
            <div><label className="label" htmlFor="p-li">LinkedIn</label><input id="p-li" className="input" placeholder="https://linkedin.com/in/you" value={f.linkedinUrl} onChange={(e) => setF({ ...f, linkedinUrl: e.target.value })} /></div>
          </div>
        </div>
      </section>

      <section className="card space-y-6 p-6">
        <Chips title="Skills" hint="Used for team matching and discovery." options={SKILLS} value={f.skills} onToggle={(v) => toggle("skills", v)} />
        <Chips title="Interests" hint="Used to suggest communities and people." options={INTERESTS} value={f.interests} onToggle={(v) => toggle("interests", v)} />
      </section>

      <section className="card space-y-5 p-6" aria-labelledby="privacy-h">
        <h2 id="privacy-h" className="font-display text-2xl font-bold">Privacy</h2>
        <label className="flex cursor-pointer items-start gap-3">
          <input type="checkbox" role="switch" className="mt-1 h-5 w-5 accent-lime" checked={f.discoverable} onChange={(e) => setF({ ...f, discoverable: e.target.checked })} />
          <span><span className="block font-semibold">Let attendees of my events discover me</span><span className="text-sm text-white/55">Others who attend the same events can see your name, college, skills and bio and send you a connection request. Your email and contact details are never shown.</span></span>
        </label>
        <div>
          <label className="label" htmlFor="p-vis">Who can see my full profile</label>
          <select id="p-vis" className="input max-w-sm" value={f.profileVisibility} onChange={(e) => setF({ ...f, profileVisibility: e.target.value as any })}>
            <option value="PUBLIC">Everyone</option><option value="CONNECTIONS">Only my connections</option><option value="PRIVATE">Only me</option>
          </select>
        </div>
      </section>
      <div className="flex items-center gap-3"><button className="btn-primary !px-8 !py-3" disabled={busy}>{busy ? "Saving..." : "Save changes"}</button>{msg && <span className="text-sm text-white/60" aria-live="polite">{msg.text}</span>}</div>
    </form>
  );
}
function Chips({ title, hint, options, value, onToggle }: { title: string; hint: string; options: readonly string[]; value: string[]; onToggle: (v: string) => void }) {
  return (
    <fieldset>
      <legend className="font-display text-xl font-bold">{title}</legend><p className="mb-3 text-sm text-white/55">{hint}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => { const on = value.includes(o); return (
          <button key={o} type="button" aria-pressed={on} onClick={() => onToggle(o)} className={cn("rounded-full border px-4 py-1.5 text-sm font-medium transition", on ? "border-lime bg-lime text-ink" : "border-white/15 bg-white/5 text-white/80 hover:bg-white/10")}>{o}</button>
        ); })}
      </div>
    </fieldset>
  );
}
