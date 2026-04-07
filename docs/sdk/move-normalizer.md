# Universal Move Normalizer

The move normalizer is the core of the TheRef SDK. It converts any move format — string, object, array, number, or deeply nested structure — into a clean, readable string that the AI judge can understand.

You never need to call it directly. It runs automatically inside `submitMove()` / `submit_move()`. But you can use it standalone to test normalization without submitting.

---

## How It Works

When you call `submitMove()`, the SDK:

1. Receives your move in any format
2. Detects the game type from the hint (or auto-detects from structure)
3. Runs the appropriate adapter
4. Sends the normalized string to the contract
5. Returns both the `txHash` and the `normalizedMove` so you can see exactly what was sent

---

## Supported Input Formats

### Strings — passthrough

Any string is sent as-is.

```typescript
"e4"
"The capital of Australia is Canberra"
"I choose Rock"
"Attack the north"
"I resign."
```

### Numbers

```typescript
42          → "42"
3.14        → "3.14"

// With RPS hint:
0           → "Rock"
1           → "Paper"
2           → "Scissors"
```

### Booleans

```typescript
true   → "Yes"
false  → "No"
```

### Null / None

```typescript
null       → "No move"
undefined  → "No move"
None       → "No move"  // Python
```

---

## Game Adapters

### Chess

Handles algebraic notation, move objects, coordinate arrays, and UCI format.

```typescript
// Algebraic string — passthrough
"e4"                              → "e4"
"Nf3"                             → "Nf3"
"O-O"                             → "O-O"

// Move object {from, to}
{ from: "e2", to: "e4" }          → "e2e4"

// With piece
{ piece: "knight", from: "g1", to: "f3" }  → "Nf3"

// With promotion
{ from: "e7", to: "e8", promotion: "q" }   → "e7e8=Q"

// UCI format
{ uci: "e2e4" }                   → "e2-e4"

// Coordinate array [fromFile, fromRank, toFile, toRank]
[4, 1, 4, 3]                      → "e2-e4"
[6, 0, 5, 2]                      → "g1-f3"
```

### Rock Paper Scissors

```typescript
// Strings (case-insensitive)
"rock"                    → "Rock"
"paper"                   → "Paper"
"scissors"                → "Scissors"
"stone"                   → "Rock"    // alias

// Numbers (with RPS hint)
0                         → "Rock"
1                         → "Paper"
2                         → "Scissors"

// Objects
{ choice: "paper" }       → "Paper"
{ action: "rock" }        → "Rock"
{ move: "scissors" }      → "Scissors"
{ pick: "paper" }         → "Paper"

// Extended variants
"lizard"                  → "Lizard"
"spock"                   → "Spock"
```

### Combat Games

Handles RPG attacks, Pokemon moves, fighting game combos, and card games.

```typescript
// Pokemon / RPG attack
{
  action: "attack",
  move:   "Thunderbolt",
  target: "Charizard",
  power:  90,
  type:   "Electric",
}
→ "uses Thunderbolt on Charizard (power: 90) [Electric type]"

// Fighting game combo
{
  character: "Ryu",
  special:   "Hadouken",
  combo:     ["down", "forward", "punch"],
}
→ "Ryu uses Hadouken via combo: down+forward+punch special: Hadouken"

// Card game
{
  card:      "Fireball",
  target:    "enemy_hero",
  mana_cost: 4,
}
→ "uses Fireball on enemy_hero (mana: 4)"

// RPG spell
{
  spell:    "Blizzard",
  target:   "Dragon",
  damage:   200,
  element:  "Ice",
}
→ "uses Blizzard on Dragon (damage: 200) [Ice]"
```

**Recognized combat fields:**
`move`, `skill`, `ability`, `spell`, `card`, `action`, `attack` → action verb
`target`, `enemy`, `opponent` → target
`power`, `damage`, `mana_cost` → modifiers
`type`, `element` → type tags
`combo` → combo string
`special` → special move name
`position` → position

### Strategy / Board Games

Handles unit commands, deployments, and movement orders.

```typescript
// Deploy command
{
  action: "deploy",
  unit:   "Tank",
  from:   { x: 2, y: 3 },
  to:     { x: 5, y: 7 },
}
→ "deploy Tank from {"x":2,"y":3} to {"x":5,"y":7}"

// Attack order
{
  command: "advance",
  unit:    "Infantry",
  attack:  "Artillery",
}
→ "advance Infantry attacking with Artillery"

// Build
{
  action:   "build",
  building: "Barracks",
  position: { x: 4, y: 2 },
}
→ "build Barracks at {"x":4,"y":2}"
```

