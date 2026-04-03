"use client";

import { useState }    from "react";
import { useNetwork }  from "@/context/NetworkContext";
import { BracketMatch, recordMatchResult } from "@/lib/contracts";
import { Badge }       from "@/components/ui/Badge";
import { Button }      from "@/components/ui/Button";
import { TxPending }   from "@/components/ui/Spinner";
import { cn }          from "@/lib/utils";

interface BracketViewProps {
  tid:      string;
  matches:  BracketMatch[];
  onUpdate?: () => void;
}

export function BracketView({ tid, matches, onUpdate }: BracketViewProps) {
  // Group matches by round
  const rounds = matches.reduce<Record<number, BracketMatch[]>>((acc, m) => {
    if (!acc[m.round]) acc[m.round] = [];
    acc[m.round].push(m);
    return acc;
  }, {});

  const roundNums = Object.keys(rounds).map(Number).sort((a, b) => a - b);

  if (matches.length === 0) {
    return (
      <div className="text-center py-10 text-mist text-sm">
        <p className="text-2xl mb-2">🏟</p>
        Bracket not generated yet.
        <br />Start the tournament to generate matches.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {roundNums.map((round) => (
        <div key={round}>
          <div className="flex items-center gap-3 mb-3">
            <span className="text-xs text-mist font-mono uppercase tracking-wider">
              Round {round}
            </span>
            <div className="flex-1 h-px bg-line" />
            <span className="text-[11px] text-mist font-mono">
              {rounds[round].filter(m => m.status === "completed").length}/
              {rounds[round].length} done
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {rounds[round].map((match) => (
              <MatchCard
                key={match.match_id}
                tid={tid}
                match={match}
                onUpdate={onUpdate}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

//  Single match card 

function MatchCard({
  tid,
  match,
  onUpdate,
}: {
  tid:      string;
  match:    BracketMatch;
  onUpdate?: () => void;
}) {
  const { network }  = useNetwork();
  const [recording,  setRecording]  = useState(false);
  const [txHash,     setTxHash]     = useState("");
  const [error,      setError]      = useState("");
  const isDone = match.status === "completed";
  const isBye  = match.player2 === "BYE";

  async function handleRecord(winner: string) {
    if (!network) return;
    setError("");
    setRecording(true);
    try {
      const result = await recordMatchResult(network, tid, match.match_id, winner);
      setTxHash(result.txHash);
      onUpdate?.();
    } catch (err: any) {
      setError(String(err?.message ?? err).slice(0, 100));
    } finally {
      setRecording(false);
    }
  }

  return (
    <div className={cn(
      "rounded-xl border overflow-hidden transition-all duration-200",
      isDone ? "border-line bg-turf/50" : "border-ref/20 bg-turf"
    )}>
      {/* Match header */}
      <div className="flex items-center justify-between px-3 py-2
                      border-b border-line bg-pitch">
        <span className="font-mono text-[11px] text-mist">
          Match #{match.match_id}
        </span>
        <Badge
          variant={isDone ? "completed" : "pending"}
          dot
          size="sm"
        >
          {isDone ? "done" : "pending"}
        </Badge>
      </div>

      {/* Players */}
      <div className="p-3 flex flex-col gap-1.5">
        <PlayerRow
          name={match.player1}
          isWinner={match.winner === match.player1}
          isDone={isDone}
        />
        <div className="text-center text-[10px] text-mist font-mono">vs</div>
        <PlayerRow
          name={match.player2}
          isWinner={match.winner === match.player2}
          isDone={isDone}
          isBye={isBye}
        />
      </div>

      {/* Record result - only for pending non-bye matches */}
      {!isDone && !isBye && (
        <div className="px-3 pb-3 flex flex-col gap-2">
          {recording ? (
            <TxPending message="Recording result..." txHash={txHash || undefined} />
          ) : (
            <>
              <p className="text-[11px] text-mist text-center font-mono">
                Record winner:
              </p>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleRecord(match.player1)}
                >
                  {match.player1}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleRecord(match.player2)}
                >
                  {match.player2}
                </Button>
              </div>
            </>
          )}
          {error && <p className="text-[11px] text-loss">{error}</p>}
        </div>
      )}
    </div>
  );
}

function PlayerRow({
  name,
  isWinner,
  isDone,
  isBye = false,
}: {
  name:     string;
  isWinner: boolean;
  isDone:   boolean;
  isBye?:   boolean;
}) {
  return (
    <div className={cn(
      "flex items-center justify-between px-2.5 py-1.5 rounded-lg transition-all",
      isBye
        ? "opacity-40"
        : isWinner
          ? "bg-ref/10 border border-ref/25"
          : isDone
            ? "opacity-60"
            : "bg-pitch border border-line"
    )}>
      <span className={cn(
        "text-sm font-500",
        isWinner ? "text-ref" : "text-chalk"
      )}>
        {name}
      </span>
      {isWinner && <span className="text-xs text-ref">🏆</span>}
      {isBye    && <span className="text-[11px] text-mist font-mono">BYE</span>}
    </div>
  );
}
