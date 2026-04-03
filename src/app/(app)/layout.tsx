"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useNetwork } from "@/context/NetworkContext";
import { Header } from "@/components/layout/Header";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { network, isReady } = useNetwork();
  const router = useRouter();
  useEffect(() => { if (isReady && !network) router.replace("/"); }, [isReady, network, router]);
  if (!isReady) return (
    <div className="min-h-screen bg-pitch flex items-center justify-center">
      <div className="w-5 h-5 rounded-full border-2 border-ref border-t-transparent animate-spin" />
    </div>
  );
  if (!network) return null;
  return (
    <div className="min-h-screen bg-pitch flex flex-col">
      <Header />
      <main className="flex-1 pt-16">{children}</main>
    </div>
  );
}
