"use client";

import { useState }        from "react";
import { motion }          from "framer-motion";
import { useNetwork }      from "@/context/NetworkContext";
import { ContractCard }    from "@/components/explorer/ContractCard";
import { Card }            from "@/components/ui/Card";
import { Badge }           from "@/components/ui/Badge";
import { Button }          from "@/components/ui/Button";
import {
  NETWORKS,
  NetworkAddresses,
  CONTRACT_NAMES,
} from "@/config/networks";
import { copyToClipboard } from "@/lib/utils";

const CONTRACT_KEYS: (keyof NetworkAddresses)[] = [
  "CORE", "LB", "ORG", "FEE", "TRN",
];

export default function ExplorerPage() {
  const { network } = useNetwork();
  const [copiedAll, setCopiedAll] = useState(false);

  if (!network) return null;
  const net = network; // capture for use inside nested functions

  // Build copy-all text
  function buildSummary() {
    const lines = [
      `TheRef - ${net.name} Contract Addresses`,
      `Network: ${net.name}`,
      `RPC: ${net.rpc}`,
      `Explorer: ${net.explorer}`,
      "",
      ...CONTRACT_KEYS.map(
        (k) => `${CONTRACT_NAMES[k].padEnd(20)}: ${net.addresses[k]}`
      ),
    ];
    return lines.join("\n");
  }

  async function handleCopyAll() {
    await copyToClipboard(buildSummary());
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  }

  // Both networks for side-by-side comparison section
  const studionet = NETWORKS.studionet;
  const bradbury  = NETWORKS.bradbury;

  return (
    <div className="page">
      <div className="container-ref">

        {/*  Header  */}
        <div className="flex items-start justify-between gap-4 mb-8 flex-wrap">
          <div>
            <h1 className="font-display text-3xl font-800 text-chalk">
              Explorer
            </h1>
            <p className="text-mist text-sm mt-1">
              All deployed contract addresses and methods
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge
              variant={network.id === "studionet" ? "studionet" : "bradbury"}
              dot
              size="md"
            >
              {network.name}
            </Badge>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleCopyAll}
            >
              {copiedAll ? "✓ Copied" : "Copy All"}
            </Button>
          </div>
        </div>

        {/*  Network info  */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y:  0 }}
          transition={{ duration: 0.3 }}
          className="mb-6"
        >
          <Card className="bg-pitch">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <InfoRow label="Network"  value={network.name} />
              <InfoRow label="Chain ID" value={String(network.chainId)} mono />
              <InfoRow label="Wallet"   value={network.walletEnabled ? "Required" : "Not needed"} />
            </div>
            <div className="border-t border-line mt-4 pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] text-mist uppercase font-mono tracking-wider mb-1">
                  RPC Endpoint
                </p>
                <p className="font-mono text-xs text-chalk break-all">{network.rpc}</p>
              </div>
              <div>
                <p className="text-[10px] text-mist uppercase font-mono tracking-wider mb-1">
                  Explorer
                </p>
                <a
                  href={network.explorer}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-xs text-ref hover:underline break-all"
                >
                  {network.explorer}
                </a>
              </div>
            </div>
          </Card>
        </motion.div>

        {/*  Contract cards  */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
          {CONTRACT_KEYS.map((key, i) => (
            <motion.div
              key={key}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y:  0 }}
              transition={{ duration: 0.35, delay: i * 0.06 }}
              className={key === "CORE" ? "md:col-span-2" : ""}
            >
              <ContractCard
                contractKey={key}
                address={network.addresses[key]}
                explorerUrl={network.explorer}
                networkName={network.name}
              />
            </motion.div>
          ))}
        </div>

        {/*  Both networks side by side  */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          <h2 className="font-display text-xl font-700 text-chalk mb-4">
            All Networks
          </h2>

          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-line">
                    <th className="text-left py-2 pr-4 text-xs text-mist font-mono uppercase tracking-wider">
                      Contract
                    </th>
                    <th className="text-left py-2 pr-4 text-xs text-mist font-mono uppercase tracking-wider">
                      <Badge variant="studionet" dot size="sm">Studionet</Badge>
                    </th>
                    <th className="text-left py-2 text-xs text-mist font-mono uppercase tracking-wider">
                      <Badge variant="bradbury" dot size="sm">Bradbury</Badge>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {CONTRACT_KEYS.map((key) => (
                    <tr
                      key={key}
                      className="border-b border-line/50 last:border-0 hover:bg-pitch/50
                                 transition-colors duration-150"
                    >
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-2">
                          <Badge variant="ref" size="sm">{key}</Badge>
                          <span className="text-chalk text-xs font-500 hidden sm:block">
                            {CONTRACT_NAMES[key]}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 pr-4">
                        <AddressCell
                          address={studionet.addresses[key]}
                          explorerUrl={studionet.explorer}
                        />
                      </td>
                      <td className="py-3">
                        <AddressCell
                          address={bradbury.addresses[key]}
                          explorerUrl={bradbury.explorer}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </motion.div>

        {/*  Deployer info  */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.4 }}
          className="mt-6"
        >
          <Card className="bg-pitch border-line">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] text-mist uppercase font-mono tracking-wider mb-1">
                  Deployer
                </p>
                <p className="font-mono text-xs text-chalk break-all">
                  0x73693d8EF123EbF1d7da3Db6Ee27baDD54d03ce6
                </p>
              </div>
              <div>
                <p className="text-[10px] text-mist uppercase font-mono tracking-wider mb-1">
                  Treasury
                </p>
                <p className="font-mono text-xs text-chalk break-all">
                  0xFe0Af9457074A2FD685425865F71ac925ad9c3D9
                </p>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

//  Helpers 

function InfoRow({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div>
      <p className="text-[10px] text-mist uppercase font-mono tracking-wider mb-1">
        {label}
      </p>
      <p className={`text-sm text-chalk ${mono ? "font-mono" : "font-500"}`}>
        {value}
      </p>
    </div>
  );
}

function AddressCell({
  address,
  explorerUrl,
}: {
  address:     string;
  explorerUrl: string;
}) {
  const [copied, setCopied] = useState(false);

  async function handleCopy(e: React.MouseEvent) {
    e.preventDefault();
    await copyToClipboard(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="flex items-center gap-2">
      <a
        href={`${explorerUrl}/address/${address}`}
        target="_blank"
        rel="noopener noreferrer"
        className="font-mono text-xs text-mist hover:text-ref transition-colors"
        title={address}
      >
        {address.slice(0, 6)}...{address.slice(-4)}
      </a>
      <button
        onClick={handleCopy}
        className={`text-[10px] font-mono transition-colors
          ${copied ? "text-win" : "text-mist hover:text-chalk"}`}
      >
        {copied ? "✓" : "⎘"}
      </button>
    </div>
  );
}
