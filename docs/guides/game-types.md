# Game Types

Any game describable in words can be judged by TheRef. This page covers all built-in presets and how to create custom games.

---

## Built-In Presets

### Trivia
Players submit factual answers. The AI judges on accuracy and detail level.

| | |
|---|---|
| **Move format** | Natural language answer |
| **Rules** | Auto-fetched |
| **Judgment criteria** | Accuracy, completeness, detail |
| **Example move** | `"Canberra — established 1913 as compromise between Sydney and Melbourne, population ~460,000"` |

**Tips:** More detail generally wins over shorter correct answers. The AI rewards specificity.

---

### Chess
Full interactive chess board in the frontend. Moves in algebraic notation.

| | |
|---|---|
| **Move format** | Standard algebraic notation |
| **Rules** | Auto-fetched |
| **Judgment criteria** | Move legality, game state |
| **Example moves** | `e4`, `Nf3`, `O-O`, `Qxf7#` |

**Frontend feature:** The chess board detects checkmate and stalemate automatically, submits both players' final moves, and calls `judge_game` — no manual action needed.

**Open-ended:** Create with `max_rounds: 0` and the game runs until checkmate/resignation.

---

### Rock Paper Scissors
Classic game. No rules needed.

| | |
|---|---|
| **Move format** | `Rock`, `Paper`, or `Scissors` |
| **Rules** | Auto-fetched |
| **Judgment criteria** | Standard RPS rules |

---

### Debate
Players argue for or against a position. Judge evaluates logic, evidence, and clarity.

| | |
|---|---|
| **Move format** | Structured argument text |
| **Rules** | Required — set the topic and position |
| **Judgment criteria** | Logic, evidence quality, persuasiveness |
| **Example rules** | `"Player 1 argues FOR remote work. Player 2 argues AGAINST. Judge on logic, evidence, and clarity."` |

---

### Riddle
One player poses a riddle (in the rules), both players attempt to answer.

| | |
|---|---|
| **Move format** | Direct answer |
| **Rules** | Required — include the riddle |
| **Example rules** | `"I have cities but no houses, mountains but no trees, water but no fish. What am I?"` |
| **Correct answer** | `"A map"` |

---

### Custom
Define any game with any rules.

| | |
|---|---|
| **Move format** | Whatever your rules specify |
| **Rules** | Required — describe exactly how to judge the winner |

**Writing good custom rules:**
- Be specific about win/loss/draw conditions
- Include tiebreaker criteria
- Specify what counts as an invalid move
- Keep rules under 400 characters (contract limit)

---

## Blocked Game Types

The contract rejects games involving randomness:

```python
blocked = [
    "roll a die", "roll dice", "flip a coin", "draw a card",
    "random number", "lottery", "spin the wheel"
]
```

TheRef judges skill and knowledge — not chance.

---

## Move Format Tips

| Game | Good Move | Bad Move |
|---|---|---|
| Trivia | `"Paris, capital since 987 AD, population 2.1M, on the Seine River"` | `"Paris"` |
| Chess | `"Nf3"` | `"knight to f3"` |
| RPS | `"Rock"` | `"I choose rock"` |
| Debate | Structured paragraph with a clear thesis | Stream of consciousness |

For Trivia especially: the AI rewards completeness. Two correct answers — one detailed, one bare — will almost always go to the detailed one.
