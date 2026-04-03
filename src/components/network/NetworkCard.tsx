"use client";

import { motion }       from "framer-motion";
import { NetworkConfig } from "@/config/networks";
import { cn }           from "@/lib/utils";

interface NetworkCardProps {
  config:   NetworkConfig;
  onSelect: () => void;
  delay?:   number;
}

export function NetworkCard({ config, onSelect, delay = 0 }: NetworkCardProps) {
  const isStudionet = config.id === "studionet";

  return (
    <motion.button
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y:  0 }}
      transition={{ duration: 0.4, delay, ease: "easeOut" }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      whileTap={{ scale: 0.98 }}
      onClick={onSelect}
      className={cn(
        "group relative w-full text-left rounded-2xl p-6",
        "border transition-all duration-300 cursor-pointer",
        "bg-turf shadow-card",
        isStudionet
          ? "border-line hover:border-ref/50 hover:shadow-ref"
          : "border-line hover:border-win/40 hover:shadow-[0_0_24px_rgba(34,197,94,0.12)]"
      )}
    >
      {/* Top accent line */}
      <div
        className={cn(
          "absolute top-0 inset-x-0 h-px rounded-t-2xl transition-opacity duration-300",
          "opacity-0 group-hover:opacity-100",
          isStudionet
            ? "bg-gradient-to-r from-transparent via-ref to-transparent"
            : "bg-gradient-to-r from-transparent via-win to-transparent"
        )}
      />

      {/* Network indicator dot */}
      <div className="flex items-center gap-2 mb-6">
        <span
          className={cn(
            "w-2 h-2 rounded-full",
            isStudionet
              ? "bg-ref shadow-[0_0_8px_rgba(245,197,24,0.6)]"
              : "bg-win shadow-[0_0_8px_rgba(34,197,94,0.6)]"
          )}
        />
        <span
          className={cn(
            "text-xs font-mono font-500 uppercase tracking-widest",
            isStudionet ? "text-ref" : "text-win"
          )}
        >
          {config.label}
        </span>
      </div>

      {/* Speed / tag */}
      <div className="mb-4">
        <span
          className={cn(
            "font-display text-4xl font-800 tracking-tight",
            isStudionet ? "text-chalk" : "text-chalk"
          )}
        >
          {config.speed}
        </span>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3 mt-6">
        <Stat
          label="Validators"
          value={isStudionet ? "15+" : "Growing"}
          accent={isStudionet}
        />
        <Stat
          label="Tx speed"
          value={isStudionet ? "~10s" : "~6 min"}
          accent={isStudionet}
        />
        <Stat
          label="Reads"
          value={isStudionet ? "Full" : "Limited"}
          accent={isStudionet}
        />
        <Stat
          label="Wallet"
          value={isStudionet ? "Not needed" : "Required"}
          accent={!isStudionet}
        />
      </div>

      {/* CTA arrow */}
      <div
        className={cn(
          "absolute bottom-5 right-5 text-lg transition-all duration-300",
          "translate-x-0 group-hover:translate-x-1",
          isStudionet ? "text-ref/40 group-hover:text-ref" : "text-win/40 group-hover:text-win"
        )}
      >
        →
      </div>
    </motion.button>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label:  string;
  value:  string;
  accent: boolean;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] text-mist uppercase tracking-wider font-mono">
        {label}
      </span>
      <span
        className={cn(
          "text-sm font-500",
          accent ? "text-chalk" : "text-mist"
        )}
      >
        {value}
      </span>
    </div>
  );
}
