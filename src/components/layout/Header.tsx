"use client";

import Link            from "next/link";
import { usePathname } from "next/navigation";
import { ConnectKitButton } from "connectkit";
import { useNetwork }       from "@/context/NetworkContext";
import { NetworkBadge }     from "./NetworkBadge";
import { cn }               from "@/lib/utils";

const NAV_LINKS = [
  { href: "/home",        label: "Home" },
  { href: "/play",        label: "Play" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/tournaments", label: "Tournaments" },
  { href: "/explorer",    label: "Explorer" },
  { href: "/docs",         label: "Docs" },
];

export function Header() {
  const pathname    = usePathname();
  const { network } = useNetwork();

  return (
    <header className="fixed top-0 inset-x-0 z-50 h-16 glass border-b border-line">
      <div className="w-full px-6 h-full flex items-center gap-6">

        {/* Brand - far left, bigger */}
        <Link href="/home" className="group shrink-0 mr-2">
          <span className="font-display font-800 text-2xl tracking-tight transition-colors duration-200 group-hover:text-ref">
            The<span className="text-ref">Ref</span>
          </span>
        </Link>

        {/* Nav - centre */}
        <nav className="hidden md:flex items-center gap-0.5 flex-1">
          {NAV_LINKS.map((link) => {
            const active = pathname === link.href || pathname.startsWith(link.href + "/");
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-sm font-500 transition-all duration-200",
                  active ? "text-ref bg-ref/10" : "text-mist hover:text-chalk hover:bg-line"
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Right - far right */}
        <div className="flex items-center gap-3 shrink-0 ml-auto">
          <NetworkBadge onSwitch={() => window.open("/", "_blank")} />
          {network?.walletEnabled ? (
            <ConnectKitButton />
          ) : (
            <button
              disabled
              title="No wallet needed on Studionet"
              className="px-3 py-1.5 rounded-lg text-xs font-500 font-mono text-mist border border-line cursor-not-allowed opacity-40 select-none"
            >
              Connect Wallet
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
