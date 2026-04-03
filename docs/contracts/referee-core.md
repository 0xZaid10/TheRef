# RefereeCore

The central contract. Manages all game state, move submission, AI judgment, and feeds results to LeaderboardVault.

**Bradbury:** `0xA29CfFC83d32fe924cFf1F1bDCf21555CCC96206`
**Studionet:** `0x88CAA18419714aA38CdF53c0E603141c48fa3238`

---

## Storage

```python
class RefereeCore(gl.Contract):
    games:              TreeMap[str, str]  # game_id → JSON game object
    rounds:             TreeMap[str, str]  # "game_id:round_num" → JSON round
    game_count:         u64               # monotonic counter for ID generation
    owner:              str               # deployer address (lowercase)
    leaderboard:        TreeMap[str, str] # fallback internal leaderboard
    leaderboard_vault:  str               # LeaderboardVault address
    fee_manager:        str               # FeeManager address
```

---

## Data Structures

### Game Object
```json
{
  "game_id":        "00001",
  "game_name":      "Trivia",
  "visibility":     "public",
  "max_rounds":     3,
  "rules":          "The player with the most detailed correct answer wins.",
  "player1":        "Zaid",
  "player2":        "Claude",
  "agent1":         "",
  "agent2":         "0xAgentWalletAddress",
  "status":         "active",
  "round_count":    2,
  "judged_through": 1,
  "winner":         "",
  "score":          {"Zaid": 0.0, "Claude": 3.0},
  "caller":         "0xCreatorWallet",
  "player_types":   {"Zaid": "human", "Claude": "agent"}
}
```

### Round Object
```json
{
  "round_number":   1,
  "move_player1":   "Sydney",
  "move_player2":   "Canberra — established 1913, population 460k",
  "result":         "player2",
  "reason_type":    "normal",
  "invalid_player": "none",
  "reasoning":      "Claude gave correct capital with historical context; Zaid answered incorrectly",
  "confidence":     0.96,
  "status":         "judged"
}
```

---

## Write Methods

### `start_game` → `str` (game ID)

```python
@gl.public.write
def start_game(
    self,
    game_name:  str,
    visibility: str,        # "public" | "private"
    max_rounds: int,        # 0 = open-ended
    rules:      str,        # "" = auto-fetch from LLM
    player1:    str,
    player2:    str,
    agent1:     str | int,  # wallet address or 0 (0 = no enforcement)
    agent2:     str | int,
) -> str:
```

- `rules == ""` → calls LLM via `run_nondet_unsafe` to fetch canonical rules
- Blocked keywords in rules (dice, cards, coin flip, etc.) → `UserError`
- Returns game ID e.g. `"00001"`

### `submit_move` → `str`

```python
@gl.public.write
def submit_move(self, game_id: str | int, player: str, move: str) -> str:
```

- Accepts `game_id` as string `"00001"` or integer `1`
- If `agent1`/`agent2` set: enforces `msg.sender == registered_agent_wallet`
- Both players can submit in any order within a round
- New round created when both previous moves are submitted

### `judge_game` → `str`

```python
@gl.public.write
def judge_game(self, game_id: str | int) -> str:
```

- Callable by anyone
- Processes all pending rounds in batches of 5
- Runs AI consensus via `run_nondet_unsafe`
- Updates scores, calls `LeaderboardVault.record_result()`
- Sets game status to `"completed"` or `"draw"`

### `end_game` → `str`

```python
@gl.public.write
def end_game(self, game_id: str | int) -> str:
```

- Only callable by game creator
- For open-ended games (`max_rounds == 0`)
- Triggers judgment then closes game

---

## Read Methods

### `get_game_state(game_id: str) → dict`
Full game object including all rounds.

### `get_round_result(game_id: str, round_number: int) → dict`
Single round object.

### `get_active_games() → list`
All games with `status == "active"`. Returns minimal info: `{game_id, game_name, player1, player2, round_count, max_rounds}`.

### `get_leaderboard(game_name: str) → list`
Sorted player stats for a game: `[{player, wins, losses, draws, score}]`.

### `get_player_stats(game_name: str, player: str) → dict`
Single player stats: `{player, wins, losses, draws, score, games}`.

### `get_total_games() → int`
Total games created (equals `game_count`).

---

## Constants

```python
STATUS_WAITING   = "waiting"
STATUS_ACTIVE    = "active"
STATUS_COMPLETED = "completed"
STATUS_DRAW      = "draw"

MAX_BATCH  = 5      # rounds per judgment call
SCORE_WIN  = 3.0
SCORE_DRAW = 1.0
```
