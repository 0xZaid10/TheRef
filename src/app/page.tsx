"use client";

import { useEffect, useState } from "react";
import { useRouter }           from "next/navigation";
import { motion }              from "framer-motion";
import { useNetwork }          from "@/context/NetworkContext";
import { NETWORKS, NetworkId } from "@/config/networks";

const MODELS = [
  { name: "GPT-5.4",     org: "OpenAI",    color: "#4ade80" },
  { name: "Claude 4.6",  org: "Anthropic", color: "#F5C518" },
  { name: "Gemini 3",    org: "Google",    color: "#60a5fa" },
  { name: "DeepSeek V3", org: "DeepSeek",  color: "#c084fc" },
  { name: "Llama 4",     org: "Meta",      color: "#fb923c" },
];

export default function NetworkSelectionPage() {
  const { network, setNetwork, isReady } = useNetwork();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (isReady && network) router.replace("/home");
  }, [isReady, network, router]);

  // Show loader until mounted + ready
  if (!mounted || !isReady) {
    return (
      <div style={{ minHeight: "100vh", background: "#080810", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: 20, height: 20, borderRadius: "50%", border: "2px solid #F5C518", borderTopColor: "transparent", animation: "spin 0.8s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // Already has a network - redirect handled by useEffect, show nothing
  if (network) return null;

  return (
    <div style={{
      minHeight: "100vh", background: "#080810", color: "#e8e8f0",
      display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", padding: "48px 24px", position: "relative",
      overflow: "hidden", fontFamily: "'DM Sans', sans-serif",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@800&family=DM+Sans:wght@400;500&family=DM+Mono:wght@400;500&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes ticker { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        .net-card { transition: transform 0.2s, border-color 0.2s, box-shadow 0.2s; }
        .net-card:hover { transform: translateY(-5px); }
        .net-card-s:hover { border-color: rgba(245,197,24,0.5) !important; box-shadow: 0 0 32px rgba(245,197,24,0.1) !important; }
        .net-card-b:hover { border-color: rgba(34,197,94,0.45) !important; box-shadow: 0 0 32px rgba(34,197,94,0.09) !important; }
        .shimmer { opacity: 0; transition: opacity 0.25s; }
        .net-card:hover .shimmer { opacity: 1; }
        .arrow { transition: transform 0.2s; }
        .net-card:hover .arrow { transform: translateX(4px); }
      `}</style>

      {/* Grid background */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        backgroundImage: "linear-gradient(rgba(245,197,24,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(245,197,24,0.04) 1px,transparent 1px)",
        backgroundSize: "44px 44px",
      }} />

      {/* Top glow */}
      <div style={{
        position: "absolute", top: "-10%", left: "50%", transform: "translateX(-50%)",
        width: 800, height: 500, borderRadius: "50%", pointerEvents: "none",
        background: "radial-gradient(ellipse,rgba(245,197,24,0.09) 0%,transparent 65%)",
      }} />

      {/* Bottom fade */}
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0, height: 160, pointerEvents: "none",
        background: "linear-gradient(transparent,#080810)",
      }} />

      <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", alignItems: "center", width: "100%", maxWidth: 520 }}>

        {/* Headline */}
        <motion.div
          initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: "easeOut" }}
          style={{ textAlign: "center", marginBottom: 20 }}
        >
          <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: "clamp(76px,14vw,112px)", letterSpacing: "-0.05em", lineHeight: 0.88, color: "#e8e8f0" }}>
            The
          </div>
          <div style={{ position: "relative", display: "inline-block" }}>
            <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: "clamp(76px,14vw,112px)", letterSpacing: "-0.05em", lineHeight: 0.88, color: "#F5C518" }}>
              Ref
            </div>
            <div style={{ position: "absolute", bottom: -6, left: 0, right: 0, height: 3, borderRadius: 2, background: "linear-gradient(90deg,transparent,#F5C518,transparent)" }} />
          </div>
        </motion.div>

        {/* Tagline */}
        <motion.p
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2, duration: 0.5 }}
          style={{ textAlign: "center", color: "#7070a0", fontSize: 15, lineHeight: 1.65, maxWidth: 360, marginBottom: 36 }}
        >
          <span style={{ color: "rgba(232,232,240,0.75)", fontWeight: 500 }}>5 independent AI models</span>{" "}
          reach consensus to judge any game. Verifiable, incorruptible, on-chain forever.
        </motion.p>

        {/* Model ticker */}
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
          style={{
            width: "100%", overflow: "hidden", marginBottom: 36,
            WebkitMaskImage: "linear-gradient(90deg,transparent,black 15%,black 85%,transparent)",
            maskImage: "linear-gradient(90deg,transparent,black 15%,black 85%,transparent)",
          }}
        >
          <div style={{ display: "flex", gap: 28, animation: "ticker 14s linear infinite", whiteSpace: "nowrap" }}>
            {[...MODELS, ...MODELS].map((m, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 7, flexShrink: 0 }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: m.color, display: "inline-block", animation: "pulse 2s infinite", animationDelay: `${i * 0.15}s` }} />
                <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 12, fontWeight: 500, color: m.color }}>{m.name}</span>
                <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 12, color: "#7070a0" }}>{m.org}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Divider */}
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }}
          style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18, width: "100%" }}
        >
          <div style={{ flex: 1, height: 1, background: "#161628" }} />
          <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: "#7070a0", textTransform: "uppercase", letterSpacing: "0.1em", whiteSpace: "nowrap" }}>
            Choose a network
          </span>
          <div style={{ flex: 1, height: 1, background: "#161628" }} />
        </motion.div>

        {/* Network cards */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.45 }}
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, width: "100%" }}
        >
          {(["studionet", "bradbury"] as NetworkId[]).map((id) => {
            const isS    = id === "studionet";
            const accent = isS ? "#F5C518" : "#22c55e";
            const cfg    = NETWORKS[id];
            const stats  = [
              { label: "Tx Speed",   value: isS ? "~10s"       : "~6 min",   hi: isS },
              { label: "Validators", value: isS ? "15+"        : "Growing",  hi: !isS },
              { label: "Wallet",     value: isS ? "Not needed" : "Required", hi: !isS },
              { label: "Reads",      value: isS ? "Full"       : "Limited",  hi: isS },
            ];
            return (
              <button
                key={id}
                className={`net-card net-card-${isS ? "s" : "b"}`}
                onClick={() => { setNetwork(id); router.push("/home"); }}
                style={{
                  background: "#0d0d1a", border: "1px solid #161628", borderRadius: 18,
                  padding: "20px 18px", cursor: "pointer", textAlign: "left", position: "relative", overflow: "hidden",
                }}
              >
                {/* Top shimmer */}
                <div className="shimmer" style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: `linear-gradient(90deg,transparent,${accent},transparent)` }} />

                {/* Dot + label */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                    <span style={{ width: 7, height: 7, borderRadius: "50%", background: accent, display: "inline-block", boxShadow: `0 0 8px ${accent}`, animation: "pulse 2s infinite" }} />
                    <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: accent, textTransform: "uppercase", letterSpacing: "0.09em" }}>
                      {cfg.label}
                    </span>
                  </div>
                  <span className="arrow" style={{ color: `${accent}55`, fontSize: 15 }}>→</span>
                </div>

                {/* Speed */}
                <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 24, letterSpacing: "-0.03em", lineHeight: 1.1, color: "#e8e8f0", marginBottom: 6 }}>
                  {cfg.speed}
                </div>
                <div style={{ fontSize: 12, color: "#7070a0", lineHeight: 1.5, marginBottom: 18 }}>
                  {cfg.description}
                </div>

                {/* Stats */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, borderTop: "1px solid #161628", paddingTop: 14 }}>
                  {stats.map(s => (
                    <div key={s.label}>
                      <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: "#7070a0", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 3 }}>{s.label}</div>
                      <div style={{ fontSize: 13, fontWeight: 500, color: s.hi ? accent : "#7070a0" }}>{s.value}</div>
                    </div>
                  ))}
                </div>
              </button>
            );
          })}
        </motion.div>

        {/* Footer */}
        <motion.p
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
          style={{ marginTop: 28, fontSize: 11, color: "#7070a0", fontFamily: "'DM Mono',monospace", textAlign: "center" }}
        >
          Built on{" "}
          <a href="https://genlayer.com" target="_blank" rel="noopener noreferrer" style={{ color: "#F5C518", textDecoration: "none" }}>
            GenLayer
          </a>
          {" "}. 5 AIs. One verdict. On-chain forever.
        </motion.p>
      </div>
    </div>
  );
}
