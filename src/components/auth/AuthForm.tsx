"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Eye, EyeOff, GraduationCap, Users, Megaphone } from "lucide-react";
import { api } from "@/lib/client";
import { Alert } from "@/components/ui/States";
import { safeNext } from "@/lib/safe-next";
import { cn } from "@/lib/utils";

type Meta = { cities?: { id: string; name: string; slug: string }[]; colleges?: { id: string; name: string; cityId?: string }[] };
const ROLES = [
  { v: "STUDENT", label: "Student", icon: GraduationCap, hint: "Find events, teams & friends" },
  { v: "GENERAL", label: "General", icon: Users, hint: "Attend events in your city" },
  { v: "ORGANIZER", label: "Organizer", icon: Megaphone, hint: "Host & manage events" },
] as const;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function AuthForm({ mode, next }: { mode: "login" | "signup"; next: string }) {
  const router = useRouter();
  const target = safeNext(next);
  const [f, setF] = useState({ name: "", email: "", password: "", role: "STUDENT" as string, cityId: "", collegeId: "" });
  const [meta, setMeta] = useState<Meta>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formErr, setFormErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false); const [show, setShow] = useState(false);
  const signup = mode === "signup";

  useEffect(() => {
    if (!signup) return;
    api<Meta>("/api/v1/meta").then(setMeta).catch(() => setMeta({})); // endpoint is optional: selects simply stay hidden
  }, [signup]);

  const set = (k: string, v: string) => { setF((p) => ({ ...p, [k]: v })); setErrors((p) => ({ ...p, [k]: "" })); };
  function validate() {
    const e: Record<string, string> = {};
    if (signup && f.name.trim().length < 2) e.name = "Name is too short";
    if (!EMAIL_RE.test(f.email.trim())) e.email = "Enter a valid email";
    if (signup ? f.password.length < 8 : !f.password) e.password = signup ? "Password must be at least 8 characters" : "Enter your password";
    setErrors(e); return Object.keys(e).length === 0;
  }
  async function submit(ev: React.FormEvent) {
    ev.preventDefault(); setFormErr(null);
    if (!validate()) return;
    setBusy(true);
    try {
      if (signup) await api("/api/v1/auth/register", { method: "POST", json: { name: f.name.trim(), email: f.email.trim(), password: f.password, role: f.role, cityId: f.cityId || undefined, collegeId: f.collegeId || undefined } });
      else await api("/api/v1/auth/login", { method: "POST", json: { email: f.email.trim(), password: f.password } });
      router.push(signup && f.role === "ORGANIZER" && target === "/" ? "/organizer" : target);
      router.refresh();
    } catch (e: any) { setFormErr(e.message); setBusy(false); }
  }
  const colleges = (meta.colleges ?? []).filter((c) => !f.cityId || !c.cityId || c.cityId === f.cityId);
  const q = next && next !== "/" ? `?next=${encodeURIComponent(target)}` : "";

  return (
    <form onSubmit={submit} noValidate className="w-full max-w-md space-y-5" aria-labelledby="auth-title">
      <div>
        <h1 id="auth-title" className="font-display text-4xl font-bold">{signup ? "Join the sphere" : "Welcome back"}</h1>
        <p className="mt-2 text-sm text-white/60">{signup ? "Create your account to register for events, meet people and find your team." : "Log in to see your events, connections and messages."}</p>
      </div>
      {formErr && <Alert>{formErr}</Alert>}
      {signup && (
        <fieldset>
          <legend className="label">I am a</legend>
          <div className="grid grid-cols-3 gap-2">
            {ROLES.map((r) => (
              <label key={r.v} className={cn("cursor-pointer rounded-2xl border p-3 text-center transition has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-lime", f.role === r.v ? "border-lime bg-lime/10" : "border-white/10 hover:bg-white/5")}>
                <input type="radio" name="role" value={r.v} checked={f.role === r.v} onChange={() => set("role", r.v)} className="sr-only" />
                <r.icon size={20} className="mx-auto mb-1" aria-hidden /><span className="block text-sm font-semibold">{r.label}</span><span className="mt-0.5 block text-[10px] leading-tight text-white/50">{r.hint}</span>
              </label>
            ))}
          </div>
        </fieldset>
      )}
      {signup && <Field id="name" label="Full name" error={errors.name}><input id="name" className="input" autoComplete="name" value={f.name} onChange={(e) => set("name", e.target.value)} aria-invalid={!!errors.name} /></Field>}
      <Field id="email" label="Email" error={errors.email}><input id="email" type="email" className="input" autoComplete="email" value={f.email} onChange={(e) => set("email", e.target.value)} aria-invalid={!!errors.email} /></Field>
      <Field id="password" label="Password" error={errors.password}>
        <div className="relative">
          <input id="password" type={show ? "text" : "password"} className="input pr-12" autoComplete={signup ? "new-password" : "current-password"} value={f.password} onChange={(e) => set("password", e.target.value)} aria-invalid={!!errors.password} />
          <button type="button" onClick={() => setShow(!show)} aria-label={show ? "Hide password" : "Show password"} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white">{show ? <EyeOff size={18} /> : <Eye size={18} />}</button>
        </div>
      </Field>
      {signup && meta.cities && meta.cities.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="city" label="City"><select id="city" className="input" value={f.cityId} onChange={(e) => { set("cityId", e.target.value); set("collegeId", ""); }}><option value="">Select city</option>{meta.cities.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></Field>
          <Field id="college" label="College"><select id="college" className="input" value={f.collegeId} onChange={(e) => set("collegeId", e.target.value)}><option value="">Select college</option>{colleges.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></Field>
        </div>
      )}
      <button className="btn-primary w-full !py-3" disabled={busy}>{busy ? "Please wait..." : signup ? "Create account" : "Log in"}</button>
      <p className="text-center text-sm text-white/60">
        {signup ? <>Already have an account? <Link className="font-semibold text-lime hover:underline" href={`/login${q}`}>Log in</Link></> : <>New here? <Link className="font-semibold text-lime hover:underline" href={`/signup${q}`}>Create an account</Link></>}
      </p>
      {!signup && <p className="rounded-xl border border-white/10 bg-white/5 p-3 text-xs text-white/50">Demo (seeded data only): student@eventsphere.dev / Password123!</p>}
    </form>
  );
}
function Field({ id, label, error, children }: { id: string; label: string; error?: string; children: React.ReactNode }) {
  return <div><label htmlFor={id} className="label">{label}</label>{children}{error && <p role="alert" className="mt-1 text-xs text-red-300">{error}</p>}</div>;
}
