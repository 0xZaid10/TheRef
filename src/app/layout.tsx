import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "TheRef - On-Chain AI Game Referee",
  description: "5 independent AI models reach consensus to judge any game.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-pitch text-chalk antialiased">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
