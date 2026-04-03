"use client";

import { useNetwork } from "@/context/NetworkContext";
import { useRouter }  from "next/navigation";
import { cn }         from "@/lib/utils";

interface NetworkBadgeProps {
  onSwitch?: () => void;
}

export function NetworkBadge({ onSwitch }: NetworkBadgeProps) {
  const { network, clearNetwork } = useNetwork();
  const router = useRouter();

  if (!network) return null;

  const isStudionet = network.id === "studionet";

  function handleSwitch() {
    clearNetwork();           // wipes localStorage + resets context
    router.push("/");         // navigate to selection page in same tab
    if (onSwitch) onSwitch();
  }

  return (
    <div className="flex items-center gap-2">
      <div className={cn(
        "flex items-center gap-1.5 px-2.5 py-1 rounded-lg",
        "border text-xs font-mono font-500",
        isStudionet
          ? "border-ref/30 bg-ref/8 text-ref"
          : "border-win/30 bg-win/8 text-win"
      )}>
        <span className={cn(
          "w-1.5 h-1.5 rounded-full",
          isStudionet ? "bg-ref animate-pulse" : "bg-win animate-pulse"
        )} />
        {network.label}
      </div>

      <button
        onClick={handleSwitch}
        className="text-xs text-mist hover:text-chalk transition-colors duration-200 underline underline-offset-2"
        title="Switch network"
      >
        switch
      </button>
    </div>
  );
}
