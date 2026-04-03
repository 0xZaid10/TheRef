# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }

import json
from genlayer import *


class OrganizerRegistry(gl.Contract):
    owner:       str
    organizers:  TreeMap[str, str]  # address → JSON
    count:       u64

    def __init__(self):
        self.owner = str(gl.message.sender_address).lower()
        self.count = u64(0)

    def _only_owner(self):
        if str(gl.message.sender_address).lower() != self.owner:
            raise gl.vm.UserError("[EXPECTED] Owner only")

    @gl.public.write
    def register(self, address: str, name: str, description: str, org_type: str) -> str:
        self._only_owner()
        addr = address.strip().lower()
        if not addr:
            raise gl.vm.UserError("[EXPECTED] Invalid address")
        record = {
            "address":     addr,
            "name":        name.strip()[:100],
            "description": description.strip()[:300],
            "type":        org_type.strip().lower() or "individual",
            "status":      "active",
            "tournaments": [],
            "games_hosted": 0,
            "reputation":  100,
        }
        self.organizers[addr] = json.dumps(record)
        self.count = u64(int(self.count) + 1)
        return f"Registered: {name} ({addr})"

    @gl.public.write
    def update_status(self, address: str, status: str) -> str:
        self._only_owner()
        addr = address.strip().lower()
        if addr not in self.organizers:
            raise gl.vm.UserError("[EXPECTED] Not found")
        rec = json.loads(self.organizers[addr])
        rec["status"] = status.strip().lower()
        self.organizers[addr] = json.dumps(rec)
        return f"Updated {addr}: {status}"

    @gl.public.write
    def update_reputation(self, address: str, delta: int) -> str:
        self._only_owner()
        addr = address.strip().lower()
        if addr not in self.organizers:
            raise gl.vm.UserError("[EXPECTED] Not found")
        rec = json.loads(self.organizers[addr])
        rec["reputation"] = max(0, min(1000, rec.get("reputation", 100) + delta))
        self.organizers[addr] = json.dumps(rec)
        return f"Reputation updated: {rec['reputation']}"

    @gl.public.write
    def increment_games_hosted(self, address: str) -> str:
        addr = address.strip().lower()
        if addr not in self.organizers:
            return "not_found"
        rec = json.loads(self.organizers[addr])
        rec["games_hosted"] = rec.get("games_hosted", 0) + 1
        self.organizers[addr] = json.dumps(rec)
        return "ok"

    @gl.public.view
    def get(self, address: str) -> dict:
        addr = address.strip().lower()
        if addr not in self.organizers:
            return {}
        return json.loads(self.organizers[addr])

    @gl.public.view
    def is_active(self, address: str) -> bool:
        addr = address.strip().lower()
        if addr not in self.organizers:
            return False
        rec = json.loads(self.organizers[addr])
        return rec.get("status") == "active"

    @gl.public.view
    def get_all(self) -> list:
        result = []
        for k in self.organizers:
            result.append(json.loads(self.organizers[k]))
        return result

    @gl.public.view
    def get_count(self) -> int:
        return int(self.count)
