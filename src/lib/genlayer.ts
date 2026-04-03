import { createClient, createAccount, generatePrivateKey, chains } from "genlayer-js";
import { TransactionStatus } from "genlayer-js/types";
import { NetworkConfig } from "@/config/networks";

const DEV_KEY_STORAGE = "theref_dev_privkey";
const clientCache = new Map<string, ReturnType<typeof createClient>>();

function getDevPrivateKey(): `0x${string}` {
  try {
    if (typeof window === "undefined") return generatePrivateKey();
    const stored = localStorage.getItem(DEV_KEY_STORAGE);
    if (stored) return stored as `0x${string}`;
    const key = generatePrivateKey();
    localStorage.setItem(DEV_KEY_STORAGE, key);
    return key;
  } catch {
    return generatePrivateKey();
  }
}

function getChainForNetwork(network: NetworkConfig) {
  const base =
    network.chainId === 4221  ? chains.testnetBradbury :
    network.chainId === 61999 ? chains.studionet       :
    chains.studionet;

  const rpc = network.rpc || base.rpcUrls.default.http[0];
  if (rpc === base.rpcUrls.default.http[0]) return base;

  return {
    ...base,
    rpcUrls: { default: { http: [rpc] } },
  };
}

/** Get the connected wallet address from window.ethereum, or null if not connected */
async function getWalletAddress(): Promise<`0x${string}` | null> {
  try {
    if (typeof window === "undefined" || !window.ethereum) return null;
    const accounts = await window.ethereum.request({ method: "eth_accounts" }) as string[];
    return accounts?.[0] as `0x${string}` ?? null;
  } catch {
    return null;
  }
}

export async function getClientForNetwork(network: NetworkConfig) {
  const chain = getChainForNetwork(network);

  if (network.walletEnabled) {
    // Bradbury — use wallet address string so SDK routes through window.ethereum
    // This triggers MetaMask/ConnectKit to pop up for signing
    const walletAddress = await getWalletAddress();
    if (walletAddress) {
      // Don't cache wallet clients — address can change
      return createClient({
        chain,
        endpoint: network.rpc,
        account: walletAddress, // string address → SDK uses window.ethereum
      });
    }
    throw new Error("No wallet connected. Please connect your wallet first.");
  }

  // Studionet — use dev private key (gasless / funded key)
  const cached = clientCache.get(network.rpc);
  if (cached) return cached;

  const privateKey = getDevPrivateKey();
  const account    = createAccount(privateKey);
  const client     = createClient({ chain, endpoint: network.rpc, account });
  clientCache.set(network.rpc, client);
  return client;
}

/** @deprecated use getClientForNetwork */
export function getClient(network: NetworkConfig) {
  const chain      = getChainForNetwork(network);
  const cached     = clientCache.get(network.rpc);
  if (cached) return cached;
  const privateKey = getDevPrivateKey();
  const account    = createAccount(privateKey);
  const client     = createClient({ chain, endpoint: network.rpc, account });
  clientCache.set(network.rpc, client);
  return client;
}

export function resetClient(network: NetworkConfig) {
  clientCache.delete(network.rpc);
}

export async function writeContract(
  network: NetworkConfig,
  address: string,
  method: string,
  args: unknown[],
  value: bigint = 0n
): Promise<{ payload: string; txHash: string }> {
  const client = await getClientForNetwork(network);

  const tx = await client.writeContract({
    address:      address as `0x${string}`,
    functionName: method,
    args,
    value,
  });

  const receipt = await client.waitForTransactionReceipt({
    hash:    tx as `0x${string}`,
    status:  TransactionStatus.ACCEPTED,
    retries: 300,
  });

  const leader  = (receipt as any)?.consensus_data?.leader_receipt?.[0];
  const payload = String(
    leader?.result?.payload?.readable ??
    (receipt as any)?.data?.result ?? ""
  ).replace(/^"|"$/g, "");

  return { payload, txHash: String(tx) };
}

export async function readContract(
  network: NetworkConfig,
  address: string,
  method: string,
  args: unknown[] = []
): Promise<unknown> {
  // Reads don't need wallet — always use dev key client
  const client = getClient(network);
  return client.readContract({
    address:      address as `0x${string}`,
    functionName: method,
    args,
  });
}

export function extractValidators(receipt: unknown): Array<{
  model:   string;
  vote:    string;
  address: string;
}> {
  const r = receipt as any;
  const validators = r?.consensus_data?.validators ?? [];
  const voteNames: string[] = (
    r?.last_round?.validator_votes_name ??
    r?.lastRound?.validatorVotesName ?? []
  );
  return validators.map((v: any, i: number) => ({
    model:   String(v?.node_config?.primary_model?.model ?? "?").split("/").pop() ?? "?",
    vote:    voteNames[i] ?? "?",
    address: String(v?.node_config?.address ?? "").slice(0, 10) + "...",
  }));
}
