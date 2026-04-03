# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }

import json
from genlayer import *

SCORE_WIN  = 3.0
SCORE_DRAW = 1.0

class LeaderboardVault(gl.Contract):
    owner:       str
    authorized:  TreeMap[str, str]  # address → "1"
    stats:       TreeMap[str, str]  # "game:player:type" → JSON
    global_stats: TreeMap[str, str] # "game:player" → JSON

    def __init__(self):
        self.owner = str(gl.message.sender_address).lower()

    def _only_authorized(self):
        caller = str(gl.message.sender_address).lower()
        if caller != self.owner and caller not in self.authorized:
            raise gl.vm.UserError("[EXPECTED] Not authorized")

    def _update_entry(self, key: str, result: str, confidence: float):
        existing = json.loads(self.stats[key]) if key in self.stats else {
            "wins": 0, "losses": 0, "draws": 0, "score": 0.0,
            "total_confidence": 0.0, "games": 0
        }
        existing["games"] = existing.get("games", 0) + 1
        if result == "win":
            existing["wins"] = existing.get("wins", 0) + 1
            existing["score"] = existing.get("score", 0.0) + SCORE_WIN + round(confidence * 0.5, 3)
        elif result == "loss":
            existing["losses"] = existing.get("losses", 0) + 1
        else:
            existing["draws"] = existing.get("draws", 0) + 1
            existing["score"] = existing.get("score", 0.0) + SCORE_DRAW
        existing["total_confidence"] = round(
            existing.get("total_confidence", 0.0) + confidence, 3
        )
        self.stats[key] = json.dumps(existing)

    @gl.public.write
    def authorize(self, address: str) -> str:
        if str(gl.message.sender_address).lower() != self.owner:
            raise gl.vm.UserError("[EXPECTED] Owner only")
        self.authorized[address.strip().lower()] = "1"
        return "ok"

    @gl.public.write
    def record_result(
        self,
        game_name:   str,
        winner:      str,
        loser:       str,
        draws:       list,
        avg_conf:    float,
        player_types: dict,
    ) -> str:
        self._only_authorized()
        gn = game_name.strip()
        pt = player_types or {}

        def ptype(p): return pt.get(p, "human")

        if winner and loser:
            w_type = ptype(winner)
            l_type = ptype(loser)
            self._update_entry(f"{gn}:{winner}:{w_type}", "win",  avg_conf)
            self._update_entry(f"{gn}:{loser}:{l_type}",  "loss", avg_conf)
        for p in (draws or []):
            self._update_entry(f"{gn}:{p}:{ptype(p)}", "draw", avg_conf)
        return "ok"

    @gl.public.view
    def get_leaderboard(self, game_name: str, player_type: str) -> list:
        gn    = game_name.strip()
        ptype = player_type.strip().lower()
        entries = []
        prefix = f"{gn}:"
        for key in self.stats:
            if not key.startswith(prefix):
                continue
            parts = key.split(":")
            if len(parts) != 3:
                continue
            _, pname, pt = parts
            if ptype not in ("all", pt):
                continue
            s = json.loads(self.stats[key])
            s["player"]      = pname
            s["player_type"] = pt
            s["score"]       = round(float(s.get("score", 0)), 2)
            entries.append(s)
        for e in entries:
            e["score"] = str(e.get("score", 0.0))
            e["total_confidence"] = str(e.get("total_confidence", 0.0))
        entries.sort(key=lambda x: -float(x["score"]))
        return entries

    @gl.public.view
    def get_player_stats(self, game_name: str, player: str, player_type: str) -> dict:
        key = f"{game_name.strip()}:{player.strip()}:{player_type.strip() or 'human'}"
        if key not in self.stats:
            return {"player": player, "wins": 0, "losses": 0, "draws": 0, "score": 0.0}
        s = json.loads(self.stats[key])
        s["player"] = player
        s["score"] = str(s.get("score", 0.0))
        s["total_confidence"] = str(s.get("total_confidence", 0.0))
        return s

    @gl.public.view
    def get_top_players(self, game_name: str, n: int) -> list:
        all_entries = self.get_leaderboard(game_name, "all")
        return all_entries[:n]
