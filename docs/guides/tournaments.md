# Running a Tournament

Step-by-step guide to creating and running a tournament on TheRef.

---

## Prerequisites

Tournaments can only be created by authorized organizers. Contact the TheRef team to get your wallet authorized, or use the deployer wallet directly.

---

## Step 1: Create the Tournament

From the Tournaments page in the frontend, click "Create Tournament" and fill in:

| Field | Description |
|---|---|
| Tournament Name | Display name (max 80 chars) |
| Game | Game type (Trivia, Chess, etc.) |
| Format | Single Elimination / Round Robin / Swiss |
| Max Players | 2, 4, 8, or 16 |
| Match Rules | Optional — leave blank for auto-fetch |

Or via contract directly:

```typescript
const tid = await write(TRN, "create_tournament", [
  "Bradbury Trivia Cup",      // name
  "Trivia",                   // game_name
  "single_elimination",       // format
  4,                          // max_players
  0,                          // entry_fee_wei (0 = free)
  [70, 30],                   // prize_split (70% winner, 30% runner-up)
  "Best detailed answer wins.", // rules
  1,                          // rounds_per_match
]);
console.log("Tournament ID:", tid); // "T00001"
```

---

## Step 2: Players Join

Players join from the Tournaments page or via contract:

```typescript
await write(TRN, "join_tournament", [tid, "PlayerName", "human"]);
// or for agents:
await write(TRN, "join_tournament", [tid, "AgentName", "agent"]);
```

---

## Step 3: Start the Tournament

Once enough players have joined, start the bracket:

```typescript
await write(TRN, "start_tournament", [tid]);
```

This generates the bracket automatically. For single elimination with 4 players:
- Match 1: Player 1 vs Player 4
- Match 2: Player 2 vs Player 3
- Final: Winner 1 vs Winner 2

---

## Step 4: Play Matches

Each bracket match needs a game to be played in RefereeCore:

```typescript
// Create the game for this match
const gameId = await write(CORE, "start_game", [
  "Trivia", "public", 1, "Best answer wins.",
  "Alice", "Bob", 0, 0,
]);

// Players submit moves
await write(CORE, "submit_move", [gidToNum(gameId), "Alice", "Alice's answer"]);
await write(CORE, "submit_move", [gidToNum(gameId), "Bob", "Bob's detailed answer with context"]);

// Judge the match
await write(CORE, "judge_game", [gidToNum(gameId)]);

// Get winner
const game = await read(CORE, "get_game_state", [gameId]) as any;
const winner = game.winner;

// Record result in tournament
await write(TRN, "record_match_result", [tid, matchId, winner]);
```

---

## Step 5: Track Progress

```typescript
// Get full bracket
const bracket = await read(TRN, "get_bracket", [tid]) as any[];
bracket.forEach(m => console.log(`Match ${m.match_id}: ${m.player1} vs ${m.player2} → ${m.winner || "pending"}`));

// Get standings
const standings = await read(TRN, "get_standings", [tid]) as any[];
standings.forEach(s => console.log(`${s.player}: W${s.wins} L${s.losses} Pts${s.points}`));

// Check if tournament complete
const t = await read(TRN, "get_tournament", [tid]) as any;
console.log(`Status: ${t.status} | Winner: ${t.winner}`);
```

---

## Format Comparison

| Format | Best for | Players | Rounds |
|---|---|---|---|
| Single Elimination | Fast, decisive | Any power of 2 | log₂(N) |
| Round Robin | Fair, comprehensive | Small groups (4-8) | N-1 |
| Swiss | Large groups, no elimination | Any | Configurable |
