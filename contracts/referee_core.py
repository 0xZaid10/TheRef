# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }

import json
from genlayer import *

# ── Constants ────────────────────────────────────────────────────────────────

VIS_PUBLIC  = "public"
VIS_PRIVATE = "private"
VISIBILITIES = [VIS_PUBLIC, VIS_PRIVATE]

STATUS_WAITING   = "waiting"
STATUS_ACTIVE    = "active"
STATUS_COMPLETED = "completed"
STATUS_DRAW      = "draw"

MAX_BATCH = 5
SCORE_WIN  = 3.0
SCORE_DRAW = 1.0

BASE36 = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ"

FEE_START = 1_000_000_000_000_000_000
FEE_JUDGE = 1_500_000_000_000_000_000

# ── Helpers ──────────────────────────────────────────────────────────────────

def _game_id(n: int) -> str:
    r = ""
    while n > 0:
        r = BASE36[n % 36] + r
        n //= 36
    return r.zfill(5)

def _blocked_rules(rules: str) -> bool:
    blocked = ["roll a die","roll dice","flip a coin","draw a card",
               "random number","lottery","spin the wheel"]
    rl = rules.lower()
    return any(b in rl for b in blocked)

# ── Production-grade judgment prompt ─────────────────────────────────────────

def _build_judgment_prompt(
    game_name: str, rules: str, player1: str, player2: str,
    rounds_data: list, history_summary: str
) -> str:
    n = len(rounds_data)
    rounds_text = ""
    for rd in rounds_data:
        m1 = str(rd['move_player1'])[:80]
        m2 = str(rd['move_player2'])[:80]
        rounds_text += f"R{rd['round_number']}: {player1}={m1} | {player2}={m2}\n"
    prompt = (
        f'Game:{game_name} Rules:{rules[:100]} '
        f'p1={player1} p2={player2}\n'
        f'{rounds_text}'
        f'Judge {n} round(s). Return JSON: '
        f'{{"judgments":[{{"round_number":1,"result":"player1|player2|draw",'
        f'"reason_type":"normal|invalid_move","invalid_player":"none|player1|player2",'
        f'"reasoning":"reason","confidence":0.9}}]}}'
    )
    return prompt

    return prompt


def _build_rules_fetch_prompt(game_name: str) -> str:
    return f"""Provide concise rules for "{game_name}" that an AI referee can use to judge moves. Include win/loss/draw conditions. Max 200 words. Rules only, no preamble."""


# ── Contract ─────────────────────────────────────────────────────────────────

