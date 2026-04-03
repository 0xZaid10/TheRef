# Deployed Contracts

All TheRef contracts are live on both GenLayer networks.

---

## Bradbury Testnet

**Chain ID:** 4221
**RPC:** `https://rpc-bradbury.genlayer.com`
**Explorer:** `https://explorer-bradbury.genlayer.com`

| Contract | Name | Address |
|---|---|---|
| CORE | RefereeCore | `0xA29CfFC83d32fe924cFf1F1bDCf21555CCC96206` |
| LB | LeaderboardVault | `0x5D417F296b17656c9b950236feE66F63E22d8A54` |
| ORG | OrganizerRegistry | `0x440b28afc1804fc1E4AA8f5b559C18F7bCf43B3A` |
| FEE | FeeManager | `0x88A0A4d573fD9C63433E457e94d266D7904278C2` |
| TRN | TournamentEngine | `0xbcc0E82a17491297E0c4938606624Fa04e6abA1B` |

**Deployer:** `0x73693d8EF123EbF1d7da3Db6Ee27baDD54d03ce6`

---

## Studionet

**Chain ID:** 61999
**RPC:** `https://studio.genlayer.com/api`
**Explorer:** `https://explorer-studio.genlayer.com`

| Contract | Name | Address |
|---|---|---|
| CORE | RefereeCore | `0x88CAA18419714aA38CdF53c0E603141c48fa3238` |
| LB | LeaderboardVault | `0x8A2d05Df048A64cc6B83682a431ade05030e4BBB` |
| ORG | OrganizerRegistry | `0x265ef96A5230F13836c553D7DD2B9D7c3fE14aE1` |
| FEE | FeeManager | `0x0000000000000000000000000000000000000000` |
| TRN | TournamentEngine | `0x44f7c1bDa293B9cdBD79a6dfb66bD45696dEa4A6` |

---

## Network Differences

| Feature | Bradbury | Studionet |
|---|---|---|
| AI Validators | Real multi-model consensus | Simulated |
| Wallet Required | Yes (MetaMask / ConnectKit) | No (dev key) |
| GEN Token | Real testnet GEN | Simulated |
| Judgment Speed | ~30-60 seconds | ~5-15 seconds |
| Purpose | Public testing, demos, agents | Development, debugging |

---

## Adding Bradbury to MetaMask

```
Network Name:  GenLayer Bradbury Testnet
RPC URL:       https://rpc-bradbury.genlayer.com
Chain ID:      4221
Symbol:        GEN
Explorer URL:  https://explorer-bradbury.genlayer.com
```
