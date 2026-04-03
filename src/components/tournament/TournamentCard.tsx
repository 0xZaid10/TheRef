import { Badge }     from "@/components/ui/Badge";
import { Card }      from "@/components/ui/Card";
import { cn }        from "@/lib/utils";

interface TournamentSummary {
  tid:         string;
  name:        string;
  format:      string;
  status:      string;
  players:     number;
  max_players: number;
  prize_pool:  number;
}

interface TournamentCardProps {
  tournament: TournamentSummary;
  onClick?:   () => void;
  active?:    boolean;
}

const FORMAT_ICONS: Record<string, string> = {
  single_elimination: "🏆",
  round_robin:        "🔄",
  swiss:              "⚡",
};

const FORMAT_LABELS: Record<string, string> = {
  single_elimination: "Single Elim",
  round_robin:        "Round Robin",
  swiss:              "Swiss",
};

export function TournamentCard({
  tournament,
  onClick,
  active,
}: TournamentCardProps) {
  const fillPct = tournament.max_players > 0
    ? Math.round((tournament.players / tournament.max_players) * 100)
    : 0;

  return (
    <Card
      hover={!!onClick}
      onClick={onClick}
      variant={active ? "highlight" : "default"}
      className={cn("cursor-pointer", active && "border-ref/40")}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <Badge
              variant={
                tournament.status === "completed" ? "completed" :
                tournament.status === "active"    ? "active"    : "pending"
              }
              dot
              size="sm"
            >
              {tournament.status}
            </Badge>
            <span className="font-mono text-[11px] text-mist">
              {tournament.tid}
            </span>
          </div>
          <h3 className="font-display font-600 text-chalk truncate">
            {tournament.name}
          </h3>
        </div>

        {/* Format icon */}
        <div className="shrink-0 w-9 h-9 rounded-xl bg-pitch border border-line
                        flex items-center justify-center text-lg">
          {FORMAT_ICONS[tournament.format] ?? "🏟"}
        </div>
      </div>

      {/* Format + players */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-mist font-mono">
          {FORMAT_LABELS[tournament.format] ?? tournament.format}
        </span>
        <span className="text-xs text-chalk font-mono">
          {tournament.players}
          <span className="text-mist">/{tournament.max_players}</span>
          {" "}players
        </span>
      </div>

      {/* Fill bar */}
      <div className="h-1 rounded-full bg-line overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500",
            tournament.status === "completed" ? "bg-mist" :
            fillPct === 100               ? "bg-win"  : "bg-ref"
          )}
          style={{ width: `${fillPct}%` }}
        />
      </div>

      {/* Prize pool */}
      {tournament.prize_pool > 0 && (
        <p className="text-[11px] text-mist font-mono mt-2">
          Prize pool: {tournament.prize_pool / 1e18} GEN
        </p>
      )}
    </Card>
  );
}
