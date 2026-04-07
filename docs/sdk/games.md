# Every Game. Any Move.

TheRef doesn't have a list of supported games. If a game has moves, TheRef can judge it.

The AI validators read the rules you define at game creation and apply them to whatever moves come in. You describe the game — the validators understand it. The Universal Move Normalizer converts any move format into readable text. The AI does the rest.

The examples below are just that — examples. This is not an exhaustive list. Any game works.

---

## Chess

```typescript
const gameId = await ref.createGame({
  name:      "Chess",
  player1:   "Zaid",
  player2:   "Gen",
  maxRounds: 0,
  rules:     "Standard chess. Moves in algebraic notation. Game ends by checkmate or resignation.",
});

// All formats accepted:
await ref.submitMove(gameId, "Zaid", "e4");
await ref.submitMove(gameId, "Zaid", { from: "e2", to: "e4" });
await ref.submitMove(gameId, "Zaid", { piece: "knight", from: "g1", to: "f3" });
await ref.submitMove(gameId, "Zaid", [6, 0, 5, 2]);
await ref.submitMove(gameId, "Zaid", { uci: "g1f3" });
```

---

## Rock Paper Scissors

```typescript
const gameId = await ref.createGame({
  name:      "Rock Paper Scissors",
  player1:   "Alice",
  player2:   "Bob",
  maxRounds: 5,
  rules:     "Rock beats Scissors. Scissors beats Paper. Paper beats Rock.",
});

// All equivalent:
await ref.submitMove(gameId, "Alice", "Rock");
await ref.submitMove(gameId, "Alice", 0);                  // 0 = Rock
await ref.submitMove(gameId, "Alice", { choice: "Rock" });
```

---

## Trivia

```typescript
const gameId = await ref.createGame({
  name:      "Trivia",
  player1:   "Alice",
  player2:   "Bob",
  maxRounds: 5,
  rules:     "Most detailed and accurate answer wins each round.",
});

await ref.submitMove(gameId, "Alice",
  "The capital of Australia is Canberra, established in 1913."
);
await ref.submitMove(gameId, "Bob", { answer: "Canberra" });
```

---

## Pokemon Battle

```typescript
const gameId = await ref.createGame({
  name:      "Pokemon Battle",
  player1:   "Ash",
  player2:   "Misty",
  maxRounds: 6,
  rules:     "Turn-based Pokemon battle. Judge based on type effectiveness, power, and accuracy.",
});

await ref.submitMove(gameId, "Ash", {
  action: "attack",
  move:   "Thunderbolt",
  target: "Starmie",
  power:  90,
  type:   "Electric",
});
```

---

## Card Games

```typescript
const gameId = await ref.createGame({
  name:      "Card Duel",
  player1:   "Player1",
  player2:   "Player2",
  maxRounds: 5,
  rules:     "Each player plays one card per turn. Higher power wins. Special effects apply.",
});

await ref.submitMove(gameId, "Player1", {
  action:    "play_card",
  card:      "Dragon Slayer",
  power:     850,
  effect:    "destroy_dragon",
  target:    "opponent_creature",
  mana_cost: 5,
});
```

---

## Strategy Games

```typescript
const gameId = await ref.createGame({
  name:      "Warlords",
  player1:   "Commander_A",
  player2:   "Commander_B",
  maxRounds: 10,
  rules:     "Turn-based strategy. Deploy units, move, and attack. Territory control wins.",
});

await ref.submitMove(gameId, "Commander_A", {
  action: "deploy",
  unit:   "Heavy Tank",
  from:   { x: 0, y: 0 },
  to:     { x: 3, y: 4 },
  attack: "Artillery Strike",
});
```

---

## Debate

```typescript
const gameId = await ref.createGame({
  name:      "Debate",
  player1:   "Debater_A",
  player2:   "Debater_B",
  maxRounds: 3,
  rules:     "Judge on logic, evidence, and persuasiveness.",
});

await ref.submitMove(gameId, "Debater_A", {
  position:  "For",
  argument:  "AI regulation is necessary to prevent harm",
  evidence:  "Recent studies show 60% of AI deployments lack safety testing",
  rebuttal:  "Innovation does not require absence of safety standards",
});
```

---

## Don't See Your Game?

That's the point. TheRef is game-agnostic by design.

If you can describe the rules in plain text and express moves in any format — TheRef judges it. No integration work. No special support required.

```typescript
const gameId = await ref.createGame({
  name:    "My Completely New Game",
  rules:   "Describe your rules here. The AI will apply them.",
  player1: "Player1",
  player2: "Player2",
});

await ref.submitMove(gameId, "Player1", yourMoveInAnyFormat);
```

The AI reads your rules. The validators reach consensus. The result goes on-chain.
