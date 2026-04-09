"use client";

import { useState } from "react";
import { useNetwork } from "@/context/NetworkContext";
import {
  NETWORKS,
  CONTRACT_NAMES,
  CONTRACT_DESCRIPTIONS,
  NetworkAddresses,
} from "@/config/networks";

// Contract keys to display — v2 first, then v1, then the rest
const CONTRACT_KEYS: (keyof NetworkAddresses)[] = [
  "CORE",
  "CORE_V1",
  "LB",
  "ORG",
  "FEE",
  "TRN",
];

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      className="text-xs text-mist hover:text-chalk transition-colors ml-2 font-mono"
    >
      {copied ? "✓ copied" : "copy"}
    </button>
  );
}

interface ContractCardProps {
  label:       string;
  name:        string;
  description: string;
  address:     string;
  explorer:    string;
  isV1?:       boolean;
}

function ContractCard({ label, name, description, address, explorer, isV1 }: ContractCardProps) {
  const isZero = address === "0x0000000000000000000000000000000000000000";

  return (
    <div className={`rounded-xl border p-5 ${
      isV1
        ? "border-line bg-turf/40 opacity-70"
        : "border-line bg-turf"
    }`}>
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono bg-line text-mist px-2 py-0.5 rounded">
            {label}
          </span>
          {isV1 && (
            <span className="text-xs font-mono bg-mist/10 text-mist px-2 py-0.5 rounded border border-mist/20">
              v1 · archived
            </span>
          )}
          {!isV1 && label === "CORE" && (
            <span className="text-xs font-mono bg-ref/10 text-ref px-2 py-0.5 rounded border border-ref/20">
              current
            </span>
          )}
        </div>
      </div>

      <p className="text-chalk font-medium mb-0.5">{name}</p>
      <p className="text-sm text-mist mb-4">{description}</p>

      <div className="font-mono text-sm text-chalk bg-pitch rounded px-3 py-2 flex items-center justify-between flex-wrap gap-2">
        <span className={isZero ? "text-mist" : ""}>
          {isZero ? "—" : address}
        </span>
        {!isZero && (
          <div className="flex items-center gap-3">
            <CopyButton text={address} />
            <a
              href={`${explorer}/address/${address}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-ref hover:text-ref-dim transition-colors"
            >
              explorer ↗
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ExplorerPage() {
  const { network } = useNetwork();
  const [copied, setCopied] = useState(false);

  if (!network) return null;
  const net = network; // stable reference for nested functions

  function buildSummary() {
    const lines = [
      `TheRef — ${net.name} Contract Addresses`,
      `Network:  ${net.name}`,
      `RPC:      ${net.rpc}`,
      `Explorer: ${net.explorer}`,
      "",
      `RefereeCore v2 (current): ${net.addresses.CORE}`,
      `RefereeCore v1 (archived): ${net.addresses.CORE_V1}`,
      ...["LB","ORG","FEE","TRN"].map(
        k => `${CONTRACT_NAMES[k as keyof NetworkAddresses].padEnd(22)}: ${net.addresses[k as keyof NetworkAddresses]}`
      ),
    ];
    return lines.join("\n");
  }

  return (
    <div className="page">
      <div className="container-ref">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-display font-bold text-chalk mb-2">Explorer</h1>
          <p className="text-mist">All deployed contract addresses and methods</p>
        </div>

        {/* Network badge */}
        <div className="flex items-center gap-3 mb-8 p-4 rounded-xl border border-line bg-turf">
          <div>
            <p className="font-medium text-chalk">{net.name}</p>
            <p className="text-sm text-mist">Chain ID {net.chainId}</p>
          </div>
          <div className="ml-auto text-right text-sm text-mist font-mono">
            <p>RPC: {net.rpc}</p>
            <p>
              <a
                href={net.explorer}
                target="_blank"
                rel="noopener noreferrer"
                className="text-ref hover:text-ref-dim transition-colors"
              >
                {net.explorer} ↗
              </a>
            </p>
          </div>
        </div>

        {/* Contract cards — current network */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-chalk">{net.name}</h2>
            <button
              onClick={() => {
                navigator.clipboard.writeText(buildSummary());
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
              }}
              className="text-sm text-mist hover:text-chalk transition-colors"
            >
              {copied ? "✓ copied all" : "copy all addresses"}
            </button>
          </div>

          <div className="grid gap-3">
            {CONTRACT_KEYS.map(key => (
              <ContractCard
                key={key}
                label={key}
                name={CONTRACT_NAMES[key]}
                description={CONTRACT_DESCRIPTIONS[key]}
                address={net.addresses[key] ?? ""}
                explorer={net.explorer}
                isV1={key === "CORE_V1"}
              />
            ))}
          </div>
        </div>

        {/* All Networks — separate clean tables */}
        <div className="mb-10">
          <h2 className="text-lg font-semibold text-chalk mb-6">All Networks</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {([
              { id: "studionet", label: "Studionet", chainId: 61999, dot: "bg-ref" },
              { id: "bradbury",  label: "Bradbury Testnet", chainId: 4221, dot: "bg-blue-400" },
            ] as const).map(({ id, label, chainId, dot }) => {
              const nw = NETWORKS[id];
              return (
                <div key={id} className="rounded-2xl border border-line overflow-hidden">
                  {/* Table header */}
                  <div className="flex items-center justify-between px-5 py-3.5 bg-turf border-b border-line">
                    <div className="flex items-center gap-2.5">
                      <span className={`w-2 h-2 rounded-full ${dot}`} />
                      <span className="font-display font-600 text-chalk text-sm">{label}</span>
                    </div>
                    <span className="font-mono text-[11px] text-mist">Chain {chainId}</span>
                  </div>

                  {/* Rows */}
                  <div className="divide-y divide-line/60 bg-pitch">
                    {CONTRACT_KEYS.map(key => {
                      const addr = nw.addresses[key];
                      const isZero = !addr || addr === "0x0000000000000000000000000000000000000000";
                      const isV1   = key === "CORE_V1";
                      const isCurrent = key === "CORE";

                      return (
                        <div
                          key={key}
                          className={`flex items-center justify-between gap-3 px-5 py-3 ${isV1 ? "opacity-50" : ""}`}
                        >
                          {/* Contract label */}
                          <div className="flex items-center gap-2 shrink-0 w-36">
                            <span className="font-mono text-xs text-mist">{key}</span>
                            {isCurrent && (
                              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-ref/10 text-ref border border-ref/20">
                                current
                              </span>
                            )}
                            {isV1 && (
                              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-line text-mist border border-line">
                                v1
                              </span>
                            )}
                          </div>

                          {/* Contract name */}
                          <span className="text-xs text-mist hidden sm:block w-36 shrink-0">
                            {CONTRACT_NAMES[key]}
                          </span>

                          {/* Address + link */}
                          {isZero ? (
                            <span className="font-mono text-xs text-mist ml-auto">—</span>
                          ) : (
                            <div className="flex items-center gap-2 ml-auto min-w-0">
                              <span className="font-mono text-xs text-chalk truncate">
                                {addr?.slice(0, 6)}...{addr?.slice(-4)}
                              </span>
                              <a
                                href={`${nw.explorer}/address/${addr}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="shrink-0 text-xs text-ref hover:text-ref-dim transition-colors font-mono"
                                title={addr}
                              >
                                ↗
                              </a>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Footer */}
                  <div className="px-5 py-3 bg-turf border-t border-line">
                    <a
                      href={nw.explorer}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-mist hover:text-ref transition-colors font-mono"
                    >
                      {nw.explorer} ↗
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Meta */}
        <div className="text-sm text-mist space-y-1">
          <p>Deployer: <span className="font-mono text-chalk">0x73693d8EF123EbF1d7da3Db6Ee27baDD54d03ce6</span></p>
          <p>Treasury: <span className="font-mono text-chalk">0xFe0Af9457074A2FD685425865F71ac925ad9c3D9</span></p>
        </div>

      </div>
    </div>
  );
}
