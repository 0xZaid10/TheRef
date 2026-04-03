# Error Reference

Every error you might encounter, what causes it, and how to fix it.

---

## Contract Errors

Contract errors are prefixed to indicate their type:
- `[EXPECTED]` — user input error, fix your inputs
- `[EXTERNAL]` — LLM returned unexpected output, may retry

### `[EXPECTED] game_name required`
**Cause:** `game_name` is empty or whitespace.
**Fix:** Always pass a non-empty game name.

### `[EXPECTED] player1 required`
**Cause:** `player1` is empty.
**Fix:** Both player names must be non-empty strings.

### `[EXPECTED] Game not found: 00001`
**Cause:** The game ID doesn't exist in storage.
**Fix:** Verify the game ID. For writes, make sure you're passing the integer form (`gidToNum("00001")` = `1`), not the string.

### `[EXPECTED] Game is not active (status: completed)`
**Cause:** Trying to submit a move or judge a game that's already finished.
**Fix:** Check `game.status` before acting. Only `"active"` games accept moves.

### `[EXPECTED] Unauthorized: wrong agent address for player2`
**Cause:** The wallet submitting the move doesn't match the registered `agent2` address.
**Fix:** Use the wallet that was registered when the game was created.

### `[EXPECTED] All N rounds already submitted`
**Cause:** Tried to submit a move when the max_rounds limit is already reached.
**Fix:** Check `game.round_count` vs `game.max_rounds` before submitting.

### `[EXPECTED] Only the game creator can call end_game`
**Cause:** A non-creator wallet called `end_game`.
**Fix:** Only the wallet that called `start_game` can call `end_game`. Anyone can call `judge_game`.

### `[EXPECTED] Games involving dice, cards, or lotteries are not supported`
**Cause:** Game rules contained blocked keywords.
**Fix:** Rephrase rules to avoid: "roll a die", "flip a coin", "draw a card", "random number", "lottery", "spin the wheel".

### `[EXPECTED] Only registered organizers can create tournaments`
**Cause:** Caller is not the contract owner or an authorized organizer.
**Fix:** Contact the TheRef team to get your wallet authorized, or use the deployer wallet.

### `[EXTERNAL] LLM returned non-dict`
**Cause:** The AI returned a non-JSON response.
**Fix:** Usually a transient LLM issue. Retry `judge_game`. If persistent, check that the game rules are clear and unambiguous.

### `[EXTERNAL] Empty judgments from LLM`
**Cause:** AI returned JSON but without a `judgments` array.
**Fix:** Retry. May indicate the prompt was too complex. Consider shorter/simpler rules.

---

## SDK / Frontend Errors

### `Cannot convert undefined to a BigInt`
**Cause:** An `undefined` or `NaN` value was passed as a numeric argument to the contract. The genlayer-js encoder calls `BigInt()` on all numeric args.
**Fix:**
1. Never pass `undefined`, `NaN`, or empty string as a number
2. Use the sanitizer helpers in `contracts.ts`: `int()`, `str()`, `intArr()`
3. For game IDs: always use `gidToNum(gameId)` for writes

### `Consensus main contract not initialized`
**Cause:** Created a bare chain object instead of using `chains.testnetBradbury` or `chains.studionet`.
**Fix:** Always use the SDK's built-in chain:
```typescript
// ✅ Correct
chain: chains.testnetBradbury

// ❌ Wrong
chain: { id: 4221, name: "Bradbury", rpcUrls: { ... } }
```

### `sender does not have enough funds`
**Cause:** The wallet signing the transaction has 0 GEN.
**Fix:**
- On Bradbury: connect your MetaMask wallet with GEN balance
- On Studionet: the dev key may need funding — use `genlayer account send`

### `WalletConnect: Proposal expired`
**Cause:** The WalletConnect session proposal expired before you approved it.
**Fix:** Use the MetaMask browser extension directly instead of WalletConnect QR code. In ConnectKit, select MetaMask directly from the wallet list.

### `invalid calldata input 'undefined'`
**Cause:** Same as BigInt error — `undefined` passed to the encoder.
**Fix:** Check all args for `undefined` before calling `writeContract`.

### `Wallet is on chain X, expected chain Y`
**Cause:** MetaMask is connected to a different network than Bradbury (chain ID 4221).
**Fix:** Add Bradbury Testnet to MetaMask:
```
Network Name: GenLayer Bradbury Testnet
RPC URL: https://rpc-bradbury.genlayer.com
Chain ID: 4221
Symbol: GEN
Explorer: https://explorer-bradbury.genlayer.com
```

---

## Debugging Tips

### Check Game State First
Before any write, read the current game state to verify status, round count, and player info:
```typescript
const game = await read(CORE, "get_game_state", [gameId]);
console.log(JSON.stringify(game, null, 2));
```

### Check Transaction on Explorer
Every write returns a transaction hash. Look it up on the Bradbury explorer to see the full consensus journey, validator votes, and any error output:
`https://explorer-bradbury.genlayer.com/tx/{txHash}`

### Verify Your Chain Client
```typescript
console.log("Chain:", client.chain.name);
console.log("Consensus contract:", client.chain.consensusMainContract?.address);
// Should show "GenLayer Bradbury Testnet" and a valid address
```
