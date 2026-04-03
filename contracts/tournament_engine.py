# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }

import json
from genlayer import *

BASE36 = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ"

FORMAT_SE = "single_elimination"
FORMAT_RR = "round_robin"
FORMAT_SW = "swiss"
FORMATS   = [FORMAT_SE, FORMAT_RR, FORMAT_SW]

STATUS_OPEN      = "open"
STATUS_ACTIVE    = "active"
STATUS_COMPLETED = "completed"


def _tid(n: int) -> str:
    r = ""
    while n > 0:
        r = BASE36[n % 36] + r
        n //= 36
    return "T" + r.zfill(4)


class TournamentEngine(gl.Contract):
    owner:       str
    authorized:  TreeMap[str, str]
    tournaments: TreeMap[str, str]
    t_players:   TreeMap[str, str]
    t_matches:   TreeMap[str, str]
    count:       u64

    def __init__(self):
        self.owner = str(gl.message.sender_address).lower()
        self.count = u64(0)

    def _only_owner(self):
        if str(gl.message.sender_address).lower() != self.owner:
            raise gl.vm.UserError("[EXPECTED] Owner only")

    def _check_organizer(self):
        caller = str(gl.message.sender_address).lower()
        if caller == self.owner:
            return
        if caller not in self.authorized:
            raise gl.vm.UserError("[EXPECTED] Only registered organizers can create tournaments")

    def _load_t(self, tid: str) -> dict:
        return json.loads(self.tournaments[tid]) if tid in self.tournaments else None

    def _save_t(self, tid: str, t: dict):
        self.tournaments[tid] = json.dumps(t)

    @gl.public.write
    def authorize_organizer(self, address: str) -> str:
        self._only_owner()
        self.authorized[address.strip().lower()] = "1"
        return "ok"

    @gl.public.write
    def create_tournament(
        self,
        name:             str,
        game_name:        str,
        format:           str,
        max_players:      int,
        entry_fee_wei:    int,
        prize_split:      list,
        rules:            str,
        rounds_per_match: int,
    ) -> str:
        self._check_organizer()
        fmt = format.strip().lower()
        if fmt not in FORMATS:
            raise gl.vm.UserError(f"[EXPECTED] Invalid format. Choose: {FORMATS}")
        if max_players < 2:
            raise gl.vm.UserError("[EXPECTED] Need at least 2 players")
        if sum(prize_split) > 100:
            raise gl.vm.UserError("[EXPECTED] prize_split must sum to ≤ 100")

        self.count = u64(int(self.count) + 1)
        tid = _tid(int(self.count))
        caller = str(gl.message.sender_address).lower()

        t = {
            "tid":              tid,
            "name":             name.strip()[:80],
            "game_name":        game_name.strip(),
            "format":           fmt,
            "max_players":      max_players,
            "entry_fee_wei":    entry_fee_wei,
            "prize_pool_wei":   0,
            "prize_split":      prize_split,
            "rules":            rules.strip()[:500],
            "rounds_per_match": rounds_per_match,
            "organizer":        caller,
            "status":           STATUS_OPEN,
            "players":          [],
            "bracket":          [],
            "current_round":    0,
            "match_count":      0,
            "winner":           "",
        }
        self._save_t(tid, t)
        return tid

    @gl.public.write.payable
    def join_tournament(self, tid: str, player_name: str, player_type: str) -> str:
        tid = tid.strip().upper()
        t   = self._load_t(tid)
        if t is None:
            raise gl.vm.UserError(f"[EXPECTED] Tournament not found: {tid}")
        if t["status"] != STATUS_OPEN:
            raise gl.vm.UserError("[EXPECTED] Registration closed")
        if len(t["players"]) >= t["max_players"]:
            raise gl.vm.UserError("[EXPECTED] Tournament full")

        fee = int(t["entry_fee_wei"])
        if fee > 0 and int(gl.message.value) < fee:
            raise gl.vm.UserError(f"[EXPECTED] Entry fee required: {fee} wei")

        pname = player_name.strip()
        if pname in t["players"]:
            raise gl.vm.UserError(f"[EXPECTED] Already registered: {pname}")

        ptype = player_type.strip().lower() or "human"

        reg = {
            "player":     pname,
            "address":    str(gl.message.sender_address).lower(),
            "type":       ptype,
            "wins":       0,
            "losses":     0,
            "draws":      0,
            "points":     0,
            "eliminated": False,
        }
        self.t_players[f"{tid}:{pname}"] = json.dumps(reg)
        t["players"].append(pname)
        t["prize_pool_wei"] = int(t["prize_pool_wei"]) + int(gl.message.value)
        self._save_t(tid, t)
        return f"Joined {tid} as {pname}. Pool: {t['prize_pool_wei']} wei"

    @gl.public.write
    def start_tournament(self, tid: str) -> str:
        tid = tid.strip().upper()
        t   = self._load_t(tid)
        if t is None:
            raise gl.vm.UserError("[EXPECTED] Not found")
        if str(gl.message.sender_address).lower() != t["organizer"] and \
           str(gl.message.sender_address).lower() != self.owner:
            raise gl.vm.UserError("[EXPECTED] Only organizer")
        if t["status"] != STATUS_OPEN:
            raise gl.vm.UserError("[EXPECTED] Not open")
        if len(t["players"]) < 2:
            raise gl.vm.UserError("[EXPECTED] Need 2+ players")

        players = t["players"]
        fmt     = t["format"]
        matches = []

        if fmt == FORMAT_SE:
            for i in range(0, len(players) - 1, 2):
                t["match_count"] += 1
                matches.append({
                    "match_id": t["match_count"], "round": 1,
                    "player1": players[i], "player2": players[i+1],
                    "game_id": "", "winner": "", "status": "pending",
                })
            if len(players) % 2 == 1:
                t["match_count"] += 1
                matches.append({
                    "match_id": t["match_count"], "round": 1,
                    "player1": players[-1], "player2": "BYE",
                    "game_id": "", "winner": players[-1], "status": "completed",
                })

        elif fmt == FORMAT_RR:
            for i in range(len(players)):
                for j in range(i+1, len(players)):
                    t["match_count"] += 1
                    matches.append({
                        "match_id": t["match_count"], "round": 1,
                        "player1": players[i], "player2": players[j],
                        "game_id": "", "winner": "", "status": "pending",
                    })

        elif fmt == FORMAT_SW:
            for i in range(0, len(players) - 1, 2):
                t["match_count"] += 1
                matches.append({
                    "match_id": t["match_count"], "round": 1,
                    "player1": players[i], "player2": players[i+1],
                    "game_id": "", "winner": "", "status": "pending",
                })

        t["bracket"]       = matches
        t["current_round"] = 1
        t["status"]        = STATUS_ACTIVE

        for m in matches:
            if m["match_id"] > 0:
                self.t_matches[f"{tid}:{m['match_id']}"] = json.dumps(m)

        self._save_t(tid, t)
        pending_count = len([m for m in matches if m["status"] == "pending"])
        return f"{tid} started. Format: {fmt}. {pending_count} matches in round 1."

    @gl.public.write
    def record_match_result(self, tid: str, match_id: int, winner: str) -> str:
        tid = tid.strip().upper()
        t   = self._load_t(tid)
        if t is None:
            raise gl.vm.UserError("[EXPECTED] Not found")
        caller = str(gl.message.sender_address).lower()
        if caller != t["organizer"] and caller != self.owner:
            raise gl.vm.UserError("[EXPECTED] Only organizer")

        mk    = f"{tid}:{match_id}"
        if mk not in self.t_matches:
            raise gl.vm.UserError(f"[EXPECTED] Match not found: {match_id}")
        match = json.loads(self.t_matches[mk])
        if match["status"] == "completed":
            raise gl.vm.UserError("[EXPECTED] Already completed")

        winner = winner.strip()
        if winner not in [match["player1"], match["player2"]]:
            raise gl.vm.UserError(f"[EXPECTED] Winner must be {match['player1']} or {match['player2']}")

        loser         = match["player2"] if winner == match["player1"] else match["player1"]
        match["winner"] = winner
        match["status"] = "completed"
        self.t_matches[mk] = json.dumps(match)

        for p, res in [(winner, "wins"), (loser, "losses")]:
            pk = f"{tid}:{p}"
            if pk in self.t_players:
                pr = json.loads(self.t_players[pk])
                pr[res] = pr.get(res, 0) + 1
                pr["points"] = pr.get("points", 0) + (3 if res == "wins" else 0)
                if res == "losses" and t["format"] == FORMAT_SE:
                    pr["eliminated"] = True
                self.t_players[pk] = json.dumps(pr)

        for i, m in enumerate(t["bracket"]):
            if m["match_id"] == match_id:
                t["bracket"][i] = match
                break

        pending = [m for m in t["bracket"]
                   if m["status"] == "pending" and m["round"] == t["current_round"]]

        msg = f"Match {match_id}: {winner} wins."

        if not pending:
            if t["format"] == FORMAT_SE:
                winners_r = [m["winner"] for m in t["bracket"]
                             if m["round"] == t["current_round"] and m["winner"] not in ("","BYE")]
                if len(winners_r) == 1:
                    t["winner"] = winners_r[0]
                    t["status"] = STATUS_COMPLETED
                    msg += f" Tournament complete! Champion: {winners_r[0]}"
                else:
                    t["current_round"] += 1
                    for i in range(0, len(winners_r) - 1, 2):
                        t["match_count"] += 1
                        nm = {
                            "match_id": t["match_count"], "round": t["current_round"],
                            "player1": winners_r[i], "player2": winners_r[i+1],
                            "game_id": "", "winner": "", "status": "pending",
                        }
                        t["bracket"].append(nm)
                        self.t_matches[f"{tid}:{t['match_count']}"] = json.dumps(nm)
                    msg += f" Round {t['current_round']} generated."

            elif t["format"] in (FORMAT_RR, FORMAT_SW):
                standings = sorted(
                    [(p, json.loads(self.t_players[f"{tid}:{p}"]).get("points", 0))
                     for p in t["players"] if f"{tid}:{p}" in self.t_players],
                    key=lambda x: -x[1]
                )
                if t["format"] == FORMAT_RR or \
                   t["current_round"] >= len(t["players"]) - 1:
                    t["winner"] = standings[0][0] if standings else ""
                    t["status"] = STATUS_COMPLETED
                    msg += f" Tournament complete! Champion: {t['winner']}"
                else:
                    t["current_round"] += 1
                    paired = set()
                    for i in range(0, len(standings) - 1, 2):
                        if standings[i][0] not in paired and standings[i+1][0] not in paired:
                            t["match_count"] += 1
                            nm = {
                                "match_id": t["match_count"], "round": t["current_round"],
                                "player1": standings[i][0], "player2": standings[i+1][0],
                                "game_id": "", "winner": "", "status": "pending",
                            }
                            t["bracket"].append(nm)
                            self.t_matches[f"{tid}:{t['match_count']}"] = json.dumps(nm)
                            paired.update([standings[i][0], standings[i+1][0]])
                    msg += f" Round {t['current_round']} generated."

        self._save_t(tid, t)
        return msg

    @gl.public.view
    def get_tournament(self, tid: str) -> dict:
        tid = tid.strip().upper()
        t   = self._load_t(tid)
        return t if t else {}

    @gl.public.view
    def get_standings(self, tid: str) -> list:
        tid = tid.strip().upper()
        t   = self._load_t(tid)
        if not t:
            return []
        result = []
        for p in t["players"]:
            pk = f"{tid}:{p}"
            if pk in self.t_players:
                pr = json.loads(self.t_players[pk])
                result.append(pr)
        result.sort(key=lambda x: -x.get("points", 0))
        return result

    @gl.public.view
    def get_bracket(self, tid: str) -> list:
        tid = tid.strip().upper()
        t   = self._load_t(tid)
        return t.get("bracket", []) if t else []

    @gl.public.view
    def list_tournaments(self) -> list:
        result = []
        for k in self.tournaments:
            t = json.loads(self.tournaments[k])
            result.append({
                "tid": t["tid"], "name": t["name"], "format": t["format"],
                "status": t["status"], "players": len(t["players"]),
                "max_players": t["max_players"], "prize_pool": t["prize_pool_wei"],
            })
        return result

    @gl.public.view
    def get_total(self) -> int:
        return int(self.count)
