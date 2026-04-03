"use client";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
export default function NotFound() {
  return (
    <div className="min-h-screen bg-pitch flex flex-col items-center justify-center px-4 text-center gap-6">
      <div className="font-display text-8xl font-800 text-line select-none">404</div>
      <div>
        <h1 className="font-display text-2xl font-700 text-chalk mb-2">Page not found</h1>
        <p className="text-mist text-sm">This page doesn&apos;t exist or has been moved.</p>
      </div>
      <Link href="/"><Button>Back to TheRef</Button></Link>
    </div>
  );
}
