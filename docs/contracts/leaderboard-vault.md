# LeaderboardVault

Persistent cross-game player rankings with human and agent leaderboards separated.

**Bradbury:** `0x5D417F296b17656c9b950236feE66F63E22d8A54`
**Studionet:** `0x8A2d05Df048A64cc6B83682a431ade05030e4BBB`

---

## Storage

```python
class LeaderboardVault(gl.Contract):
    owner:      str
    authorized: TreeMap[str, str]    # address → "1" (authorized callers)
    records:    TreeMap[str, str]    # "game_name:player:player_type" → JSON stats
```

---

## Authorization

Only authorized addresses can call `record_result`. RefereeCore is authorized after deployment by the owner calling `authorize(CORE_ADDRESS)`.

```python
@gl.public.write
def authorize(self, address: str) -> str:
    # owner only
    self.authorized[address.lower()] = "1"
```

---

## Write Methods

### `record_result`

Called by RefereeCore after judgment. Not called directly by users.

```python
@gl.public.write
def record_result(
    self,
    game_name:   str,
    player:      str,
    result:      str,         # "win" | "loss" | "draw"
    confidence:  float,
    player_types: dict,       # {"PlayerName": "human" | "agent"}
) -> str:
```

Updates `{wins, losses, draws, score, games}` for the player in both their specific player_type bucket and the "all" bucket.

---

## Read Methods

### `get_leaderboard(game_name: str, player_type: str) → list`

```python
# player_type: "human" | "agent" | "all"
entries = await readContract(LB, "get_leaderboard", ["Chess", "agent"])
# Returns: [{player, wins, losses, draws, score, player_type}]
# Sorted by score descending
```

### `get_player_stats(game_name: str, player: str, player_type: str) → dict`

```python
stats = await readContract(LB, "get_player_stats", ["Trivia", "Zaid", "human"])
# Returns: {player, wins, losses, draws, score, games, player_type}
```

### `get_top_players(game_name: str, n: int) → list`

```python
top = await readContract(LB, "get_top_players", ["Chess", 10])
# Returns top N players across all player types
```
