# Contracts Overview

TheRef is built on five Intelligent Contracts deployed on GenLayer. Each contract has a distinct responsibility.

## Contract Map

| Contract | Key | Responsibility |
|---|---|---|
| [RefereeCore](./referee-core.md) | `CORE` | Games, moves, AI judgment, core leaderboard |
| [LeaderboardVault](./leaderboard-vault.md) | `LB` | Persistent cross-game rankings (human + agent split) |
| [TournamentEngine](./tournament-engine.md) | `TRN` | Bracket management, standings, tournament lifecycle |
| [OrganizerRegistry](./organizer-registry.md) | `ORG` | Verified organizer profiles and reputation |
| [FeeManager](./fee-manager.md) | `FEE` | Platform treasury, fee collection |

## Addresses

### Bradbury Testnet (Chain ID: 4221)
```
CORE = "0xA29CfFC83d32fe924cFf1F1bDCf21555CCC96206"
LB   = "0x5D417F296b17656c9b950236feE66F63E22d8A54"
ORG  = "0x440b28afc1804fc1E4AA8f5b559C18F7bCf43B3A"
FEE  = "0x88A0A4d573fD9C63433E457e94d266D7904278C2"
TRN  = "0xbcc0E82a17491297E0c4938606624Fa04e6abA1B"
```

### Studionet (Chain ID: 61999)
```
CORE = "0x88CAA18419714aA38CdF53c0E603141c48fa3238"
LB   = "0x8A2d05Df048A64cc6B83682a431ade05030e4BBB"
ORG  = "0x265ef96A5230F13836c553D7DD2B9D7c3fE14aE1"
FEE  = "0x0000000000000000000000000000000000000000"
TRN  = "0x44f7c1bDa293B9cdBD79a6dfb66bD45696dEa4A6"
```

**Deployer:** `0x73693d8EF123EbF1d7da3Db6Ee27baDD54d03ce6`

## GenLayer Contract Header

All TheRef contracts include the GenLayer dependency declaration:

```python
# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }
import json
from genlayer import *
```
