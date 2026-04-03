import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Core palette
        pitch:   "#080810",   // deepest background
        turf:    "#0d0d1a",   // card background
        line:    "#161628",   // border / divider
        chalk:   "#e8e8f0",   // primary text
        mist:    "#7070a0",   // secondary text
        // Accent — referee yellow
        ref:     "#F5C518",   // primary accent
        "ref-dim": "#c49a10", // hover state
        // Status
        win:     "#22c55e",
        loss:    "#ef4444",
        draw:    "#a78bfa",
        // Validator
        agree:   "#22c55e",
        timeout: "#f59e0b",
        disagree:"#ef4444",
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        body:    ["var(--font-body)", "sans-serif"],
        mono:    ["var(--font-mono)", "monospace"],
      },
      backgroundImage: {
        "pitch-grid": "linear-gradient(rgba(245,197,24,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(245,197,24,0.03) 1px, transparent 1px)",
        "ref-glow":   "radial-gradient(ellipse at 50% 0%, rgba(245,197,24,0.12) 0%, transparent 70%)",
      },
      backgroundSize: {
        "grid-sm": "32px 32px",
      },
      animation: {
        "fade-up":    "fadeUp 0.5s ease forwards",
        "fade-in":    "fadeIn 0.4s ease forwards",
        "pulse-ref":  "pulseRef 2s ease-in-out infinite",
        "spin-slow":  "spin 8s linear infinite",
        "slide-in":   "slideIn 0.3s ease forwards",
      },
      keyframes: {
        fadeUp: {
          "0%":   { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          "0%":   { opacity: "0" },
          "100%": { opacity: "1" },
        },
        pulseRef: {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(245,197,24,0.4)" },
          "50%":      { boxShadow: "0 0 0 8px rgba(245,197,24,0)" },
        },
        slideIn: {
          "0%":   { opacity: "0", transform: "translateX(-8px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
      },
      boxShadow: {
        "ref":     "0 0 24px rgba(245,197,24,0.15)",
        "ref-lg":  "0 0 48px rgba(245,197,24,0.12)",
        "card":    "0 1px 0 rgba(255,255,255,0.04), 0 4px 24px rgba(0,0,0,0.4)",
      },
      borderRadius: {
        "xl2": "1rem",
        "xl3": "1.25rem",
      },
    },
  },
  plugins: [],
};

export default config;
