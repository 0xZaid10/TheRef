"use client";

import { useState }    from "react";
import { useNetwork }  from "@/context/NetworkContext";
import { getPlayerStats, PlayerStats as PS } from "@/lib/contracts";
import { Button }      from "@/components/ui/Button";
import { Input }       from "@/components/ui/Input";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge }       from "@/components/ui/Badge";
import { Spinner }     from "@/components/ui/Spinner";
import { formatScore, cn } from "@/lib/utils";

interface PlayerStatsProps {
  gameName?: string;
}

export function PlayerStatsLookup({ gameName = "" }: PlayerStatsProps) {
  const { network }  = useNetwork();
  const [name,       setName]    = useState("");
  const [game,       setGame]    = useState(gameName);
  const [stats,      setStats]   = useState<PS | null>(null);
  const [loading,    setLoading] = useState(false);
  const [searched,   setSearched] = useState(false);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!network || !name.trim() || !game.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const result = await getPlayerStats(network, game.trim(), name.trim());
      setStats(result);
    } finally {
      setLoading(false);
    }
  }

  const total   = stats ? stats.wins + stats.losses + (stats.draws ?? 0) : 0;
  const winRate = total > 0
    ? Math.round((stats!.wins / total) * 100)
    : 0;

  return (
    <Card>
      <CardHeader title="Player Lookup" subtitle="Search stats for any player" />

      <form onSubmit={handleSearch} className="flex flex-col gap-3 mb-4">
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Game"
            placeholder="e.g. Trivia"
            value={game}
            onChange={(e) => setGame(e.target.value)}
          />
          <Input
            label="Player"
            placeholder="e.g. Zaid"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <Button
          type="submit"
          variant="secondary"
          loading={loading}
          disabled={!name.trim() || !game.trim()}
        >
          Search
        </Button>
      </form>

      {loading && (
        <div className="flex justify-center py-6">
          <Spinner />
        </div>
      )}

      {!loading && searched && stats && (
        <div className="flex flex-col gap-3 animate-fade-in">
          {/* Player header */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-pitch border border-line">
            <div className="w-10 h-10 rounded-xl bg-ref/10 border border-ref/20
                            flex items-center justify-center font-display font-800 text-ref text-lg">
              {stats.player[0]?.toUpperCase() ?? "?"}
            </div>
            <div>
              <p className="font-display font-700 text-chalk">{stats.player}</p>
              <p className="text-xs text-mist font-mono">{game}</p>
            </div>
            <div className="ml-auto">
              <div className="font-display text-2xl font-800 text-ref text-right">
                {formatScore(stats.score)}
              </div>
              <div className="text-[10px] text-mist font-mono uppercase text-right">
                points
              </div>
            </div>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-4 gap-2">
            {[
              { label: "Wins",   value: stats.wins,   color: "text-win" },
              { label: "Losses", value: stats.losses, color: "text-loss" },
              { label: "Draws",  value: stats.draws ?? 0,  color: "text-draw" },
              { label: "Win %",  value: `${winRate}%`, color: "text-ref" },
            ].map((s) => (
              <div
                key={s.label}
                className="flex flex-col items-center py-3 rounded-xl bg-pitch border border-line"
              >
                <span className={cn("font-display font-800 text-xl", s.color)}>
                  {s.value}
                </span>
                <span className="text-[10px] text-mist font-mono uppercase tracking-wider mt-0.5">
                  {s.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {!loading && searched && !stats && (
        <p className="text-center text-mist text-sm py-4">
          No stats found for <span className="text-chalk">{name}</span> in <span className="text-chalk">{game}</span>
        </p>
      )}
    </Card>
  );
}
