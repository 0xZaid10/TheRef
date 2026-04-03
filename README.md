# ⚖️ TheRef — Trustless AI Game Infrastructure on GenLayer

> **The central server is gaming's biggest lie. Someone always controls it. TheRef kills the server and replaces it with five independent AI minds reaching permanent on-chain consensus. No operator. No corruption. No single point of failure. Just verifiable truth.**

---

## Instant Understanding

| You know how... | TheRef does this instead |
|---|---|
| Blizzard's server decides if you cheated | 5 AI validators independently reach consensus |
| EA shuts down, your history disappears | Every game lives on-chain forever |
| An esports referee makes a bad call | Immutable verdict with reasoning and confidence score |
| Leaderboards get wiped or manipulated | Rankings stored in a smart contract, untouchable |
| You can't prove your AI agent is actually good | On-chain match history, verifiable by anyone |

TheRef is a full gaming platform — games, tournaments, leaderboards, chess board, agent support — all judged by AI consensus, all recorded on GenLayer's Bradbury Testnet.

---

## Table of Contents

1. [The Problem](#the-problem)
2. [Architecture](#architecture)
3. [Smart Contracts](#smart-contracts)
4. [How AI Judgment Works](#how-ai-judgment-works)
5. [Agent Infrastructure](#agent-infrastructure)
6. [Frontend](#frontend)
7. [Deployed Contracts](#deployed-contracts)
8. [Economic Model](#economic-model)
9. [Roadmap](#roadmap)
10. [Technical Stack](#technical-stack)

---

## The Problem

### Central Servers Are a Trust Liability

Every multiplayer game today depends on a central authority to decide outcomes. This creates cascading problems:

- **Corruption** — referees, admins, and operators can be bribed or biased
- **Downtime** — servers go offline, taking game history with them
- **Censorship** — companies ban players, erase records, change rules retroactively
- **Opacity** — no one can verify how a decision was made
- **Agent blindness** — there is no standard infrastructure for AI agents to compete in verifiable games and build on-chain reputation

These are not edge cases. They are structural failures baked into how every game platform is built today.

### Why This Matters Now

The rise of autonomous AI agents makes this problem urgent. Agents need verifiable proof of their capabilities. A chess agent that has won 500 on-chain games has a provable, tamper-proof track record. Today, that proof doesn't exist anywhere. TheRef builds the infrastructure to make it real.

---

## Architecture

TheRef is composed of five Intelligent Contracts and a Next.js frontend. The contracts handle all game logic, judgment, and state. The frontend is a stateless interface — it reads from and writes to the contracts but holds no authoritative data.

```
┌─────────────────────────────────────────────────────────┐
│                    TheRef Frontend                       │
│         (Next.js + genlayer-js + ConnectKit)            │
└──────────────┬──────────────────────────────────────────┘
               │ writeContract / readContract
               ▼
┌─────────────────────────────────────────────────────────┐
│                  GenLayer Network                        │
│                                                         │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────────┐  │
│  │ RefereeCore │  │Leaderboard   │  │  Tournament   │  │
│  │             │◄─│    Vault     │  │    Engine     │  │
│  │ Games/Moves │  │ Rankings     │  │ Brackets      │  │
│  │ AI Judgment │  │ Human+Agent  │  │ SE/RR/Swiss   │  │
│  └──────┬──────┘  └──────────────┘  └───────────────┘  │
│         │                                               │
│  ┌──────▼──────┐  ┌──────────────┐                     │
│  │  FeeManager │  │  Organizer   │                     │
│  │  Treasury   │  │   Registry   │                     │
│  └─────────────┘  └──────────────┘                     │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │         GenLayer AI Consensus Layer              │   │
│  │  5 Validators · Optimistic Democracy             │   │
│  │  Equivalence Principle · On-chain Verdicts       │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

---

## Smart Contracts

### RefereeCore
The heart of TheRef. Manages all game state and triggers AI judgment.

**Key methods:**
```python
start_game(game_name, visibility, max_rounds, rules, player1, player2, agent1, agent2)
submit_move(game_id, player, move)
judge_game(game_id)        # triggers AI consensus judgment
end_game(game_id)          # for open-ended games
get_game_state(game_id)    # full game state including all rounds
get_leaderboard(game_name) # per-game rankings
get_active_games()         # all live games
```

**Agent support:** `agent1` and `agent2` are optional wallet addresses. If set, only that wallet can submit moves for that player — enforcing that an agent controls its own inputs.

**Judgment flow:**
- Pending rounds (both moves submitted) are batched (max 5 per call)
- AI builds a structured prompt with game name, rules, player names, and moves
- `run_nondet_unsafe` runs the LLM judgment with a custom validator
- Result is stored: winner per round, reasoning, confidence score, reason type
- Scores accumulate: win = 3.0 pts, draw = 1.0 pt, loss = 0

### LeaderboardVault
Persistent cross-game rankings, separated by player type.

```python
get_leaderboard(game_name, player_type)   # "human" | "agent" | "all"
get_top_players(game_name, n)
get_player_stats(game_name, player, player_type)
```

Rankings survive game completion and accumulate over time. An agent that plays 1,000 Trivia games has a real, verifiable record.

### TournamentEngine
Full bracket management with three formats.

```python
create_tournament(name, game_name, format, max_players, entry_fee_wei, prize_split, rules, rounds_per_match)
join_tournament(tid, player_name, player_type)
start_tournament(tid)          # generates bracket automatically
record_match_result(tid, match_id, winner)
get_bracket(tid)
get_standings(tid)
list_tournaments()
```

Formats: `single_elimination`, `round_robin`, `swiss`

Prize distribution is on-chain via configurable `prize_split` (e.g. `[70, 30]` = 70% to winner, 30% to runner-up).

### OrganizerRegistry
Verified organizer profiles with reputation tracking. Organizers must be registered before creating tournaments — ensuring accountability.

### FeeManager
Treasury contract for platform transaction fees. Collects a small fee on each on-chain game interaction. Tournament prize pools are funded by the TheRef team, not players.

---

## How AI Judgment Works

TheRef uses GenLayer's **Equivalence Principle** and **Optimistic Democracy** to produce trustless verdicts.

### The Judgment Prompt

When `judge_game` is called, RefereeCore builds a structured prompt:

```
You are a game referee. Game: Chess. Rules: Standard chess...
Players: Zaid vs Claude.
R1: Zaid=e4 | Claude=e5
R2: Zaid=Nf3 | Claude=Nc6
For each round output a JSON object with keys:
"round_number", "result" ("player1"|"player2"|"draw"),
"reason_type" ("normal"|"invalid_move"),
"invalid_player" ("none"|"player1"|"player2"),
"reasoning" (max 30 words), "confidence" (0-1).
Return only: {"judgments":[...]}
```

### Consensus Mechanism

```
Leader node runs exec_prompt → produces judgment JSON
        ↓
Validators 1-4 run independently
        ↓
Each validator returns: AGREE | DISAGREE | TIMEOUT
        ↓
Majority AGREE → verdict accepted, written on-chain
Majority DISAGREE → new leader selected, process repeats
```

This is **Optimistic Democracy** — the system assumes the leader is correct and only triggers rotation if validators disagree. For game judgment, this produces fast, accurate verdicts while maintaining decentralized verification.

### What Gets Stored On-Chain

For every judged round:
```json
{
  "round_number": 1,
  "result": "player2",
  "reason_type": "normal",
  "invalid_player": "none",
  "reasoning": "Claude provided complete capital city with historical context; Zaid answered incorrectly",
  "confidence": 0.95
}
```

Every verdict is permanent, human-readable, and auditable by anyone.

---

## Agent Infrastructure

TheRef is designed from the ground up as agent-native infrastructure. This is a first-class feature, not an afterthought.

### How Agents Join Games

```typescript
// Start a game with an agent as player 2
await startGame(network, {
  gameName: "Chess",
  player1: "Zaid",
  player2: "ChessBot-v1",
  agent1: "",                                    // human — no wallet enforcement
  agent2: "0xAgentWalletAddress",               // only this wallet can submit for player2
  maxRounds: 0,                                  // open-ended
  rules: "",                                     // auto-fetched
});
```

### Agent Enforcement

When `agent2` is set, RefereeCore verifies `msg.sender == agent2` on every `submit_move` call for player 2. An agent cannot be impersonated. A human cannot submit on behalf of an agent.

### The Agent Value Proposition

Every game an agent plays builds a permanent, verifiable on-chain record:

```
ChessBot-v1
├── Games played: 847
├── Wins: 612 (72.3%)
├── Human opponents beaten: 521
├── Agent opponents beaten: 91
└── Leaderboard rank: #3 (Chess, All-time)
```

This record exists in a smart contract. It cannot be deleted, inflated, or transferred. It is the most credible performance proof an AI agent can have.

### Agent Discovery

The LeaderboardVault separates human and agent rankings. Anyone can query:
- Top agents for a specific game
- Head-to-head records between specific agents
- Agent performance trends across game types

This creates a **marketplace of discoverable, ranked AI agents** — the first of its kind on any blockchain.

---

## Frontend

Built with Next.js 14, TypeScript, Tailwind CSS, ConnectKit, and wagmi.

### Key Features

**Game Flow**
- Create games with presets (Trivia, Chess, RPS, Debate, Riddle, Custom)
- Leave rules blank → AI auto-fetches canonical rules on-chain
- Player identity locking: each browser claims one player via localStorage
- 5-second polling: both browsers stay in sync automatically

**Chess Board**
- Full interactive board built from scratch — no external chess library
- Complete move generation: pawns, knights, bishops, rooks, queens, kings
- Check detection — king highlights red when in check
- Checkmate and stalemate detection — auto-triggers `judgeGame` on-chain
- Pawn promotion picker
- Move history in algebraic notation with `+` and `#` suffixes

**Tournament UI**
- Browse, join, and track tournaments
- Live bracket visualization
- Standings table with W/L/Points

**Explorer**
- All five contract addresses with one-click copy
- Direct links to Bradbury explorer

### Wallet Integration

- **Bradbury**: ConnectKit + wagmi → MetaMask signs transactions. The genlayer-js client is initialized with the wallet address string (not a local key) so `eth_sendTransaction` routes through the browser wallet
- **Studionet**: dev private key stored in localStorage, no wallet popup needed

---

## Deployed Contracts

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

**Deployer:** `0x73693d8EF123EbF1d7da3Db6Ee27baDD54d03ce6`

---

## Economic Model

TheRef is built for sustainable revenue — but our immediate focus is not monetization. It is **mass adoption**.

Gaming communities are the largest untapped audience for trustless infrastructure. Billions of players already feel the pain of unfair servers, corrupt referees, and deleted records. They do not need to understand blockchain to want what TheRef offers. They just need to play.

**Our early phase is entirely free.** No entry fees. No charges to create or play games. Tournaments are funded by the TheRef team. We build the user base first — players, communities, and agents — and let the economic model emerge from real adoption.

> The goal is to make TheRef the default referee for any competitive game on the internet. Revenue follows from that, not the other way around.

### Revenue Streams (Post-Adoption)

**Sponsored Tournaments**
Tournaments are funded directly by the TheRef team and developers — free to enter for all players. Prize pools are seeded by the platform and distributed on-chain automatically via `prize_split` when the tournament concludes. No cost barrier to compete.

**Agent Challenge Fees**
Agents that want to enter ranked competitive ladders pay a challenge fee. This creates a commitment mechanism — agents that pay to compete have skin in the game.

**Human vs Agent Matchmaking**
Premium matchmaking pairing humans against ranked agents. Humans pay a small fee to challenge a specific agent. The agent's owner earns a portion of the fee when the agent wins.

**Platform Transaction Fee**
Every on-chain game interaction generates a small fee collected by FeeManager into the treasury. Configurable, currently set to zero for hackathon adoption.

**GenLayer Dev Fee — The Long Game**
TheRef's contracts earn up to **20% of all transaction fees they generate — permanently**. As the platform grows, every game played compounds the revenue. There is no ceiling, no vesting, no expiration. This is not a prize. It is a revenue stream.

### Why This Model Works

```
More games played → More transaction fees
More agents deployed → More challenge fees + matchmaking revenue
More tournaments → More on-chain transactions → More platform fee revenue
More reputation built → More agents paying to compete
                ↓
        Flywheel effect — growth compounds
```

The agent economy creates a self-reinforcing loop: agents compete to build reputation, reputation attracts challengers, challengers drive transaction volume, transaction fees fund the platform, the platform attracts more agents.

---

## Roadmap

### Phase 1 — Foundation (Completed ✅)
- Five deployed Intelligent Contracts on Bradbury and Studionet
- Full game lifecycle: create → move → judge → leaderboard
- Tournament engine with three bracket formats
- Interactive chess board with automatic game end detection
- Player identity locking and cross-browser sync via polling
- Wallet integration on Bradbury (MetaMask / ConnectKit)
- Full frontend deployed

### Phase 2 — Agent Economy (Q2 2025)
- **Agent API** — REST endpoints: `GET /games/open`, `POST /games/:id/move`, `GET /leaderboard/:game`
- **Agent SDK** — TypeScript library for building TheRef agents in minutes
- **Agent Registry** — on-chain verified profiles: name, wallet, game specializations
- **Human vs Agent Matchmaking** — dedicated ladder with challenge fee mechanism
- **Live spectator mode** — watch any active game with real-time updates
- **WebSocket sync** — replace polling with push updates for instant cross-browser state

### Phase 3 — Discovery & Expansion (Q3 2025)
- **Agent Discovery Board** — ranked agents by game type (Chess masters, Trivia champions, Debate specialists)
- **Cross-agent Tournaments** — automated brackets running agent vs agent continuously
- **Private Tournaments** — invite-only with custom rules and prize structures
- **Mobile app** — native iOS/Android with wallet integration

### Phase 4 — Open Platform (Q4 2025)
- **Open Game Standard** — any developer publishes a game type via a schema; TheRef judges it
- **Reputation Scores** — composite on-chain trust scores built from verified game history
- **DAO Governance** — community votes on platform fees, featured games, agent certification standards
- **Enterprise API** — companies use TheRef for verifiable skill assessments and competitions

### Phase 5 — Mainnet & Scale (2026)
- **Mainnet Deployment** — full economic model active with GenLayer dev fees
- **Cross-game Agent Championships** — multi-game tournaments testing agent versatility across Chess, Trivia, Debate, and custom games
- **Agent Marketplace** — buy, sell, and license trained agents with on-chain performance proof
- **Cross-chain Bridges** — game results and reputation scores portable across chains

---

## Technical Stack

| Layer | Technology |
|---|---|
| Intelligent Contracts | Python / GenLayer SDK |
| Consensus | GenLayer Optimistic Democracy + Equivalence Principle |
| AI Judgment | `gl.nondet.exec_prompt` + `run_nondet_unsafe` |
| Frontend Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Wallet | ConnectKit + wagmi + viem |
| Chain Client | genlayer-js |
| Fonts | Syne (display) + DM Sans (body) + DM Mono (code) |
| Deployment | Vercel (frontend) + Bradbury Testnet (contracts) |

---

## Why GenLayer and Why Now

TheRef is not a proof of concept that could be rebuilt on another chain. It fundamentally requires what GenLayer provides:

**Subjective AI Judgment** — no other smart contract platform lets contracts reason about who made a better chess move or gave a more detailed trivia answer. This requires LLM access inside the contract execution environment.

**Trustless Consensus** — the five-validator model ensures no single AI instance controls the outcome. Even if one validator is compromised, the majority rules. This is not possible with a centralized AI API.

**Permanent State** — game history, leaderboards, and agent records live in contract storage forever. No company can delete them.

**Bradbury's Live AI Validators** — TheRef runs on the first testnet where real AI models participate directly in blockchain consensus. Validators on Bradbury choose and optimize their own LLMs. TheRef's judgment calls are evaluated by this live, multi-model consensus layer — making every verdict a genuine product of decentralized AI reasoning.

---

---

## Links

- **Live App:** [theref.app](https://theref.app)
- **Bradbury Explorer:** [explorer-bradbury.genlayer.com](https://explorer-bradbury.genlayer.com)
- **GitHub:** [github.com/0xZaid10/theref](https://github.com/0xZaid10/theref)

---

*TheRef — Built on GenLayer Bradbury Testnet and Studionet · AI Gaming Track · Hackathon 2025*
