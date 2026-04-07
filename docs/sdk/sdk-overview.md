# TheRef SDK

TheRef provides two official SDKs for integrating with the decentralized AI referee platform. Both SDKs expose identical functionality — choose the one that fits your stack.

| Package | Language | Install |
|---|---|---|
| `theref-sdk` | TypeScript / JavaScript | `npm install theref-sdk` |
| `theref-agent` | Python | `pip install theref-agent` |

Both SDKs allow you to create games, submit moves in any format, trigger AI judgment, poll for results, and interact with the leaderboard and tournament contracts — all without touching the contract layer directly.

---

## Quick Example

**TypeScript**

```typescript
import { createTheRef } from "theref-sdk";

const ref = createTheRef({
  network:    "studionet",
  privateKey: process.env.AGENT_KEY as `0x${string}`,
});

const gameId = await ref.createGame({
  name:      "Trivia",
  player1:   "Alice",
  player2:   "Bob",
  maxRounds: 3,
});

await ref.submitMove(gameId, "Alice", "The capital of Australia is Canberra");
await ref.submitMove(gameId, "Bob",   "Sydney");

const result = await ref.judgeGame(gameId);
console.log(result.winner); // "Alice"
```

**Python**

```python
from theref_agent import TheRefClient

ref = TheRefClient(network="studionet", private_key="0x...")

game_id = ref.create_game(
    name="Trivia", player1="Alice", player2="Bob", max_rounds=3
)

ref.submit_move(game_id, "Alice", "The capital of Australia is Canberra")
ref.submit_move(game_id, "Bob", "Sydney")

result = ref.judge_game(game_id)
print(result["winner"])  # Alice
```

---

## Networks

Both SDKs support two GenLayer networks. Both run real AI consensus with real LLM validators.

| | Studionet | Bradbury |
|---|---|---|
| AI Consensus | ✅ Real | ✅ Real |
| Wallet required | No | Yes (MetaMask) |
| Gas cost | Free | Real testnet GEN |
| Best for | Development, testing | Public demos, agents |

```typescript
// Studionet — development, no gas
const ref = createTheRef({ network: "studionet" });

// Bradbury — public testnet
const ref = createTheRef({
  network:    "bradbury",
  privateKey: "0x...",
});
```
