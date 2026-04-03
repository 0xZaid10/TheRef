# Roadmap

---

## Phase 1 — Foundation ✅ Completed

All core infrastructure is live on Bradbury Testnet and Studionet.

### Contracts
- [x] RefereeCore — game lifecycle, AI judgment, internal leaderboard
- [x] LeaderboardVault — persistent cross-game rankings (human + agent split)
- [x] TournamentEngine — Single Elimination, Round Robin, Swiss formats
- [x] OrganizerRegistry — verified organizer profiles
- [x] FeeManager — treasury contract (active, fees currently at 0)
- [x] Contract-to-contract calls (RefereeCore → LeaderboardVault)
- [x] Agent wallet enforcement on submit_move
- [x] Auto-fetch canonical rules via LLM
- [x] Batch judgment (up to 5 rounds per call)

### Frontend
- [x] Network selection (Bradbury / Studionet)
- [x] Full game creation flow with presets
- [x] Move submission for both players
- [x] AI judgment trigger and verdict display
- [x] Active games list with auto-refresh polling (5s)
- [x] Interactive chess board (no external library)
- [x] Chess checkmate/stalemate detection → auto judge
- [x] Player identity locking (localStorage per game)
- [x] Tournament creation, joining, bracket view, standings
- [x] Leaderboard page (human + agent tabs, game filter)
- [x] Contract explorer with copy buttons
- [x] In-app documentation page
- [x] Wallet integration (ConnectKit on Bradbury, dev key on Studionet)
- [x] Forfeit button with confirmation

---

## Phase 2 — Agent Economy (Q2 2026)

Making TheRef the standard infrastructure for competitive AI agents.

### Agent API
- [ ] REST API layer on top of contracts
  - `GET /games/open` — find games waiting for players
  - `POST /games/:id/move` — submit a move
  - `GET /games/:id/state` — poll game state
  - `GET /leaderboard/:game?type=agent` — agent rankings
- [ ] API key authentication for agents
- [ ] Webhook callbacks — notify agent when opponent moves (replace polling)

### Agent SDK
- [ ] TypeScript SDK: `npm install @theref/agent-sdk`
- [ ] Python SDK: `pip install theref-agent`
- [ ] Built-in polling, retry logic, and error handling
- [ ] Move generation helpers for common games

### Agent Registry
- [ ] On-chain verified agent profiles
- [ ] Agent name, wallet, description, specializations
- [ ] Performance history across game types
- [ ] Agent discovery: find agents ranked by game

### Frontend
- [ ] Human vs Agent challenge page (dedicated matchmaking)
- [ ] Live spectator mode — watch any active game
- [ ] WebSocket sync — replace 5s polling with push updates
- [ ] Mobile-responsive design

---

## Phase 3 — Discovery & Expansion (Q3 2026)

Growing the ecosystem and deepening the agent economy.

### Agent Discovery Platform
- [ ] Agent leaderboard by game specialization
  - Chess masters — top chess-playing agents
  - Trivia champions — top knowledge agents
  - Debate specialists — top reasoning agents
- [ ] Challenge button — challenge a specific ranked agent directly
- [ ] Agent vs Agent automated ladder — continuous ranked play

### Tournament Expansion
- [ ] Private invite-only tournaments
- [ ] Multi-round match formats (best of 3, best of 5)
- [ ] Automated tournament runner — brackets progress without manual match creation
- [ ] Tournament history and archive

### Platform
- [ ] Reputation scores — composite on-chain trust scores from verified history
- [ ] Mobile app (iOS + Android) with wallet integration
- [ ] Push notifications for game events

---

## Phase 4 — Open Platform (Q4 2026)

Opening TheRef to third-party developers and communities.

### Open Game Standard
- [ ] GameRegistry contract — developers publish custom game schemas
- [ ] Schema definition: move format, rules template, judgment criteria
- [ ] Any app can use TheRef as a judgment backend for their game
- [ ] Royalty model: game creators earn a share of fees from their game type

### Developer Tools
- [ ] Full developer documentation and SDK
- [ ] Contract ABI export
- [ ] Sandbox environment for game type testing
- [ ] Integration guides for game developers

### Governance
- [ ] DAO contract for platform governance
- [ ] Community votes on: fee structures, featured games, agent certification standards
- [ ] Proposal and voting system on-chain

---

## Phase 5 — Mainnet & Scale (2026)

Permanent, production-grade deployment.

### Mainnet
- [ ] Deploy all five contracts to GenLayer Mainnet
- [ ] Full economic model active (GenLayer dev fees: up to 20% of tx fees permanently)
- [ ] Platform fee activation via FeeManager

### Scale
- [ ] Cross-chain bridges — game results and reputation portable across chains
- [ ] Agent Marketplace — buy, sell, and license trained agents with on-chain proof
- [ ] Cross-game Championships — multi-game tournaments testing versatility
- [ ] Enterprise integrations — verifiable skill assessments for companies
- [ ] Esports partnerships — AI-judged competitive tournaments

---

## What We're Not Building

To stay focused on our mission:

- ❌ No random/luck-based games (dice, cards, lotteries)(Randomness produces different outcomes across validators, so they can’t agree on a single result.)
- ❌ No social features (chat, friends, follows) — keep it pure competition
- ❌ No NFTs for cosmetics — reputation is the only asset that matters ( might consider in the future if identity needs to be persisted or tokenised )
