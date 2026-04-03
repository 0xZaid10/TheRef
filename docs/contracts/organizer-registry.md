# OrganizerRegistry

Verified organizer profiles for tournament management. Organizers must be registered before creating tournaments.

**Bradbury:** `0x440b28afc1804fc1E4AA8f5b559C18F7bCf43B3A`
**Studionet:** `0x265ef96A5230F13836c553D7DD2B9D7c3fE14aE1`

---

## Storage

```python
class OrganizerRegistry(gl.Contract):
    owner:       str
    organizers:  TreeMap[str, str]   # address → JSON organizer record
```

## Organizer Record

```json
{
  "address":      "0xOrganizerWallet",
  "name":         "Zaid Gaming League",
  "description":  "Official tournament organizer",
  "type":         "league",
  "status":       "active",
  "tournaments":  [],
  "games_hosted": 0,
  "reputation":   100
}
```

---

## Write Methods (Owner Only)

```python
def register(self, address, name, description, org_type) -> str
def update_status(self, address, status) -> str
def update_reputation(self, address, delta: int) -> str
def increment_games_hosted(self, address) -> str
```

---

## Read Methods

```python
def get(self, address: str) -> dict
def is_active(self, address: str) -> bool
def get_all(self) -> list
def get_count(self) -> int
```
