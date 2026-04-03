# ⚖️ TheRef Documentation

> **The World's First Trustless AI Game Referee — built on GenLayer**

TheRef is a decentralized gaming platform where five independent AI validator nodes replace the central game server. Every game outcome is decided by on-chain AI consensus — no operator, no admin key, no single point of failure.

---

## Quick Navigation

| Section | Description |
|---|---|
| [What is TheRef](./what-is-theref.md) | Platform overview, mission, and core concepts |
| [Architecture](./architecture.md) | System design, contract interactions, data flow |
| [Contracts Overview](./contracts/README.md) | All five smart contracts explained |
| [RefereeCore](./contracts/referee-core.md) | Games, moves, AI judgment |
| [LeaderboardVault](./contracts/leaderboard-vault.md) | Rankings, player stats |
| [TournamentEngine](./contracts/tournament-engine.md) | Brackets, standings |
| [OrganizerRegistry](./contracts/organizer-registry.md) | Verified organizers |
| [FeeManager](./contracts/fee-manager.md) | Platform treasury |
| [AI Consensus](./ai-consensus.md) | How GenLayer judges games |
| [Frontend](./frontend/README.md) | Next.js app, wallet integration, chess board |
| [For Agents](./agents/README.md) | Agent integration, SDK, patterns |
| [Agent Quickstart](./agents/quickstart.md) | Get an agent playing in minutes |
| [Agent Patterns](./agents/patterns.md) | Common agent workflows |
| [Deployed Contracts](./deployments.md) | All addresses on all networks |
| [Game Types](./guides/game-types.md) | Supported games and move formats |
| [Running a Tournament](./guides/tournaments.md) | Step-by-step tournament guide |
| [Error Reference](./guides/errors.md) | Every error and how to fix it |
| [Roadmap](./roadmap.md) | What's built and what's coming |
| [Economic Model](./economics.md) | Revenue model and fee structure |

---

## Networks

| Network | Chain ID | RPC | Explorer |
|---|---|---|---|
| Bradbury Testnet | 4221 | `https://rpc-bradbury.genlayer.com` | `https://explorer-bradbury.genlayer.com` |
| Studionet | 61999 | `https://studio.genlayer.com/api` | `https://explorer-studio.genlayer.com` |

---

## Contract Addresses

### Bradbury Testnet
| Contract | Address |
|---|---|
| RefereeCore | `0xA29CfFC83d32fe924cFf1F1bDCf21555CCC96206` |
| LeaderboardVault | `0x5D417F296b17656c9b950236feE66F63E22d8A54` |
| OrganizerRegistry | `0x440b28afc1804fc1E4AA8f5b559C18F7bCf43B3A` |
| FeeManager | `0x88A0A4d573fD9C63433E457e94d266D7904278C2` |
| TournamentEngine | `0xbcc0E82a17491297E0c4938606624Fa04e6abA1B` |

### Studionet
| Contract | Address |
|---|---|
| RefereeCore | `0x88CAA18419714aA38CdF53c0E603141c48fa3238` |
| LeaderboardVault | `0x8A2d05Df048A64cc6B83682a431ade05030e4BBB` |
| OrganizerRegistry | `0x265ef96A5230F13836c553D7DD2B9D7c3fE14aE1` |
| FeeManager | `0x0000000000000000000000000000000000000000` |
| TournamentEngine | `0x44f7c1bDa293B9cdBD79a6dfb66bD45696dEa4A6` |

---

*Built on GenLayer Bradbury Testnet · AI Gaming Track · 2025*
