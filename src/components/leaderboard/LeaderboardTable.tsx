"use client";

import { motion }         from "framer-motion";
import { LeaderboardEntry } from "@/lib/contracts";
import { Badge }          from "@/components/ui/Badge";
import { Card }           from "@/components/ui/Card";
import { formatScore, cn } from "@/lib/utils";

interface LeaderboardTableProps {
  entries:    LeaderboardEntry[];
  loading?:   boolean;
  gameName?:  string;
}

const MEDALS = ["🥇", "🥈", "🥉"];

export function LeaderboardTable({
  entries,
  loading = false,
  gameName,
}: LeaderboardTableProps) {
  if (loading) {
    return (
      <div className="flex flex-col gap-2">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="h-14 rounded-xl bg-turf border border-line animate-pulse"
            style={{ opacity: 1 - i * 0.15 }}
          />
        ))}
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <Card className="text-center py-12">
        <p className="text-3xl mb-3">🏆</p>
        <p className="text-chalk font-500">No entries yet</p>
        <p className="text-mist text-sm mt-1">
          Play some games to see rankings appear here
        </p>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {entries.map((entry, i) => (
        <motion.div
          key={entry.player}
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x:   0 }}
          transition={{ duration: 0.3, delay: i * 0.04 }}
        >
          <LeaderboardRow entry={entry} rank={i + 1} />
        </motion.div>
      ))}
    </div>
  );
}

//  Single row 

function LeaderboardRow({
  entry,
  rank,
}: {
  entry: LeaderboardEntry;
  rank:  number;
}) {
  const isTop3    = rank <= 3;
  const isFirst   = rank === 1;
  const winRate   = entry.wins + entry.losses + entry.draws > 0
    ? Math.round((entry.wins / (entry.wins + entry.losses + entry.draws)) * 100)
    : 0;

  return (
    <div
      className={cn(
        "flex items-center gap-3 px-4 py-3 rounded-xl border",
        "transition-all duration-200 group",
        isFirst
          ? "bg-ref/8 border-ref/30 hover:border-ref/50"
          : isTop3
            ? "bg-turf border-line hover:border-mist/30"
            : "bg-turf border-line hover:border-line/80"
      )}
    >
      {/* Rank */}
      <div className="w-8 shrink-0 text-center">
        {isTop3 ? (
          <span className="text-lg">{MEDALS[rank - 1]}</span>
        ) : (
          <span className="font-mono text-sm text-mist">{rank}</span>
        )}
      </div>

      {/* Player info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={cn(
            "font-display font-600 truncate",
            isFirst ? "text-ref text-base" : "text-chalk text-sm"
          )}>
            {entry.player}
          </span>
          {entry.player_type && (
            <Badge
              variant={entry.player_type === "agent" ? "ref" : "default"}
              size="sm"
            >
              {entry.player_type}
            </Badge>
          )}
        </div>

        {/* W/L/D mini row */}
        <div className="flex items-center gap-3 mt-0.5">
          <StatPill label="W" value={entry.wins}   color="text-win" />
          <StatPill label="L" value={entry.losses} color="text-loss" />
          <StatPill label="D" value={entry.draws}  color="text-draw" />
          <span className="text-[11px] text-mist font-mono">
            {winRate}% WR
          </span>
        </div>
      </div>

      {/* Score */}
      <div className="shrink-0 text-right">
        <div className={cn(
          "font-display font-800 tabular-nums",
          isFirst ? "text-ref text-xl" : "text-chalk text-lg"
        )}>
          {formatScore(entry.score)}
        </div>
        <div className="text-[10px] text-mist font-mono uppercase tracking-wider">
          pts
        </div>
      </div>
    </div>
  );
}

function StatPill({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <span className="flex items-center gap-0.5">
      <span className={cn("text-[11px] font-mono font-500", color)}>{label}</span>
      <span className="text-[11px] font-mono text-mist">{value}</span>
    </span>
  );
}
