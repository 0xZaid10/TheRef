# Supported Game Types

TheRef supports any game where moves can be expressed as text. The AI judge reads the game rules you provide and evaluates moves accordingly.

Below are common game types with SDK examples.

---

## Chess

```typescript
const gameId = await ref.createGame({
  name:      "Chess",
  player1:   "Zaid",
  player2:   "Gen",
  maxRounds: 0, // open-ended
  rules:     "Standard chess. Moves in algebraic notation. Game ends by checkmate or resignation.",
});

// Multiple accepted formats:
await ref.submitMove(gameId, "Zaid", "e4");
await ref.submitMove(gameId, "Zaid", { from: "e2", to: "e4" });
await ref.submitMove(gameId, "Zaid", { piece: "knight", from: "g1", to: "f3" });
await ref.submitMove(gameId, "Zaid", [6, 0, 5, 2]); // coordinate array
await ref.submitMove(gameId, "Zaid", { uci: "g1f3" }); // UCI format
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
await ref.submitMove(gameId, "Alice", "rock");
await ref.submitMove(gameId, "Alice", 0);                // number
await ref.submitMove(gameId, "Alice", { choice: "Rock" }); // object
```

---

## Trivia

```typescript
const gameId = await ref.createGame({
  name:      "Trivia",
  player1:   "Alice",
  player2:   "Bob",
  maxRounds: 5,
  rules:     "Most detailed and accurate answer wins each round. Partial credit for incomplete answers.",
});

await ref.submitMove(gameId, "Alice",
  "The capital of Australia is Canberra, established in 1913 as a compromise between Sydney and Melbourne."
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
  rules:     `Turn-based Pokemon battle. Each player selects one move per turn.
               Judge based on type effectiveness, power, and accuracy.
               Invalid moves lose the round.`,
});

await ref.submitMove(gameId, "Ash", {
  action:  "attack",
  move:    "Thunderbolt",
  target:  "Starmie",
  power:   90,
  type:    "Electric",
});

await ref.submitMove(gameId, "Misty", {
  action: "defend",
  move:   "Barrier",
  target: "self",
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
  rules:     "Each round, players argue for their assigned position. Judge on logic, evidence, and persuasiveness.",
});

await ref.submitMove(gameId, "Debater_A", {
  position:  "For",
  argument:  "AI regulation is necessary to prevent harm",
  evidence:  "Recent studies show 60% of AI deployments lack safety testing",
  rebuttal:  "Innovation does not require absence of safety standards",
});
```

---

## Custom Games

Any game works. Just define the rules clearly:

```typescript
const gameId = await ref.createGame({
  name:  "My Custom Game",
  rules: `This is a word association game.
           Each player submits one word per round.
           The word must relate to the previous word.
           The player whose word is more creative and connected wins the round.
           Completely unrelated words lose automatically.`,
  player1:   "Player1",
  player2:   "Player2",
  maxRounds: 5,
});

await ref.submitMove(gameId, "Player1", "Ocean");
await ref.submitMove(gameId, "Player2", "Waves");
```

The AI judge reads your rules and applies them. The clearer the rules, the more consistent the judgments.
