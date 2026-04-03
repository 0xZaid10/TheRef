# Architecture

## System Overview

TheRef is composed of five Intelligent Contracts and a Next.js frontend. The contracts are the source of truth — the frontend is a stateless interface that reads from and writes to them.

```
┌─────────────────────────────────────────────────────────────────┐
│                        TheRef Frontend                           │
│              Next.js 14 · TypeScript · Tailwind CSS             │
│         ConnectKit · wagmi · viem · genlayer-js                 │
└──────────────────────────┬──────────────────────────────────────┘
                           │
              writeContract() / readContract()
              via genlayer-js SDK
                           │
┌──────────────────────────▼──────────────────────────────────────┐
│                     GenLayer Network                             │
│                  (Bradbury / Studionet)                          │
│                                                                  │
│  ┌──────────────────┐    ┌─────────────────┐                    │
│  │   RefereeCore    │───►│ LeaderboardVault │                    │
│  │                  │    │                  │                    │
│  │ · start_game     │    │ · record_result  │                    │
│  │ · submit_move    │    │ · get_leaderboard│                    │
│  │ · judge_game     │    │ · get_top_players│                    │
│  │ · end_game       │    └─────────────────┘                    │
│  │ · get_game_state │                                            │
│  └────────┬─────────┘    ┌─────────────────┐                    │
│           │              │ OrganizerRegistry│                    │
│           │              │                  │                    │
│           │              │ · register       │                    │
│           │              │ · is_active      │                    │
│  ┌────────▼─────────┐    └─────────────────┘                    │
│  │ TournamentEngine │                                            │
│  │                  │    ┌─────────────────┐                    │
│  │ · create_tourn.  │    │   FeeManager    │                    │
│  │ · join_tourn.    │    │                  │                    │
│  │ · start_tourn.   │    │ · collect fees  │                    │
│  │ · get_bracket    │    │ · treasury mgmt │                    │
│  └──────────────────┘    └─────────────────┘                    │
│                                                                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │              GenLayer AI Consensus Layer                   │  │
│  │                                                           │  │
│  │  Leader Node ──► exec_prompt ──► judgment JSON            │  │
│  │       │                                                   │  │
│  │  Validator 1 ──► independent evaluation ──► AGREE         │  │
│  │  Validator 2 ──► independent evaluation ──► AGREE         │  │
│  │  Validator 3 ──► independent evaluation ──► AGREE         │  │
│  │  Validator 4 ──► independent evaluation ──► AGREE         │  │
│  │       │                                                   │  │
│  │  Majority AGREE ──► verdict written on-chain              │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Data Flow: Game Lifecycle

### 1. Game Creation
```
User/Agent calls start_game()
    │
    ├── Validate inputs (game name, players, rules)
    ├── If rules == "": call LLM to fetch canonical rules
    │       └── run_nondet_unsafe(_rules_leader, _rules_validator)
    ├── Increment game_count
    ├── Generate base-36 game ID (e.g. "00001")
    ├── Store game state in TreeMap[str, str] (JSON serialized)
    └── Return game ID string
```

### 2. Move Submission
```
Player calls submit_move(game_id, player, move)
    │
    ├── Validate game exists and is active
    ├── Validate player is registered in this game
    ├── If agent-enforced: verify msg.sender == agent wallet
    ├── Find or create current round
    │   ├── If no current round OR both moves already submitted → new round
    │   └── If current round has only one move → add second move
    ├── Update round in TreeMap
    └── Return confirmation
```

### 3. Judgment
```
Anyone calls judge_game(game_id)
    │
    ├── Load game and all pending rounds
    ├── Build history summary from already-judged rounds
    ├── For each batch of up to 5 pending rounds:
    │   ├── Build judgment prompt
    │   ├── run_nondet_unsafe(_leader_fn, _validator_fn)
    │   │   ├── Leader: exec_prompt(prompt, response_format="json")
    │   │   └── Validator: returns True (accepts leader result)
    │   └── Parse judgments JSON
    ├── Apply judgments: update round results, accumulate scores
    ├── Determine game winner if max_rounds reached
    ├── Call LeaderboardVault.record_result() for each player
    └── Update game status: "completed" or "draw"
```

---

## Contract Interaction Map

```
Frontend
  │
  ├──► RefereeCore.start_game()
  ├──► RefereeCore.submit_move()
  ├──► RefereeCore.judge_game()
  │       └──► LeaderboardVault.record_result()  [internal call]
  ├──► RefereeCore.get_game_state()
  ├──► RefereeCore.get_active_games()
  │
  ├──► LeaderboardVault.get_leaderboard()
  ├──► LeaderboardVault.get_top_players()
  │
  ├──► TournamentEngine.create_tournament()
  ├──► TournamentEngine.join_tournament()
  ├──► TournamentEngine.start_tournament()
  ├──► TournamentEngine.record_match_result()
  ├──► TournamentEngine.get_bracket()
  │
  └──► OrganizerRegistry.is_active()
```

---

## Storage Design

All contracts use GenLayer's `TreeMap[str, str]` for primary storage — a persistent key-value store where values are JSON-serialized Python dicts. This allows rich structured data while staying within GenLayer's type system.

### RefereeCore Storage
```python
games:       TreeMap[str, str]   # game_id → JSON game object
rounds:      TreeMap[str, str]   # "game_id:round_number" → JSON round object
game_count:  u64                 # monotonic counter for game ID generation
leaderboard: TreeMap[str, str]   # "game_name:player" → JSON stats object
```

### Key Patterns
```
games["00001"]          → full game state
rounds["00001:1"]       → round 1 of game 00001
rounds["00001:2"]       → round 2 of game 00001
leaderboard["Trivia:Zaid"] → Zaid's Trivia stats
```

---

## Game ID System

Game IDs are base-36 encoded integers, zero-padded to 5 characters.

```python
BASE36 = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ"

def _game_id(n: int) -> str:
    r = ""
    while n > 0:
        r = BASE36[n % 36] + r
        n //= 36
    return r.zfill(5)

# Examples:
# _game_id(1)   → "00001"
# _game_id(10)  → "0000A"
# _game_id(35)  → "0000Z"
# _game_id(36)  → "00010"
```

Frontend conversion for write calls (contract accepts integer):
```typescript
function gidToNum(gid: string): number {
  return parseInt(gid.replace(/^0+/, "") || "0", 36) || 1;
}
```

---

## Scoring System

| Outcome | Points |
|---|---|
| Win | 3.0 |
| Draw | 1.0 |
| Loss | 0.0 |

Scores accumulate across all games for a given game type. The leaderboard sorts by total score descending.

---

## Security Model

### Agent Enforcement
If `agent1` or `agent2` is set to a wallet address, `submit_move` checks `msg.sender` against that address. Only the registered agent wallet can submit moves for that player.

```python
if player == game["player1"] and game["agent1"]:
    if caller != game["agent1"]:
        raise gl.vm.UserError("[EXPECTED] Unauthorized: wrong agent address for player1")
```

### Owner-Only Operations
`set_leaderboard_vault`, `set_fee_manager` are owner-only. `authorize_organizer` on TournamentEngine is owner-only.

### Input Sanitization
All string inputs are stripped and truncated. Rules are capped at 400 chars, move text at 80 chars per round in judgment prompts. This keeps prompts predictable and prevents prompt injection bloat.

### Blocked Game Types
Games involving randomness are rejected at the contract level:
```python
blocked = ["roll a die", "roll dice", "flip a coin", "draw a card",
           "random number", "lottery", "spin the wheel"]
```
