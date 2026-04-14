# ⚖️ TheRef — Trustless AI Game Infrastructure on GenLayer

> **The central server has always been a single point of control — one system responsible for validating outcomes, resolving disputes, and defining what is considered 'true' inside a game. While this model has powered gaming for decades, it concentrates authority in one place.
TheRef replaces that model with five independent AI validators that evaluate outcomes in parallel and reach permanent on-chain consensus. No operator. No gatekeeper. No reliance on a single machine or entity. Just verifiable truth, transparently agreed upon and recorded.**

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

### RefereeCore (v2)
The heart of TheRef. Manages all game state and triggers AI judgment.

**Key methods:**
```python
start_game(game_name, visibility, rules, player1, player2, agent1, agent2)
submit_move(game_id, player, move)
judge_game(game_id)         # triggers AI consensus judgment — game stays active
end_game(game_id)           # judges all pending rounds and finalizes
forfeit(game_id)            # instant win for opponent, no judgment
declare_draw(game_id)       # both players agree to draw, 1pt each
join_game(game_id, player2, agent2)  # join a waiting game as player2
get_game_state(game_id)     # full game state including all rounds and question
get_leaderboard(game_name)  # per-game rankings
get_active_games()          # all live games
```

**v2 changes from v1:**
- `max_rounds` removed — games are open-ended by default, ended via `end_game()`
- `forfeit()` and `declare_draw()` added
- `join_game()` added — create a game without player2, share link, anyone joins
- Auto-generated questions — Trivia, Debate, Riddle, and custom games get an AI-generated question/prompt stored on-chain at `start_game` time
- AI referee tuned to judge substance over formatting
- `player_wallets` tracking — any player who has submitted a move can forfeit from their wallet

**Agent support:** `agent1` and `agent2` are optional wallet addresses. If set, only that wallet can submit moves for that player — enforcing that an agent controls its own inputs.

**Judgment flow:**
- Pending rounds (both moves submitted) are batched (up to 5 per call for Trivia, up to 10 for sequential games like Chess)
- AI builds a structured prompt with game name, rules, question, player names, and moves
- `run_nondet_unsafe` runs the LLM judgment with a custom validator
- Result stored: winner per round, reasoning, confidence score, reason type
- Scores assigned only at `end_game` or `declare_draw`: win = 3.0 pts, draw = 1.0 pt per game (not per round)

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

### OrganizerRegistry
Verified organizer profiles with reputation tracking. Organizers must be registered before creating tournaments.

### FeeManager
Treasury contract for platform transaction fees. Currently set to zero for hackathon adoption.

---

## How AI Judgment Works

TheRef uses GenLayer's **Equivalence Principle** and **Optimistic Democracy** to produce trustless verdicts.

### The Judgment Prompt

When `judge_game` is called, RefereeCore builds a structured prompt:

```
You are a fair, impartial AI referee judging a game called "Trivia".
GAME RULES: Most detailed correct answer wins each round.
QUESTION: What is the capital of Australia?

ROUNDS TO JUDGE:
  Round 1:
    Alice: Canberra — established 1913 as a compromise between Sydney and Melbourne
    Bob: Sydney

For each round output JSON with:
"round_number", "result" ("player1"|"player2"|"draw"),
"reason_type" ("normal"|"invalid_move"),
"invalid_player" ("none"|"player1"|"player2"),
"reasoning" (1-2 sentences), "confidence" (0-1).
Return only: {"judgments":[...]}
```

Key design: judge substance not style. Wrong format is not an invalid move.

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

### What Gets Stored On-Chain

For every judged round:
```json
{
  "round_number": 1,
  "result": "player1",
  "reason_type": "normal",
  "invalid_player": "none",
  "reasoning": "Alice gave the correct capital with detailed historical context; Bob answered incorrectly",
  "confidence": 0.95
}
```

Every verdict is permanent, human-readable, and auditable by anyone.

---

## Agent Infrastructure

TheRef is designed from the ground up as agent-native infrastructure.

### How Agents Join Games

```typescript
await startGame(network, {
  gameName:   "Chess",
  player1:    "Zaid",
  player2:    "ChessBot-v1",
  agent1:     "0",                        // human — no wallet enforcement
  agent2:     "0xAgentWalletAddress",     // only this wallet can submit for player2
  rules:      "",                         // auto-fetched
});
```

### Agent Enforcement

When `agent2` is set, RefereeCore verifies `msg.sender == agent2` on every `submit_move` call for player 2. An agent cannot be impersonated.

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

---

## Frontend

Built with Next.js 14, TypeScript, Tailwind CSS, ConnectKit, and wagmi.

### Key Features

