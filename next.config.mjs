/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Lets an isolated e2e server (NEXT_DIST_DIR=.next-e2e) run next to `next dev` without sharing a build dir.
  distDir: process.env.NEXT_DIST_DIR || ".next",
  output: process.env.NEXT_OUTPUT === "standalone" ? "standalone" : undefined,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "*.public.blob.vercel-storage.com" },
    ],
  },
  experimental: { serverComponentsExternalPackages: ["pg", "bcryptjs"] },
};
export default nextConfig;
