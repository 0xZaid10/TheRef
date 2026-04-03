"use client";

import { useState, useEffect } from "react";
import { NetworkProvider } from "@/context/NetworkContext";
import { WalletProvider } from "@/context/WalletContext";

export function Providers({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div style={{
        minHeight: "100vh",
        background: "#080810",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}>
        <div style={{
          width: 20,
          height: 20,
          borderRadius: "50%",
          border: "2px solid #F5C518",
          borderTopColor: "transparent",
          animation: "spin 0.8s linear infinite",
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <WalletProvider>
      <NetworkProvider>
        {children}
      </NetworkProvider>
    </WalletProvider>
  );
}
