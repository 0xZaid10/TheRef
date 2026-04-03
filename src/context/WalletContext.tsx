"use client";

import React, { useState } from "react";
import { WagmiProvider, createConfig, http } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConnectKitProvider, getDefaultConfig } from "connectkit";
import { defineChain } from "viem";
import type { Config } from "wagmi";

export const bradbury = defineChain({
  id: 4221,
  name: "GenLayer Bradbury",
  nativeCurrency: { name: "GEN", symbol: "GEN", decimals: 18 },
  rpcUrls: {
    default: {
      http: [process.env.NEXT_PUBLIC_BRADBURY_RPC ?? "https://rpc-bradbury.genlayer.com"],
    },
  },
  blockExplorers: {
    default: {
      name: "Bradbury Explorer",
      url: process.env.NEXT_PUBLIC_BRADBURY_EXPLORER ?? "https://explorer-bradbury.genlayer.com",
    },
  },
  testnet: true,
});

let wagmiConfig: Config | null = null;
let qClient: QueryClient | null = null; 

function getWagmiConfig() {
  if (!wagmiConfig) {
    wagmiConfig = createConfig(
      getDefaultConfig({
        chains: [bradbury],
        transports: {
          [bradbury.id]: http(
            process.env.NEXT_PUBLIC_BRADBURY_RPC ?? "https://rpc-bradbury.genlayer.com"
          ),
        },
        walletConnectProjectId:
          process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ?? "",
        appName: "TheRef",
        appDescription: "On-chain AI consensus game referee",
        appUrl: "https://theref.app",
        appIcon: "https://theref.app/icon.png",
      })
    );
  }
  return wagmiConfig;
}

function getQueryClient() {
  if (!qClient) {
    qClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          staleTime: 30000,
        },
      },
    });
  }
  return qClient;
}

export function WalletProvider({ children }) {
  const [config] = useState(() => getWagmiConfig());
  const [queryClient] = useState(() => getQueryClient());

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <ConnectKitProvider
          theme="midnight"
          options={{
            disableENS: true,
          }}
          customTheme={{
            "--ck-accent-color": "#F5C518",
            "--ck-accent-text-color": "#080810",
            "--ck-body-background": "#0d0d1a",
            "--ck-body-background-secondary": "#161628",
            "--ck-body-color": "#e8e8f0",
            "--ck-body-color-muted": "#7070a0",
            "--ck-border-radius": "12px",
            "--ck-overlay-background": "rgba(8,8,16,0.85)",
          }}
        >
          {children}
        </ConnectKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
