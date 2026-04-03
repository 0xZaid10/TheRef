import { Standing }  from "@/lib/contracts";
import { Badge }     from "@/components/ui/Badge";
import { cn }        from "@/lib/utils";

interface StandingsProps {
  standings: Standing[];
  winner?:   string;
}

export function Standings({ standings, winner }: StandingsProps) {
  if (standings.length === 0) {
    return (
      <p className="text-center text-mist text-sm py-6">
        No standings yet
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      {/* Header */}
      <div className="grid grid-cols-[2rem_1fr_2rem_2rem_2rem_3rem]
                      gap-2 px-3 py-1.5 text-[10px] font-mono text-mist
                      uppercase tracking-wider">
        <span>#</span>
        <span>Player</span>
        <span className="text-center text-win">W</span>
        <span className="text-center text-loss">L</span>
        <span className="text-center text-draw">D</span>
        <span className="text-right">Pts</span>
      </div>

      {standings.map((s, i) => {
        const isChamp     = s.player === winner;
        const isElim      = s.eliminated;
        return (
          <div
            key={s.player}
            className={cn(
              "grid grid-cols-[2rem_1fr_2rem_2rem_2rem_3rem]",
              "gap-2 px-3 py-2.5 rounded-xl items-center",
              "border transition-all duration-200",
              isChamp
                ? "bg-ref/8 border-ref/30"
                : isElim
                  ? "bg-turf border-line opacity-50"
                  : "bg-turf border-line"
            )}
          >
            {/* Rank */}
            <span className="font-mono text-xs text-mist text-center">
              {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : i + 1}
            </span>

            {/* Player */}
            <div className="flex items-center gap-2 min-w-0">
              <span className={cn(
                "font-display font-600 truncate text-sm",
                isChamp ? "text-ref" : "text-chalk"
              )}>
                {s.player}
              </span>
              {isChamp && (
                <Badge variant="ref" size="sm">Champion</Badge>
              )}
              {s.type === "agent" && (
                <Badge variant="default" size="sm">agent</Badge>
              )}
              {isElim && (
                <Badge variant="completed" size="sm">out</Badge>
              )}
            </div>

            {/* W / L / D */}
            <span className="text-center font-mono text-sm text-win font-500">
              {s.wins}
            </span>
            <span className="text-center font-mono text-sm text-loss font-500">
              {s.losses}
            </span>
            <span className="text-center font-mono text-sm text-draw font-500">
              {s.draws}
            </span>

            {/* Points */}
            <span className={cn(
              "text-right font-display font-700 text-base",
              isChamp ? "text-ref" : "text-chalk"
            )}>
              {s.points}
            </span>
          </div>
        );
      })}
    </div>
  );
}