**Recognized strategy fields:**
`action`, `command`, `order` → verb
`unit`, `troop`, `building` → entity (required for strategy detection)
`from`, `to` (as objects) → movement
`position`, `target`, `location` → placement
`attack`, `defend` → combat modifiers
`resource` → cost

### Trivia / Q&A

```typescript
{ answer: "Canberra" }            → "Canberra"
{ response: "Paris" }             → "Paris"
{ text: "42" }                    → "42"
{ value: "Mount Everest" }        → "Mount Everest"
```

### Debate / Argument

```typescript
{
  position:  "For",
  argument:  "AI benefits humanity",
  evidence:  "Studies show productivity gains",
  rebuttal:  "Counterpoint addressed",
}
→ "Position: For. Argument: AI benefits humanity. Evidence: Studies show productivity gains. Rebuttal: Counterpoint addressed."
```

### Arrays

```typescript
["Attack", "North"]                     → "Attack, North"
["Rock", "beats", "Scissors"]           → "Rock, beats, Scissors"
[{ piece: "Knight" }, "moves", "to f3"] → "piece: Knight, moves, to f3"
```

### Generic Objects

Any object that doesn't match a specific adapter is flattened into a readable key-value string.

```typescript
{
  turn:     5,
  decision: "advance",
  units:    ["Archer", "Knight"],
  target:   { zone: "north", priority: "high" },
}
→ "turn: 5, decision: advance, units: [Archer, Knight], target.zone: north, target.priority: high"
```

---

## Detection Order

When no game hint is provided, the normalizer tries adapters in this order:

1. Chess (string algebraic or `{from, to}` with string values)
2. RPS (known choice words or numbers with RPS hint)
3. Strategy (has `unit`/`troop`/`building` field, or object `from`/`to`)
4. Combat (has `move`/`skill`/`spell`/`card`/`action` field)
5. Trivia (has `answer`/`response`/`text`/`value` field)
6. Debate (has `position`/`argument` field)
7. Array join
8. Generic object flatten
9. String fallback

---

## Using the Normalizer Standalone

**TypeScript**

```typescript
import { normalizeMove } from "theref-sdk";

const result = normalizeMove({ from: "e2", to: "e4" }, "Chess");
console.log(result.text);    // "e2e4"
console.log(result.adapter); // "chess"
console.log(result.raw);     // { from: "e2", to: "e4" }

const rps = normalizeMove(0, "RPS");
console.log(rps.text);       // "Rock"
console.log(rps.adapter);    // "rps"

const combat = normalizeMove({
  move:   "Thunderbolt",
  target: "Pikachu",
  power:  90,
});
console.log(combat.text);    // "uses Thunderbolt on Pikachu (power: 90)"
console.log(combat.adapter); // "combat"
```

**Python**

```python
from theref_agent.normalizer import normalize_move

result = normalize_move({"from": "e2", "to": "e4"}, "Chess")
print(result["text"])    # "e2e4"
print(result["adapter"]) # "chess"

rps = normalize_move(0, "RPS")
print(rps["text"])       # "Rock"

combat = normalize_move({
    "move":   "Thunderbolt",
    "target": "Pikachu",
    "power":  90,
})
print(combat["text"])    # "uses Thunderbolt on Pikachu (power: 90)"
```

---

## NormalizedMove Type

```typescript
interface NormalizedMove {
  raw:     AnyMove;  // original input
  text:    string;   // normalized string sent to contract
  adapter: string;   // which adapter processed it
}

// adapter values:
// "passthrough" | "chess" | "rps" | "combat" | "strategy"
// "trivia" | "debate" | "array" | "generic-object"
// "number" | "boolean" | "null" | "fallback"
```

---

## Game Hint Reference

Pass a `gameHint` string to help the normalizer pick the right adapter faster.

| Game | Hint keywords |
|---|---|
| Chess | `"Chess"` |
| Rock Paper Scissors | `"RPS"`, `"Rock Paper Scissors"` |
| Trivia / Q&A | `"Trivia"`, `"Quiz"` |
| Debate | `"Debate"`, `"Argument"` |
| Combat / Pokemon | `"Pokemon Battle"`, `"Combat"` |
| Strategy | `"Strategy"`, `"RTS"` |
| Any other | omit hint — auto-detect |
