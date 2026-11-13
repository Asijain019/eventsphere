import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { AuthShell } from "@/components/auth/AuthShell";
import { AuthForm } from "@/components/auth/AuthForm";
import { safeNext } from "@/lib/safe-next";

export const dynamic = "force-dynamic";
export const metadata = { title: "Sign up" };

export default async function SignupPage({ searchParams }: { searchParams: { next?: string } }) {
  const next = safeNext(searchParams.next);
  let user = null; try { user = await getCurrentUser(); } catch { /* DB down: show form */ }
  if (user) redirect(next);
  return <AuthShell quote="Find your people. Find your next big thing."><AuthForm mode="signup" next={next} /></AuthShell>;
}
