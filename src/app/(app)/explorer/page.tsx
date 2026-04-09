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

  const otherNetworkId  = net.id === "bradbury" ? "studionet" : "bradbury";
  const otherNetwork    = NETWORKS[otherNetworkId];

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

        {/* Other network — compact table */}
        <div className="mb-10">
          <h2 className="text-lg font-semibold text-chalk mb-4">
            {otherNetwork.name} — All Addresses
          </h2>
          <div className="rounded-xl border border-line bg-turf overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line">
                  <th className="text-left text-mist font-medium px-4 py-3 w-24">Contract</th>
                  <th className="text-left text-mist font-medium px-4 py-3">Address</th>
                  <th className="px-4 py-3 w-20"></th>
                </tr>
              </thead>
              <tbody>
                {CONTRACT_KEYS.map(key => {
                  const addr = otherNetwork.addresses[key];
                  const isZero = addr === "0x0000000000000000000000000000000000000000";
                  return (
                    <tr key={key} className="border-b border-line/50 last:border-0">
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs text-mist">{key}</span>
                        {key === "CORE_V1" && (
                          <span className="ml-1 text-xs text-mist opacity-50">v1</span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-mono text-chalk text-xs">
                        {isZero ? <span className="text-mist">—</span> : addr}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {!isZero && (
                          <a
                            href={`${otherNetwork.explorer}/address/${addr}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-ref hover:text-ref-dim transition-colors"
                          >
                            ↗
                          </a>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
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
