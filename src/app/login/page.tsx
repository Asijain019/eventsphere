import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { AuthShell } from "@/components/auth/AuthShell";
import { AuthForm } from "@/components/auth/AuthForm";
import { safeNext } from "@/lib/safe-next";

export const dynamic = "force-dynamic";
export const metadata = { title: "Log in" };

export default async function LoginPage({ searchParams }: { searchParams: { next?: string } }) {
  const next = safeNext(searchParams.next);
  let user = null; try { user = await getCurrentUser(); } catch { /* DB down: show form */ }
  if (user) redirect(next);
  return <AuthShell quote="Your city's best nights are waiting."><AuthForm mode="login" next={next} /></AuthShell>;
}
