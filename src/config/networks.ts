export type NetworkId = "studionet" | "bradbury";

export interface NetworkAddresses {
  CORE:    string;
  CORE_V1?: string; // original v1 contract (kept for history, optional)
  LB:      string;
  ORG:     string;
  FEE:     string;
  TRN:     string;
}

export interface NetworkConfig {
  id:            NetworkId;
  name:          string;
  label:         string;
  description:   string;
  rpc:           string;
  explorer:      string;
  chainId:       number;
  addresses:     NetworkAddresses;
  walletEnabled: boolean;
  speed:         string;
}

export const NETWORKS: Record<NetworkId, NetworkConfig> = {
  studionet: {
    id:          "studionet",
    name:        "Studionet",
    label:       "Studionet",
    description: "Development network. Real AI consensus, no gas cost.",
    rpc:         process.env.NEXT_PUBLIC_STUDIONET_RPC     ?? "https://studio.genlayer.com/api",
    explorer:    process.env.NEXT_PUBLIC_STUDIONET_EXPLORER ?? "https://genlayer-explorer.vercel.app",
    chainId:     61999,
    walletEnabled: false,
    speed:       "Fast",
    addresses: {
      CORE:    process.env.NEXT_PUBLIC_STUDIONET_CORE    ?? "0xEC221bD04E9ACcb59642Ed7659aFFFc3e84B7019",
      CORE_V1: process.env.NEXT_PUBLIC_STUDIONET_CORE_V1 ?? "0x88CAA18419714aA38CdF53c0E603141c48fa3238",
      LB:      process.env.NEXT_PUBLIC_STUDIONET_LB      ?? "0x8A2d05Df048A64cc6B83682a431ade05030e4BBB",
      ORG:     process.env.NEXT_PUBLIC_STUDIONET_ORG     ?? "0x265ef96A5230F13836c553D7DD2B9D7c3fE14aE1",
      FEE:     process.env.NEXT_PUBLIC_STUDIONET_FEE     ?? "0x0000000000000000000000000000000000000000",
      TRN:     process.env.NEXT_PUBLIC_STUDIONET_TRN     ?? "0x44f7c1bDa293B9cdBD79a6dfb66bD45696dEa4A6",
    },
  },
  bradbury: {
    id:          "bradbury",
    name:        "Bradbury",
    label:       "Bradbury Testnet",
    description: "Public testnet. Real multi-model AI consensus.",
    rpc:         process.env.NEXT_PUBLIC_BRADBURY_RPC     ?? "https://rpc-bradbury.genlayer.com",
    explorer:    process.env.NEXT_PUBLIC_BRADBURY_EXPLORER ?? "https://explorer-bradbury.genlayer.com",
    chainId:     4221,
    walletEnabled: true,
    speed:       "Public Testnet",
    addresses: {
      CORE:    process.env.NEXT_PUBLIC_BRADBURY_CORE    ?? "0x2101FE3111A4d7467D6eF1C4F8181E7bDE6a2B7f",
      CORE_V1: process.env.NEXT_PUBLIC_BRADBURY_CORE_V1 ?? "0xA29CfFC83d32fe924cFf1F1bDCf21555CCC96206",
      LB:      process.env.NEXT_PUBLIC_BRADBURY_LB      ?? "0x5D417F296b17656c9b950236feE66F63E22d8A54",
      ORG:     process.env.NEXT_PUBLIC_BRADBURY_ORG     ?? "0x440b28afc1804fc1E4AA8f5b559C18F7bCf43B3A",
      FEE:     process.env.NEXT_PUBLIC_BRADBURY_FEE     ?? "0x88A0A4d573fD9C63433E457e94d266D7904278C2",
      TRN:     process.env.NEXT_PUBLIC_BRADBURY_TRN     ?? "0xbcc0E82a17491297E0c4938606624Fa04e6abA1B",
    },
  },
};

export const CONTRACT_NAMES: Record<keyof NetworkAddresses, string> = {
  CORE:    "RefereeCore v2",
  CORE_V1: "RefereeCore v1",
  LB:      "LeaderboardVault",
  ORG:     "OrganizerRegistry",
  FEE:     "FeeManager",
  TRN:     "TournamentEngine",
};

export const CONTRACT_DESCRIPTIONS: Record<keyof NetworkAddresses, string> = {
  CORE:    "Hub contract — games, moves, AI judgment, leaderboard wiring (current)",
  CORE_V1: "Original contract — preserved for historical games and reference",
  LB:      "Persistent player rankings with human/agent dual leaderboards",
  ORG:     "Verified organizer registry for tournament management",
  FEE:     "Fee collection and treasury — disabled for hackathon",
  TRN:     "Tournament engine — single elimination, round robin, Swiss",
};
