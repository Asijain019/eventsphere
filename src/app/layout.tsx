/* eslint-disable @next/next/no-page-custom-font */
import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { getCurrentUser } from "@/lib/session";
import { unreadCount } from "@/modules/notifications/service";

export const metadata: Metadata = {
  title: { default: "EventSphere — Discover. Experience. Connect.", template: "%s · EventSphere" },
  description: "Inter-college and city-wide event discovery, participation and networking. Starting in Jaipur.",
};
export const dynamic = "force-dynamic";

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  let user = null as Awaited<ReturnType<typeof getCurrentUser>>; let unread = 0;
  try { user = await getCurrentUser(); if (user) unread = await unreadCount(user.id); } catch { /* DB unavailable: render logged-out shell */ }
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Fraunces:ital,wght@0,600;1,600&family=Space+Grotesk:wght@500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body>
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-lime focus:px-4 focus:py-2 focus:text-ink">Skip to content</a>
        <Navbar user={user ? { id: user.id, name: user.name, role: user.role } : null} unread={unread} />
        <main id="main">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
