"use client";

import { useState, useEffect } from "react";
import { motion }              from "framer-motion";
import { useNetwork }          from "@/context/NetworkContext";
import {
  getCoreLeaderboard,
  getVaultLeaderboard,
  LeaderboardEntry,
} from "@/lib/contracts";
import { LeaderboardTable }  from "@/components/leaderboard/LeaderboardTable";
import { PlayerStatsLookup } from "@/components/leaderboard/PlayerStats";
import { Button }            from "@/components/ui/Button";
import { Input }             from "@/components/ui/Input";
import { Badge }             from "@/components/ui/Badge";
import { cn }                from "@/lib/utils";

const POPULAR_GAMES = [
  "Trivia",
  "Rock Paper Scissors",
  "Chess",
  "Debate",
  "Riddle",
];

type PlayerType = "all" | "human" | "agent";
type Source     = "core" | "vault";

export default function LeaderboardPage() {
  const { network } = useNetwork();

  const [gameName,    setGameName]    = useState("Trivia");
  const [customGame,  setCustomGame]  = useState("");
  const [playerType,  setPlayerType]  = useState<PlayerType>("all");
  const [source,      setSource]      = useState<Source>("core");
  const [entries,     setEntries]     = useState<LeaderboardEntry[]>([]);
  const [loading,     setLoading]     = useState(false);

  const activeGame = customGame.trim() || gameName;

  useEffect(() => {
    if (!network || !activeGame) return;
    load();
  }, [network, activeGame, playerType, source]);

  async function load() {
    if (!network) return;
    setLoading(true);
    try {
      let data: LeaderboardEntry[] = [];
      if (source === "vault") {
        data = await getVaultLeaderboard(network, activeGame, playerType);
      } else {
        data = await getCoreLeaderboard(network, activeGame);
        // Filter by player type client-side for core lb
        if (playerType !== "all") {
          data = data.filter(e => (e.player_type ?? "human") === playerType);
        }
      }
      setEntries(data);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page">
      <div className="container-ref">

        {/*  Header  */}
        <div className="mb-8">
          <h1 className="font-display text-3xl font-800 text-chalk">
            Leaderboard
          </h1>
          <p className="text-mist text-sm mt-1">
            Rankings across all games and players
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/*  Left: controls  */}
          <div className="flex flex-col gap-4">

            {/* Game selector */}
            <div>
              <p className="text-xs text-mist uppercase font-mono tracking-wider mb-2">
                Select Game
              </p>
              <div className="flex flex-wrap gap-2 mb-3">
                {POPULAR_GAMES.map((g) => (
                  <button
                    key={g}
                    onClick={() => { setGameName(g); setCustomGame(""); }}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-500 transition-all duration-150",
                      gameName === g && !customGame
                        ? "bg-ref text-pitch"
                        : "bg-line text-mist hover:text-chalk"
                    )}
                  >
                    {g}
                  </button>
                ))}
              </div>
              <Input
                placeholder="Or search any game..."
                value={customGame}
                onChange={(e) => setCustomGame(e.target.value)}
                prefix="🔍"
              />
            </div>

            {/* Player type filter */}
            <div>
              <p className="text-xs text-mist uppercase font-mono tracking-wider mb-2">
                Player Type
              </p>
              <div className="flex gap-2">
                {(["all", "human", "agent"] as PlayerType[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => setPlayerType(t)}
                    className={cn(
                      "flex-1 py-1.5 rounded-lg text-xs font-500 capitalize transition-all",
                      playerType === t
                        ? "bg-ref text-pitch"
                        : "bg-line text-mist hover:text-chalk"
                    )}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Source toggle */}
            <div>
              <p className="text-xs text-mist uppercase font-mono tracking-wider mb-2">
                Data Source
              </p>
              <div className="flex gap-2">
                {([
                  { id: "core",  label: "RefereeCore" },
                  { id: "vault", label: "Vault" },
                ] as { id: Source; label: string }[]).map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setSource(s.id)}
                    className={cn(
                      "flex-1 py-1.5 rounded-lg text-xs font-500 transition-all",
                      source === s.id
                        ? "bg-line text-chalk border border-ref/30"
                        : "bg-line/50 text-mist hover:text-chalk"
                    )}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-mist mt-1.5 font-mono">
                {source === "core"
                  ? "Local fallback - always available"
                  : "Cross-game vault - updates after each judgment"}
              </p>
            </div>

            {/* Refresh */}
            <Button
              variant="secondary"
              onClick={load}
              loading={loading}
              className="w-full"
            >
              Refresh
            </Button>

            {/* Player lookup */}
            <PlayerStatsLookup gameName={activeGame} />
          </div>

          {/*  Right: leaderboard  */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <h2 className="font-display font-700 text-chalk text-lg">
                  {activeGame}
                </h2>
                <Badge variant="ref" size="sm">
                  {entries.length} players
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <Badge
                  variant={playerType === "all" ? "default" : playerType === "human" ? "win" : "ref"}
                  size="sm"
                >
                  {playerType}
                </Badge>
              </div>
            </div>

            <motion.div
              key={`${activeGame}-${playerType}-${source}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <LeaderboardTable
                entries={entries}
                loading={loading}
                gameName={activeGame}
              />
            </motion.div>

            {/* Scoring explanation */}
            {entries.length > 0 && (
              <div className="mt-4 px-4 py-3 rounded-xl bg-turf border border-line">
                <p className="text-[11px] text-mist font-mono">
                  <span className="text-chalk">Scoring:</span>{" "}
                  Win = 3.0 + (confidence x 0.5) pts . Draw = 1.0 pt . Loss = 0 pts
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