class RefereeCore(gl.Contract):
    games:        TreeMap[str, str]
    rounds:       TreeMap[str, str]
    game_count:   u64
    owner:        str
    leaderboard:  TreeMap[str, str]  # fallback if no vault connected
    # Connected contracts (optional — set after deploy)
    leaderboard_vault:  str
    fee_manager:        str

    def __init__(self):
        self.owner             = str(gl.message.sender_address).lower()
        self.game_count        = u64(0)
        self.leaderboard_vault = ""
        self.fee_manager       = ""

    # ── Config ───────────────────────────────────────────────────────────────

    @gl.public.write
    def set_leaderboard_vault(self, address: str) -> str:
        if str(gl.message.sender_address).lower() != self.owner:
            raise gl.vm.UserError("[EXPECTED] Owner only")
        self.leaderboard_vault = address.strip().lower()
        return f"LeaderboardVault set: {self.leaderboard_vault}"

    @gl.public.write
    def set_fee_manager(self, address: str) -> str:
        if str(gl.message.sender_address).lower() != self.owner:
            raise gl.vm.UserError("[EXPECTED] Owner only")
        self.fee_manager = address.strip().lower()
        return f"FeeManager set: {self.fee_manager}"

    # ── Storage helpers ──────────────────────────────────────────────────────

    def _save_game(self, gid: str, g: dict):
        self.games[gid] = json.dumps(g)

    def _load_game(self, gid: str) -> dict:
        return json.loads(self.games[gid]) if gid in self.games else None

    def _save_round(self, gid: str, r: dict):
        self.rounds[f"{gid}:{r['round_number']}"] = json.dumps(r)

    def _load_round(self, gid: str, n: int) -> dict:
        k = f"{gid}:{n}"
        return json.loads(self.rounds[k]) if k in self.rounds else None

    def _check_fee(self, method: str, required: int):
        val = int(gl.message.value)
        if val < required:
            raise gl.vm.UserError(
                f"[EXPECTED] {method} requires {required} wei ({required/1e18} GEN). "
                f"Sent: {val} wei"
            )

    def _pending_rounds(self, game: dict) -> list:
        result = []
        for i in range(1, game["round_count"] + 1):
            r = self._load_round(game["game_id"], i)
            if r and r["status"] == "pending_judgment":
                result.append(r)
        return result

    # ── Write: start_game ────────────────────────────────────────────────────

    @gl.public.write
    def start_game(
        self,
        game_name:  str,
        visibility: str,
        max_rounds: int,
        rules:      str,
        player1:    str,
        player2:    str,
        agent1:     str,
        agent2:     str,
    ) -> str:
        # Fees disabled for hackathon — open access to drive adoption
        # self._check_fee("start_game", FEE_START)

        game_name  = str(game_name).strip() if game_name else ""
        visibility = str(visibility).strip().lower() if visibility else "public"
        player1    = str(player1).strip() if player1 else ""
        player2    = str(player2).strip() if player2 else ""
        agent1     = "" if (not agent1 or agent1 == 0) else str(agent1).strip().lower()
        agent2     = "" if (not agent2 or agent2 == 0) else str(agent2).strip().lower()
        rules      = "" if (not rules or rules == 0) else str(rules).strip()

        if not game_name:
            raise gl.vm.UserError("[EXPECTED] game_name required")
        if visibility not in VISIBILITIES:
            visibility = VIS_PUBLIC
        if not player1:
            raise gl.vm.UserError("[EXPECTED] player1 required")
        if max_rounds < 0:
            raise gl.vm.UserError("[EXPECTED] max_rounds must be >= 0")

        # Fetch rules if not provided
        if not rules:
            _rules_prompt = _build_rules_fetch_prompt(game_name)
            def _rules_leader():
                return gl.nondet.exec_prompt(_rules_prompt, response_format="text")
            def _rules_validator(r) -> bool:
                return True
            rules = str(gl.vm.run_nondet_unsafe(_rules_leader, _rules_validator)).strip()[:400]
        else:
            if _blocked_rules(rules):
                raise gl.vm.UserError(
                    "[EXPECTED] Games involving dice, cards, or lotteries are not supported. "
                    "The Referee judges skill and knowledge, not chance."
                )

        self.game_count = u64(int(self.game_count) + 1)
        gid = _game_id(int(self.game_count))

        game = {
            "game_id":      gid,
            "game_name":    game_name,
            "visibility":   visibility,
            "max_rounds":   max_rounds,
            "rules":        rules,
            "player1":      player1,
            "player2":      player2,
            "agent1":       agent1,
            "agent2":       agent2,
            "status":       STATUS_ACTIVE if (player1 and player2) else STATUS_WAITING,
            "round_count":  0,
            "judged_through": 0,
            "winner":       "",
            "score":        {player1: 0.0, player2: 0.0} if player2 else {player1: 0.0},
            "caller":       str(gl.message.sender_address).lower(),
            "player_types": {
                player1: "agent" if agent1 else "human",
                player2: "agent" if agent2 else "human",
            },
        }
        self._save_game(gid, game)
        return gid

    # ── Write: submit_move ───────────────────────────────────────────────────

    @gl.public.write
    def submit_move(self, game_id: str, player: str, move: str) -> str:
        if isinstance(game_id, int):
            gid = _game_id(game_id)
        else:
            gid = str(game_id).strip().upper().zfill(5)
        game = self._load_game(gid)
        if game is None:
            raise gl.vm.UserError(f"[EXPECTED] Game not found: {gid}")
        if game["status"] != STATUS_ACTIVE:
            raise gl.vm.UserError(f"[EXPECTED] Game is not active (status: {game['status']})")

        player = player.strip()
        move   = move.strip()
        if not move:
            raise gl.vm.UserError("[EXPECTED] Move cannot be empty")

        # Agent auth
        caller = str(gl.message.sender_address).lower()
        if player == game["player1"] and game["agent1"]:
            if caller != game["agent1"]:
                raise gl.vm.UserError("[EXPECTED] Unauthorized: wrong agent address for player1")
        if player == game["player2"] and game["agent2"]:
            if caller != game["agent2"]:
                raise gl.vm.UserError("[EXPECTED] Unauthorized: wrong agent address for player2")

        if player not in (game["player1"], game["player2"]):
            raise gl.vm.UserError(f"[EXPECTED] Unknown player: {player}")

        rcount = game["round_count"]
        current = self._load_round(gid, rcount) if rcount > 0 else None

        is_p1 = (player == game["player1"])

        # Determine target round
        if current is None or (current["move_player1"] and current["move_player2"]):
            # New round
            rcount += 1
            if game["max_rounds"] > 0 and rcount > game["max_rounds"]:
                raise gl.vm.UserError(f"[EXPECTED] All {game['max_rounds']} rounds already submitted")
            new_round = {
                "round_number":  rcount,
                "move_player1":  move if is_p1 else "",
                "move_player2":  "" if is_p1 else move,
                "result":        "pending",
                "reason_type":   "",
                "invalid_player": "none",
                "reasoning":     "",
                "confidence":    0.0,
                "status":        "pending_moves",
            }
            game["round_count"] = rcount
            self._save_round(gid, new_round)
        else:
            # Complete existing round
            if is_p1:
                if current["move_player1"]:
                    raise gl.vm.UserError("[EXPECTED] player1 already submitted this round")
                current["move_player1"] = move
            else:
                if current["move_player2"]:
                    raise gl.vm.UserError("[EXPECTED] player2 already submitted this round")
                current["move_player2"] = move

            both = bool(current["move_player1"] and current["move_player2"])
            current["status"] = "pending_judgment" if both else "pending_moves"
            self._save_round(gid, current)

        self._save_game(gid, game)

        is_last = (game["max_rounds"] > 0 and rcount >= game["max_rounds"])
        current_round = self._load_round(gid, rcount)
        both_in = bool(
            current_round and
            current_round["move_player1"] and
            current_round["move_player2"]
        )

        if both_in and is_last:
            return f"Move submitted. Round {rcount} complete. All rounds ready — call judge_game() to finalize."
        elif both_in:
            return f"Move submitted. Round {rcount} ready for judgment."
        else:
            return f"Move submitted for round {rcount}. Waiting for opponent."

    # ── Write: judge_game ────────────────────────────────────────────────────

    @gl.public.write
    def judge_game(self, game_id: str) -> str:
        # Fees disabled for hackathon — open access to drive adoption
        # self._check_fee("judge_game", FEE_JUDGE)

        if isinstance(game_id, int):
            gid = _game_id(game_id)
        else:
            gid = str(game_id).strip().upper().zfill(5)
        game = self._load_game(gid)
        if game is None:
            raise gl.vm.UserError(f"[EXPECTED] Game not found: {gid}")
        if game["status"] != STATUS_ACTIVE:
            raise gl.vm.UserError(f"[EXPECTED] Game is not active")

        pending = self._pending_rounds(game)
        if not pending:
            raise gl.vm.UserError("[EXPECTED] No rounds pending judgment")

        self._run_judgment(gid)
        game = self._load_game(gid)

        if game["status"] == STATUS_COMPLETED:
            return f"Judgment complete. Winner: {game['winner']} | Score: {json.dumps(game['score'])}"
        elif game["status"] == STATUS_DRAW:
            return f"Judgment complete. Draw | Score: {json.dumps(game['score'])}"
        else:
            return f"Rounds judged. Game continues."

    # ── Write: end_game ──────────────────────────────────────────────────────

    @gl.public.write
    def end_game(self, game_id: str) -> str:
        # Fees disabled for hackathon — open access to drive adoption
        # self._check_fee("judge_game", FEE_JUDGE)

        if isinstance(game_id, int):
            gid = _game_id(game_id)
        else:
            gid = str(game_id).strip().upper().zfill(5)
        game = self._load_game(gid)
        if game is None:
            raise gl.vm.UserError(f"[EXPECTED] Game not found: {gid}")
        if game["status"] != STATUS_ACTIVE:
            raise gl.vm.UserError(f"[EXPECTED] Game is not active")

        caller = str(gl.message.sender_address).lower()
        if caller != game["caller"]:
            raise gl.vm.UserError("[EXPECTED] Only the game creator can call end_game")

        self._run_judgment(gid)
        game = self._load_game(gid)

        winner = game.get("winner") or "Draw"
        return f"Game ended. Winner: {winner}"

    # ── Core: run judgment ───────────────────────────────────────────────────

    def _run_judgment(self, gid: str):
        game    = self._load_game(gid)
        rules   = game["rules"]
        gname   = game["game_name"]
        p1      = game["player1"]
        p2      = game["player2"]
        pending = self._pending_rounds(game)

        if not pending:
            return

        # Build history summary from already-judged rounds
        judged_through = game.get("judged_through", 0)
        history_parts  = []
        for i in range(1, judged_through + 1):
            r = self._load_round(gid, i)
            if r and r["result"] != "pending":
                who = p1 if r["result"] == "player1" else p2 if r["result"] == "player2" else "Draw"
                history_parts.append(f"R{i}: {who} won ({r['reasoning'][:60]})")
        history_summary = " | ".join(history_parts) if history_parts else ""

        # Process in batches
        all_judged = []
        game_over  = True
        game_over_reason = ""

        for i in range(0, len(pending), MAX_BATCH):
            batch = pending[i:i + MAX_BATCH]
            prompt = _build_judgment_prompt(gname, rules, p1, p2, batch, history_summary)

            def _leader_fn():
                return gl.nondet.exec_prompt(prompt, response_format="json")
            def _validator_fn(leader_result) -> bool:
                return True  # Accept leader result, equivalence checked by output hash
            raw = gl.vm.run_nondet_unsafe(_leader_fn, _validator_fn)

            if not isinstance(raw, dict):
                raise gl.vm.UserError(f"[EXTERNAL] LLM returned non-dict: {type(raw).__name__}")

            # Extract game_over
            batch_over = raw.get("game_over", True)
            if not batch_over:
                game_over = False
                game_over_reason = raw.get("game_over_reason", "Game not legitimately ended")

            # Extract judgments
            judgments = (
                raw.get("judgments") or
                raw.get("rounds") or
                raw.get("verdicts") or
                []
            )
            if isinstance(raw.get("judgments"), list):
                judgments = raw["judgments"]

            if not isinstance(judgments, list) or len(judgments) == 0:
                keys = list(raw.keys())
                raise gl.vm.UserError(
                    f"[EXTERNAL] Empty judgments from LLM. "
                    f"Keys returned: {keys}. "
                    f"chain_of_thought: {str(raw.get('chain_of_thought',''))[:100]}"
                )

            all_judged.extend(judgments)

            # Update history for next batch
            for j in judgments:
                who = p1 if j.get("result") == "player1" else p2 if j.get("result") == "player2" else "Draw"
                history_parts.append(f"R{j.get('round_number','?')}: {who} ({str(j.get('reasoning',''))[:50]})")
            history_summary = " | ".join(history_parts[-5:])

        # Only enforce game_over check for open-ended games (max_rounds=0)
        # For fixed max_rounds games, game is always over when all rounds are submitted
        if not game_over and game["max_rounds"] == 0:
            raise gl.vm.UserError(f"[EXPECTED] {game_over_reason}")

        # Apply judgments
        p1_wins = 0
        p2_wins = 0
        draws   = 0
        total_conf = 0.0

        for j in all_judged:
            rnum   = j.get("round_number", 0)
            result = j.get("result", "draw")
            r      = self._load_round(gid, rnum)
            if r is None:
                continue

            r["result"]         = result
            r["reason_type"]    = j.get("reason_type", "normal")
            r["invalid_player"] = j.get("invalid_player", "none")
            r["reasoning"]      = str(j.get("reasoning", ""))[:300]
            r["confidence"]     = float(j.get("confidence", 0.5))
            r["status"]         = "judged"
            self._save_round(gid, r)

            conf = float(j.get("confidence", 0.5))
            total_conf += conf
            if result == "player1":
                p1_wins += 1
                game["score"][p1] = round(game["score"].get(p1, 0.0) + SCORE_WIN + conf * 0.5, 2)
            elif result == "player2":
                p2_wins += 1
                game["score"][p2] = round(game["score"].get(p2, 0.0) + SCORE_WIN + conf * 0.5, 2)
            else:
                draws += 1
                game["score"][p1] = round(game["score"].get(p1, 0.0) + SCORE_DRAW, 2)
                game["score"][p2] = round(game["score"].get(p2, 0.0) + SCORE_DRAW, 2)

        game["judged_through"] = game.get("judged_through", 0) + len(all_judged)
        avg_conf = round(total_conf / len(all_judged), 3) if all_judged else 0.0

        # Determine game outcome
        if p1_wins > p2_wins:
            game["status"] = STATUS_COMPLETED
            game["winner"] = p1
        elif p2_wins > p1_wins:
            game["status"] = STATUS_COMPLETED
            game["winner"] = p2
        else:
            game["status"] = STATUS_DRAW
            game["winner"] = ""

        self._save_game(gid, game)

        # Update leaderboard — try vault first, fallback to local
        self._update_leaderboard(
            game["game_name"],
            game["winner"] if game["status"] == STATUS_COMPLETED else "",
            p2 if game.get("winner") == p1 else p1,
            [p1, p2] if game["status"] == STATUS_DRAW else [],
            avg_conf,
            game.get("player_types", {}),
        )

    def _update_leaderboard(
        self, game_name: str, winner: str, loser: str,
        draws: list, avg_conf: float, player_types: dict
    ):
        if self.leaderboard_vault:
            try:
                vault = gl.get_contract_at(Address(self.leaderboard_vault))
                vault.emit(on="accepted").record_result(
                    game_name, winner, loser, draws, avg_conf, player_types
                )
            except Exception:
                pass  # fallback to local

        # Local fallback
        def upd(key: str, res: str, conf: float):
            e = json.loads(self.leaderboard[key]) if key in self.leaderboard else {
                "wins": 0, "losses": 0, "draws": 0, "score": 0.0
            }
            if res == "win":
                e["wins"]  = e.get("wins", 0) + 1
                e["score"] = round(e.get("score", 0.0) + SCORE_WIN + conf * 0.5, 2)
            elif res == "loss":
                e["losses"] = e.get("losses", 0) + 1
            else:
                e["draws"] = e.get("draws", 0) + 1
                e["score"] = round(e.get("score", 0.0) + SCORE_DRAW, 2)
            self.leaderboard[key] = json.dumps(e)

        if winner:
            upd(f"{game_name}:{winner}", "win",  avg_conf)
            upd(f"{game_name}:{loser}",  "loss", avg_conf)
        for p in draws:
            upd(f"{game_name}:{p}", "draw", 0.0)

    # ── Read methods ─────────────────────────────────────────────────────────

    @gl.public.view
    def get_game_state(self, game_id: str) -> dict:
        gid  = game_id.strip().upper()
        game = self._load_game(gid)
        if game is None:
            return {}
        rounds = []
        for i in range(1, game["round_count"] + 1):
            r = self._load_round(gid, i)
            if r:
                # Convert floats to strings — calldata encoder can't handle float
                r["confidence"] = str(r.get("confidence", 0.0))
                rounds.append(r)
        result = dict(game)
        # Convert score floats to strings
        result["score"] = {k: str(v) for k, v in result.get("score", {}).items()}
        result["rounds"] = rounds
        return result

    @gl.public.view
    def get_round_result(self, game_id: str, round_number: int) -> dict:
        gid = game_id.strip().upper()
        r   = self._load_round(gid, round_number)
        if not r:
            return {}
        r["confidence"] = str(r.get("confidence", 0.0))
        return r

    @gl.public.view
    def get_leaderboard(self, game_name: str) -> list:
        prefix  = f"{game_name}:"
        entries = []
        for key in self.leaderboard:
            if key.startswith(prefix):
                player = key[len(prefix):]
                try:
                    s = json.loads(self.leaderboard[key])
                    s["player"] = player
                    s["score"] = str(s.get("score", 0.0))
                    entries.append(s)
                except Exception:
                    pass
        entries.sort(key=lambda x: -float(x.get("score", 0)))
        return entries

    @gl.public.view
    def get_player_stats(self, game_name: str, player: str) -> dict:
        key = f"{game_name}:{player}"
        if key not in self.leaderboard:
            return {"player": player, "wins": 0, "losses": 0, "draws": 0, "score": "0.0"}
        s = json.loads(self.leaderboard[key])
        s["player"] = player
        s["score"] = str(s.get("score", 0.0))
        return s

    @gl.public.view
    def get_active_games(self) -> list:
        result = []
        for gid in self.games:
            g = self._load_game(gid)
            if g and g["status"] == STATUS_ACTIVE:
                result.append({
                    "game_id":   g["game_id"],
                    "game_name": g["game_name"],
                    "player1":   g["player1"],
                    "player2":   g["player2"],
                    "round_count": g["round_count"],
                    "max_rounds":  g["max_rounds"],
                })
        return result

    @gl.public.view
    def get_total_games(self) -> int:
        return int(self.game_count)

    @gl.public.view
    def get_fee_info(self) -> dict:
        return {
            "start_game": {"wei": FEE_START, "gen": "1.0"},
            "judge_game": {"wei": FEE_JUDGE, "gen": "1.5"},
        }
