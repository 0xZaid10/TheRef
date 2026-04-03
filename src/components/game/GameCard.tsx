import { ActiveGame }    from "@/lib/contracts";
import { Badge }          from "@/components/ui/Badge";
import { Card }           from "@/components/ui/Card";
import { cn }             from "@/lib/utils";

interface GameCardProps {
  game:     ActiveGame;
  onClick?: () => void;
  active?:  boolean;
}

export function GameCard({ game, onClick, active }: GameCardProps) {
  return (
    <Card
      hover={!!onClick}
      onClick={onClick}
      variant={active ? "highlight" : "default"}
      className={cn("cursor-pointer", active && "border-ref/40")}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          {/* Header row */}
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <Badge variant="active" dot size="sm">Active</Badge>
            <span className="font-mono text-[11px] text-mist">
              #{game.game_id}
            </span>
          </div>

          {/* Game name */}
          <h3 className="font-display font-600 text-chalk text-base truncate">
            {game.game_name}
          </h3>

          {/* Players */}
          <div className="flex items-center gap-2 mt-1.5">
            <span className="text-sm text-chalk font-500">{game.player1}</span>
            <span className="text-xs text-mist font-mono">vs</span>
            <span className="text-sm text-chalk font-500">{game.player2}</span>
          </div>
        </div>

        {/* Round info */}
        <div className="shrink-0 text-right">
          <div className="font-mono text-xs text-mist">
            Round
          </div>
          <div className="font-display text-xl font-700 text-chalk">
            {game.round_count}
            {game.max_rounds > 0 && (
              <span className="text-mist text-sm font-400">
                /{game.max_rounds}
              </span>
            )}
          </div>
          {game.max_rounds === 0 && (
            <div className="text-[10px] text-mist font-mono">open</div>
          )}
        </div>
      </div>
    </Card>
  );
}
