"use client";
import { useState } from "react";
import { Send } from "lucide-react";
import { api } from "@/lib/client";
import { Alert } from "@/components/ui/States";

export function ContactForm() {
  const [state, setState] = useState<{ kind: "idle" | "sending" | "done" | "error"; msg?: string }>({ kind: "idle" });
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = e.currentTarget; const d = Object.fromEntries(new FormData(f));
    setState({ kind: "sending" });
    try { await api("/api/v1/contact", { method: "POST", json: d }); f.reset(); setState({ kind: "done" }); }
    catch (err) { setState({ kind: "error", msg: (err as Error).message }); }
  }
  return (
    <form onSubmit={submit} className="card space-y-4 p-6 sm:p-8" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <div><label className="label" htmlFor="c-name">Name</label><input id="c-name" name="name" required minLength={2} className="input" autoComplete="name" /></div>
        <div><label className="label" htmlFor="c-email">Email</label><input id="c-email" name="email" type="email" required className="input" autoComplete="email" /></div>
      </div>
      <div><label className="label" htmlFor="c-topic">Topic</label>
        <select id="c-topic" name="topic" className="input" defaultValue="general"><option value="general">General question</option><option value="organizer">Hosting an event</option><option value="bug">Report a problem</option><option value="partnership">Partnership</option></select></div>
      <div><label className="label" htmlFor="c-msg">Message</label><textarea id="c-msg" name="message" required minLength={10} rows={5} className="input" /></div>
      <input name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
      {state.kind === "done" && <Alert kind="success">Thanks! Your message was received by the demo inbox. This is a college project, so nobody is actually emailed.</Alert>}
      {state.kind === "error" && <Alert>{state.msg}</Alert>}
      <button className="btn-primary" disabled={state.kind === "sending"}><Send size={16} /> {state.kind === "sending" ? "Sending…" : "Send message"}</button>
    </form>
  );
}
