"use client";

import { useState }   from "react";
import { useNetwork } from "@/context/NetworkContext";
import { submitMove } from "@/lib/contracts";
import { Button }     from "@/components/ui/Button";
import { Textarea }   from "@/components/ui/Input";
import { TxPending }  from "@/components/ui/Spinner";
import { Card }       from "@/components/ui/Card";

interface MoveInputProps {
  gameId:     string;
  playerName: string;
  roundNum:   number;
  onSubmitted?: (result: string) => void;
}

export function MoveInput({
  gameId,
  playerName,
  roundNum,
  onSubmitted,
}: MoveInputProps) {
  const { network } = useNetwork();
  const [move,    setMove]    = useState("");
  const [loading, setLoading] = useState(false);
  const [txHash,  setTxHash]  = useState("");
  const [error,   setError]   = useState("");
  const [done,    setDone]    = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!network || !move.trim()) return;
    setError("");
    setLoading(true);

    try {
      const result = await submitMove(network, gameId, playerName, move.trim());
      setTxHash(result.txHash);
      setDone(true);
      onSubmitted?.(result.payload);
    } catch (err: any) {
      setError(String(err?.message ?? err).slice(0, 120));
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <Card className="border-win/20 bg-win/5">
        <div className="flex items-center gap-3">
          <span className="text-win text-xl">✓</span>
          <div>
            <p className="text-sm font-500 text-chalk">Move submitted</p>
            <p className="text-xs text-mist font-mono mt-0.5 truncate">
              {txHash.slice(0, 32)}...
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <p className="text-xs text-mist font-mono uppercase tracking-wider mb-3">
        {playerName} - Round {roundNum}
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <Textarea
          placeholder="Enter your move..."
          value={move}
          onChange={(e) => setMove(e.target.value)}
          rows={3}
          disabled={loading}
        />

        {error && (
          <p className="text-xs text-loss">{error}</p>
        )}

        {loading && (
          <TxPending
            message="Submitting move..."
            txHash={txHash || undefined}
          />
        )}

        <Button
          type="submit"
          loading={loading}
          disabled={!move.trim()}
          className="w-full"
        >
          Submit Move
        </Button>
      </form>
    </Card>
  );
}
