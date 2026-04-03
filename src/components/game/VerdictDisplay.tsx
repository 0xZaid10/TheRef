"use client";

import { motion }        from "framer-motion";
import { GameState }     from "@/lib/contracts";
import { Badge, VoteBadge } from "@/components/ui/Badge";
import { Card, CardDivider } from "@/components/ui/Card";
import {
  formatScore,
  formatConf,
  shortModel,
  cn,
} from "@/lib/utils";

interface VerdictDisplayProps {
  gameState:  GameState;
  validators?: Array<{ model: string; vote: string; address: string }>;
}

export function VerdictDisplay({ gameState, validators = [] }: VerdictDisplayProps) {
  const isDraw      = gameState.status === "draw";
  const isCompleted = gameState.status === "completed";
  const winner      = gameState.winner;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y:  0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col gap-4"
    >
      {/*  Verdict banner  */}
      <Card variant={isCompleted ? "highlight" : "default"} className="relative overflow-hidden">
        {isCompleted && (
          <div className="absolute inset-0 bg-gradient-to-br from-ref/5 to-transparent pointer-events-none" />
        )}

        <div className="relative z-10 flex flex-col sm:flex-row items-center gap-4">
          {/* Trophy / Draw icon */}
          <div className={cn(
            "w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shrink-0",
            isDraw
              ? "bg-draw/10 border border-draw/20"
              : isCompleted
                ? "bg-ref/10 border border-ref/25"
                : "bg-line border border-line"
          )}>
            {isDraw ? "🤝" : isCompleted ? "🏆" : "⏳"}
          </div>

          <div className="text-center sm:text-left flex-1">
            <p className="text-xs text-mist font-mono uppercase tracking-wider mb-1">
              Judgment Complete
            </p>
            {isDraw ? (
              <h2 className="font-display text-2xl font-700 text-draw">
                Draw
              </h2>
            ) : isCompleted ? (
              <h2 className="font-display text-2xl font-700 text-chalk">
                <span className="text-ref">{winner}</span> wins
              </h2>
            ) : (
              <h2 className="font-display text-2xl font-700 text-mist">
                {gameState.status}
              </h2>
            )}

            {/* Score row */}
            <div className="flex items-center gap-4 mt-2 justify-center sm:justify-start">
              {Object.entries(gameState.score || {}).map(([player, score]) => (
                <div key={player} className="flex items-center gap-1.5">
                  <span className={cn(
                    "text-sm font-500",
                    player === winner ? "text-ref" : "text-mist"
                  )}>
                    {player}
                  </span>
                  <span className="font-mono text-sm font-700 text-chalk">
                    {formatScore(score)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/*  Round breakdown  */}
      {(gameState.rounds ?? []).length > 0 && (
        <Card>
          <h3 className="font-display font-600 text-chalk text-sm mb-3">
            Round Breakdown
          </h3>
          <div className="flex flex-col gap-3">
            {gameState.rounds.map((round) => (
              <RoundRow
                key={round.round_number}
                round={round}
                player1={gameState.player1}
                player2={gameState.player2}
              />
            ))}
          </div>
        </Card>
      )}

      {/*  Validator consensus  */}
      {validators.length > 0 && (
        <Card>
          <h3 className="font-display font-600 text-chalk text-sm mb-3">
            Validator Consensus
          </h3>
          <div className="flex flex-col gap-2">
            {validators.map((v, i) => (
              <div
                key={i}
                className="flex items-center justify-between gap-3
                           px-3 py-2 rounded-lg bg-pitch border border-line"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className={cn(
                    "w-1.5 h-1.5 rounded-full shrink-0",
                    v.vote === "AGREE"    ? "bg-agree" :
                    v.vote === "TIMEOUT"  ? "bg-timeout" : "bg-disagree"
                  )} />
                  <span className="font-mono text-xs text-chalk truncate">
                    {shortModel(v.model)}
                  </span>
                </div>
                <VoteBadge vote={v.vote} />
              </div>
            ))}
          </div>
          <p className="text-[11px] text-mist mt-3 text-center font-mono">
            {validators.filter(v => v.vote === "AGREE").length}/{validators.length} validators agreed
          </p>
        </Card>
      )}
    </motion.div>
  );
}

//  Round row 

function RoundRow({
  round,
  player1,
  player2,
}: {
  round:   NonNullable<GameState["rounds"]>[0];
  player1: string;
  player2: string;
}) {
  const winner =
    round.result === "player1" ? player1 :
    round.result === "player2" ? player2 : null;

  return (
    <div className="rounded-xl border border-line overflow-hidden">
      {/* Round header */}
      <div className="flex items-center justify-between px-3 py-2 bg-pitch">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-mist">
            Round {round.round_number}
          </span>
          {round.reason_type && round.reason_type !== "normal" && (
            <Badge variant="pending" size="sm">
              {round.reason_type}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          {winner ? (
            <Badge variant="win" size="sm">
              {winner} wins
            </Badge>
          ) : (
            <Badge variant="draw" size="sm">Draw</Badge>
          )}
          {round.confidence && (
            <span className="font-mono text-[11px] text-mist">
              {formatConf(round.confidence)}
            </span>
          )}
        </div>
      </div>

      {/* Moves */}
      <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-line">
        <MoveCell player={player1} move={round.move_player1} isWinner={round.result === "player1"} />
        <MoveCell player={player2} move={round.move_player2} isWinner={round.result === "player2"} />
      </div>

      {/* Reasoning */}
      {round.reasoning && (
        <div className="px-3 py-2 border-t border-line bg-turf/50">
          <p className="text-xs text-mist leading-relaxed">
            <span className="text-mist/50 font-mono mr-1">AI:</span>
            {round.reasoning}
          </p>
        </div>
      )}
    </div>
  );
}

function MoveCell({
  player,
  move,
  isWinner,
}: {
  player:   string;
  move:     string;
  isWinner: boolean;
}) {
  return (
    <div className={cn(
      "px-3 py-2.5",
      isWinner ? "bg-ref/5" : ""
    )}>
      <div className="flex items-center gap-1.5 mb-1">
        <span className={cn(
          "text-[11px] font-mono font-500",
          isWinner ? "text-ref" : "text-mist"
        )}>
          {player}
        </span>
        {isWinner && <span className="text-[10px] text-ref">✓</span>}
      </div>
      <p className="text-sm text-chalk leading-snug">
        {move || <span className="text-mist italic">No move</span>}
      </p>
    </div>
  );
}
