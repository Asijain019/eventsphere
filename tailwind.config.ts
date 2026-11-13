import type { Config } from "tailwindcss";
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#101014", ink2: "#1A1A22", ink3: "#24242E",
        violet: { DEFAULT: "#8B35FF", 400: "#A566FF", 600: "#6F1FE0" },
        magenta: "#E83EAB", lime: "#D6FF55", paper: "#F8F7F2",
        orange: { DEFAULT: "#FF7A1A" }, sky: { DEFAULT: "#2F8CFF" },
      },
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        sans: ["var(--font-body)", "system-ui", "sans-serif"],
        serif: ["var(--font-serif)", "Georgia", "serif"],
      },
      boxShadow: {
        glow: "0 0 60px -10px rgba(139,53,255,.55)",
        card: "0 20px 50px -20px rgba(0,0,0,.6)",
        pop: "6px 6px 0 0 #D6FF55",
      },
      backgroundImage: {
        "brand-gradient": "linear-gradient(135deg,#8B35FF 0%,#E83EAB 100%)",
        "grain": "radial-gradient(rgba(255,255,255,.06) 1px, transparent 1px)",
      },
      keyframes: {
        float: { "0%,100%": { transform: "translateY(0) rotate(var(--r,0deg))" }, "50%": { transform: "translateY(-14px) rotate(var(--r,0deg))" } },
        marquee: { from: { transform: "translateX(0)" }, to: { transform: "translateX(-50%)" } },
        shimmer: { from: { backgroundPosition: "200% 0" }, to: { backgroundPosition: "-200% 0" } },
      },
      animation: { float: "float 6s ease-in-out infinite", marquee: "marquee 30s linear infinite", shimmer: "shimmer 2s linear infinite" },
    },
  },
  plugins: [],
};
export default config;