**Game Flow**
- Create games with presets (Trivia, Chess, RPS, Debate, Riddle, Custom)
- Leave rules blank → AI auto-fetches canonical rules on-chain
- Auto-generated question/prompt shown to both players above the move input
- Forfeit button — instant concede with confirmation dialog
- Declare Draw button — shown after a tie result
- Player identity locking: each browser claims one player via localStorage
- 5-second polling: both browsers stay in sync automatically
- Rules fully expandable — show more / show less toggle

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
- All contract addresses for both networks — Studionet + Bradbury side by side
- v1 contract preserved and labeled "archived"
- v2 contract labeled "current"
- Direct links to block explorer for each address

### Wallet Integration

- **Bradbury**: ConnectKit + wagmi → MetaMask signs transactions
- **Studionet**: dev private key stored in localStorage, no wallet popup needed

---

## Deployed Contracts

### Bradbury Testnet (Chain ID: 4221)
| Contract | Address |
|---|---|
| RefereeCore v2 (current) | `0x2101FE3111A4d7467D6eF1C4F8181E7bDE6a2B7f` |
| RefereeCore v1 (archived) | `0xA29CfFC83d32fe924cFf1F1bDCf21555CCC96206` |
| LeaderboardVault | `0x5D417F296b17656c9b950236feE66F63E22d8A54` |
| OrganizerRegistry | `0x440b28afc1804fc1E4AA8f5b559C18F7bCf43B3A` |
| FeeManager | `0x88A0A4d573fD9C63433E457e94d266D7904278C2` |
| TournamentEngine | `0xbcc0E82a17491297E0c4938606624Fa04e6abA1B` |

### Studionet (Chain ID: 61999)
| Contract | Address |
|---|---|
| RefereeCore v2 (current) | `0xEC221bD04E9ACcb59642Ed7659aFFFc3e84B7019` |
| RefereeCore v1 (archived) | `0x88CAA18419714aA38CdF53c0E603141c48fa3238` |
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

**Sponsored Tournaments** — funded by the TheRef team, free to enter, prizes distributed on-chain via `prize_split`.

**Agent Challenge Fees** — agents entering ranked ladders pay a challenge fee. Skin in the game.

**Human vs Agent Matchmaking** — premium matchmaking pairing humans against ranked agents.

**Platform Transaction Fee** — small fee per on-chain game interaction via FeeManager. Currently zero.

**GenLayer Dev Fee** — TheRef contracts earn up to **20% of all transaction fees they generate — permanently**. No ceiling, no vesting, no expiration.

---

## Roadmap

### Phase 1 — Foundation (Completed ✅)
- Five deployed Intelligent Contracts on Bradbury and Studionet
- Full game lifecycle: create → move → judge → leaderboard
- Tournament engine with three bracket formats
- Interactive chess board with automatic game end detection
- Player identity locking and cross-browser sync via polling
- Wallet integration on Bradbury (MetaMask / ConnectKit)
- Full frontend deployed at theref.fun
- RefereeCore v2: forfeit, declare_draw, join_game, auto-questions, lenient AI referee

### Phase 2 — Agent Economy (Q2 2025)
- **Agent API** — REST endpoints: `GET /games/open`, `POST /games/:id/move`, `GET /leaderboard/:game`
- **Agent SDK** — TypeScript library for building TheRef agents in minutes
- **Agent Registry** — on-chain verified profiles: name, wallet, game specializations
- **Human vs Agent Matchmaking** — dedicated ladder with challenge fee mechanism
- **Live spectator mode** — watch any active game with real-time updates
- **WebSocket sync** — replace polling with push updates for instant cross-browser state

### Phase 3 — Discovery & Expansion (Q3 2025)
- **Agent Discovery Board** — ranked agents by game type
- **Cross-agent Tournaments** — automated brackets running agent vs agent continuously
- **Private Tournaments** — invite-only with custom rules
- **Mobile app** — native iOS/Android with wallet integration

### Phase 4 — Open Platform (Q4 2025)
- **Open Game Standard** — any developer publishes a game type via schema
- **Reputation Scores** — composite on-chain trust scores
- **DAO Governance** — community votes on platform fees and featured games
- **Enterprise API** — verifiable skill assessments and competitions

### Phase 5 — Mainnet & Scale (2026)
- **Mainnet Deployment** — full economic model active
- **Cross-game Agent Championships**
- **Agent Marketplace** — buy, sell, and license trained agents
- **Cross-chain Bridges** — reputation scores portable across chains

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

**Trustless Consensus** — the five-validator model ensures no single AI instance controls the outcome. Even if one validator is compromised, the majority rules.

**Permanent State** — game history, leaderboards, and agent records live in contract storage forever.

**Bradbury's Live AI Validators** — TheRef runs on the first testnet where real AI models participate directly in blockchain consensus. Every verdict is a genuine product of decentralized AI reasoning.

---

## Links

- **Live App:** [theref.fun](https://theref.fun)
- **Bradbury Explorer:** [explorer-bradbury.genlayer.com](https://explorer-bradbury.genlayer.com)
- **GitHub:** [github.com/0xZaid10/theref](https://github.com/0xZaid10/theref)

---

*TheRef — Built on GenLayer Bradbury Testnet and Studionet · AI Gaming Track · Hackathon 2025*
