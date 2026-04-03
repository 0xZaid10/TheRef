# FeeManager

Platform treasury contract. Currently disabled for hackathon to maximize adoption.

**Bradbury:** `0x88A0A4d573fD9C63433E457e94d266D7904278C2`
**Studionet:** `0x0000000000000000000000000000000000000000`

---

## Purpose

FeeManager is designed to collect a small platform fee on each on-chain game interaction. All fees accumulate in the treasury and are managed by the contract owner.

## Current Status

All fees are set to `0` for the hackathon period. The contract is deployed and integrated but the fee collection is inactive:

```python
FEE_START = 1_000_000_000_000_000_000   # 1 GEN (currently disabled)
FEE_JUDGE = 1_500_000_000_000_000_000   # 1.5 GEN (currently disabled)
```

In RefereeCore, fee checks are commented out:
```python
# Fees disabled for hackathon — open access to drive adoption
# self._check_fee("start_game", FEE_START)
```

## Post-Hackathon

Fee amounts and collection will be activated via owner configuration after adoption milestones are reached.
