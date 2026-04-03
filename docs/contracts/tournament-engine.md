# TournamentEngine

Full tournament bracket management with three formats: Single Elimination, Round Robin, and Swiss.

**Bradbury:** `0xbcc0E82a17491297E0c4938606624Fa04e6abA1B`
**Studionet:** `0x44f7c1bDa293B9cdBD79a6dfb66bD45696dEa4A6`

---

## Storage

```python
class TournamentEngine(gl.Contract):
    owner:       str
    authorized:  TreeMap[str, str]   # authorized organizer wallets
    tournaments: TreeMap[str, str]   # tid → JSON tournament object
    count:       u64
```

---

## Tournament Object

```json
{
  "tid":              "T00001",
  "name":             "Bradbury Trivia Cup",
  "game_name":        "Trivia",
  "format":           "single_elimination",
  "max_players":      4,
  "entry_fee_wei":    0,
  "prize_pool_wei":   0,
  "prize_split":      [70, 30],
  "rules":            "Best answer wins.",
  "rounds_per_match": 1,
  "organizer":        "0xOrganizerWallet",
  "status":           "registration",
  "players":          ["Alice", "Bob", "Charlie", "Diana"],
  "bracket":          [],
  "current_round":    0,
  "match_count":      0,
  "winner":           ""
}
```

## Formats

| Format | Value | Description |
|---|---|---|
| Single Elimination | `"single_elimination"` | Lose once, eliminated. Bracket until final. |
| Round Robin | `"round_robin"` | Everyone plays everyone. Most points wins. |
| Swiss | `"swiss"` | Paired by standings each round. No eliminations. |

---

## Write Methods

### `create_tournament`

```python
@gl.public.write
def create_tournament(
    self,
    name:            str,
    game_name:       str,
    format:          str,   # "single_elimination" | "round_robin" | "swiss"
    max_players:     int,   # minimum 2
    entry_fee_wei:   int,   # 0 for free tournaments
    prize_split:     list,  # e.g. [70, 30] — must sum to ≤ 100
    rules:           str,
    rounds_per_match: int,
) -> str:               # returns tournament ID e.g. "T00001"
```

Requires caller to be an authorized organizer or the contract owner.

### `join_tournament`

```python
@gl.public.write
def join_tournament(self, tid: str, player_name: str, player_type: str) -> str:
# player_type: "human" | "agent"
```

### `start_tournament`

```python
@gl.public.write
def start_tournament(self, tid: str) -> str:
```

Generates bracket from registered players. Requires minimum 2 players. Sets status to `"active"`.

### `record_match_result`

```python
@gl.public.write
def record_match_result(self, tid: str, match_id: int, winner: str) -> str:
```

Records winner for a bracket match. If all matches complete, sets tournament status to `"completed"` and records overall winner.

---

## Read Methods

### `get_tournament(tid: str) → dict`
Full tournament object.

### `get_bracket(tid: str) → list`
Array of match objects: `[{match_id, round, player1, player2, game_id, winner, status}]`.

### `get_standings(tid: str) → list`
Player standings: `[{player, address, type, wins, losses, draws, points, eliminated}]`.

### `list_tournaments() → list`
All tournaments with summary info.

### `get_total() → int`
Total tournament count.
