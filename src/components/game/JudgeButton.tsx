"use client";

import { useState }   from "react";
import { useNetwork } from "@/context/NetworkContext";
import { judgeGame, endGame } from "@/lib/contracts";
import { Button }     from "@/components/ui/Button";
import { TxPending }  from "@/components/ui/Spinner";
import { parseVerdict } from "@/lib/utils";

interface JudgeButtonProps {
  gameId:       string;
  isOpenEnded?: boolean;
  onJudged?:    (verdict: ReturnType<typeof parseVerdict>) => void;
  className?:   string;
}

export function JudgeButton({
  gameId,
  isOpenEnded = false,
  onJudged,
  className,
}: JudgeButtonProps) {
  const { network } = useNetwork();
  const [loading,  setLoading]  = useState(false);
  const [txHash,   setTxHash]   = useState("");
  const [result,   setResult]   = useState("");
  const [error,    setError]    = useState("");

  async function handle() {
    if (!network) return;
    setError("");
    setResult("");
    setLoading(true);

    try {
      const res = isOpenEnded
        ? await endGame(network, gameId)
        : await judgeGame(network, gameId);

      setTxHash(res.txHash);
      setResult(res.payload);
      const verdict = parseVerdict(res.payload);
      onJudged?.(verdict);
    } catch (err: any) {
      setError(String(err?.message ?? err).slice(0, 100));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={className}>
      {loading ? (
        <TxPending
          message={isOpenEnded ? "Ending game..." : "Waiting for AI consensus..."}
          txHash={txHash || undefined}
        />
      ) : result ? (
        <div className="px-4 py-3 rounded-xl bg-win/5 border border-win/20 text-sm text-chalk">
          {result}
        </div>
      ) : error ? (
        <div className="flex flex-col gap-2">
          <div className="px-4 py-3 rounded-xl bg-loss/5 border border-loss/20 text-sm text-loss">
            {error}
          </div>
          <Button onClick={handle} variant="outline" size="sm">
            Retry
          </Button>
        </div>
      ) : (
        <Button
          onClick={handle}
          loading={loading}
          size="lg"
          className="w-full"
          icon={<span>⚖️</span>}
        >
          {isOpenEnded ? "End Game" : "Judge Game"}
        </Button>
      )}
    </div>
  );
}
