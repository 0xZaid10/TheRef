# Frontend

TheRef's frontend is a Next.js 14 application using the App Router. It is entirely stateless — all data lives in the contracts. The frontend reads from and writes to contracts via `genlayer-js`.

---

## Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Wallet | ConnectKit + wagmi + viem |
| Chain Client | genlayer-js |
| Fonts | Syne (display) · DM Sans (body) · DM Mono (mono) |

---

## Project Structure

```
src/
├── app/
│   ├── layout.tsx           # Root layout — Providers wrapper
│   ├── page.tsx             # Network selection landing page
│   ├── globals.css          # CSS variables, base styles
│   ├── providers.tsx        # WalletProvider + NetworkProvider
│   └── (app)/               # App route group (requires network selection)
│       ├── layout.tsx       # App layout — Header + auth guard
│       ├── home/page.tsx    # Dashboard with stats
│       ├── play/page.tsx    # Game creation and active games
│       ├── leaderboard/page.tsx
│       ├── tournaments/page.tsx
│       ├── explorer/page.tsx # Contract addresses
│       └── docs/page.tsx    # Documentation
├── components/
│   ├── layout/
│   │   ├── Header.tsx       # Navigation + wallet button
│   │   └── NetworkBadge.tsx # Current network indicator
│   ├── game/
│   │   ├── StartGameForm.tsx # Game creation form
│   │   ├── GameView.tsx     # Full game UI with polling
│   │   ├── GameCard.tsx     # Game list item
│   │   ├── MoveInput.tsx    # Text move submission
│   │   ├── ChessGame.tsx    # Interactive chess board
│   │   ├── JudgeButton.tsx  # Trigger judgment
│   │   └── VerdictDisplay.tsx # Verdict rendering
│   ├── tournament/
│   │   ├── CreateTournamentForm.tsx
│   │   ├── TournamentCard.tsx
│   │   ├── BracketView.tsx
│   │   └── Standings.tsx
│   ├── leaderboard/
│   │   ├── LeaderboardTable.tsx
│   │   └── PlayerStats.tsx
│   ├── explorer/
│   │   └── ContractCard.tsx
│   ├── network/
│   │   └── NetworkCard.tsx
│   └── ui/
│       ├── Button.tsx
│       ├── Card.tsx
│       ├── Badge.tsx
│       ├── Input.tsx        # Input, Textarea, Select
│       ├── Modal.tsx
│       └── Spinner.tsx      # Spinner, PageLoader, TxPending, LoadingRow
├── context/
│   ├── NetworkContext.tsx   # Current network state + localStorage
│   └── WalletContext.tsx    # wagmi + ConnectKit providers
├── lib/
│   ├── genlayer.ts         # genlayer-js client initialization
│   ├── contracts.ts        # All contract call wrappers
│   └── utils.ts            # Helpers: cn, gidToNum, formatScore, etc.
└── config/
    └── networks.ts          # Network configs + contract addresses
```

---

## Key Design Decisions

### Client Initialization (Critical)

The genlayer-js client **must** use the SDK's built-in chain objects:

```typescript
// ✅ CORRECT — built-in chain has consensusMainContract populated
const client = createClient({
  chain:    chains.testnetBradbury,
  endpoint: network.rpc,
  account,
});

// ❌ WRONG — bare chain object missing consensusMainContract
// All writes will fail with "Cannot convert undefined to a BigInt"
const client = createClient({
  chain: { id: 4221, name: "Bradbury", rpcUrls: { ... } },
  endpoint: network.rpc,
  account,
});
```

### Wallet vs Dev Key

```typescript
// Bradbury — wallet signs via MetaMask/ConnectKit
// Pass wallet ADDRESS STRING (not account object) so SDK routes through window.ethereum
if (network.walletEnabled) {
  const walletAddress = await getWalletAddress(); // from window.ethereum
  return createClient({ chain, endpoint, account: walletAddress });
}

// Studionet — dev private key in localStorage, no wallet needed
const privateKey = getDevPrivateKey(); // from localStorage
const account    = createAccount(privateKey);
return createClient({ chain, endpoint, account });
```

### Player Identity Locking

To prevent one browser controlling both players:

```typescript
// On first game view, player claims their identity
localStorage.setItem(`theref_player_${gameId}`, playerName);

// On reload, identity is restored
const claimedPlayer = localStorage.getItem(`theref_player_${gameId}`);
```

The game view shows a picker ("Who are you?") before revealing the move input. After claiming, the browser is locked to that player for the game lifetime.

### Polling for Live Updates

```typescript
// Poll every 5s while game is active
useEffect(() => {
  const poll = setInterval(() => {
    if (game?.status === "active") loadGame();
  }, 5000);
  return () => clearInterval(poll);
}, [game?.status]);
```

This keeps both players' browsers in sync without WebSockets.

---

## CSS Design System

TheRef uses CSS custom properties for theming, accessible via Tailwind:

```css
:root {
  --pitch:   #080810;   /* bg-pitch — page background */
  --turf:    #0d0d1a;   /* bg-turf — card background */
  --line:    #161628;   /* border-line — borders */
  --chalk:   #e8e8f0;   /* text-chalk — primary text */
  --mist:    #7070a0;   /* text-mist — secondary text */
  --ref:     #F5C518;   /* text-ref / bg-ref — gold accent */
  --ref-dim: #c49a10;   /* hover state for ref */
}
```

Special classes:
- `.page` — full page wrapper with responsive padding
- `.container-ref` — max-width container with `max-w-screen-2xl`
- `.glass` — frosted glass effect for header
- `.bg-grid` — subtle grid background pattern

---

## Input Sanitization

All contract call args are sanitized before being passed to `writeContract`:

```typescript
function str(v: unknown, fallback = ""): string {
  if (v === undefined || v === null) return fallback;
  return String(v);
}

function int(v: unknown, fallback = 0): number {
  const n = typeof v === "number" ? v : parseInt(String(v ?? fallback), 10);
  return isNaN(n) ? fallback : n;
}

function intArr(v: unknown, fallback: number[]): number[] {
  if (!Array.isArray(v)) return fallback;
  const mapped = v.map(x => int(x, 0));
  return mapped.some(isNaN) ? fallback : mapped;
}
```

This prevents `BigInt(undefined)` crashes in the genlayer-js SDK encoder.
