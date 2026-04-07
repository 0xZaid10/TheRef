"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useAccount } from "wagmi";
import { motion }          from "framer-motion";
import { useNetwork }      from "@/context/NetworkContext";
import {
  getGameState,
  judgeGame,
  endGame,
  submitMove,
  GameState,
} from "@/lib/contracts";
import { Button }          from "@/components/ui/Button";
import { Badge }           from "@/components/ui/Badge";
import { Card, CardDivider } from "@/components/ui/Card";
import { TxPending, Spinner } from "@/components/ui/Spinner";
import { MoveInput }   from "./MoveInput";
import { ChessGame }  from "./ChessGame";
import { VerdictDisplay }  from "./VerdictDisplay";
import { truncateAddr, cn } from "@/lib/utils";

interface GameViewProps {
  gameId: string;
}


// Reconstruct FEN and move history from on-chain round data
function rebuildChessState(rounds: any[]): { fen: string; history: string[] } {
  const INIT_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
  if (!rounds || rounds.length === 0) return { fen: INIT_FEN, history: [] };

  // Collect all submitted moves in order: p1 move, p2 move, p1 move, p2 move...
  const history: string[] = [];
  for (const round of rounds) {
    if (round.move_player1) history.push(round.move_player1);
    if (round.move_player2) history.push(round.move_player2);
  }

  // We can't fully replay the FEN without a chess engine here,
  // but we can pass the history so the board knows how many moves were made.
  // The FEN will be synced via WebSocket on the next move.
  // For now return INIT_FEN — WebSocket onMove will correct it instantly.
  return { fen: INIT_FEN, history };
}

export function GameView({ gameId }: GameViewProps) {
  const { network } = useNetwork();
  const { address }  = useAccount();
  const [game,       setGame]       = useState<GameState | null>(null);
  const [loading,    setLoading]    = useState(true);
  const [judging,    setJudging]    = useState(false);
  const [judgeTx,    setJudgeTx]    = useState("");
  const [judgeResult, setJudgeResult] = useState("");
  const [error,      setError]      = useState("");
  const [claimedPlayer, setClaimedPlayer] = useState<string | null>(null);
  const [forfeiting,  setForfeiting]  = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  const loadGame = useCallback(async () => {
    if (!network) return;
    try {
      const state = await getGameState(network, gameId);
      setGame(state);
      // Stop polling once game is no longer active
      if (state?.status !== "active" && pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    } catch {
      setError("Could not load game state");
    } finally {
      setLoading(false);
    }
  }, [network, gameId]);

  useEffect(() => {
    loadGame();
  }, [loadGame]);

  // Keep a stable ref to loadGame so the interval never restarts
  const loadGameRef = useRef(loadGame);
  useEffect(() => { loadGameRef.current = loadGame; }, [loadGame]);

  // Poll every 5s — single interval, never restarts, checks status via ref
  useEffect(() => {
    if (!network) return;
    pollRef.current = setInterval(() => {
      loadGameRef.current();
    }, 5000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [network]); // only depends on network — stable

  // Restore claimed player from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(`theref_player_${gameId}`);
    if (stored) setClaimedPlayer(stored);
  }, [gameId]);

  function claimPlayer(name: string) {
    localStorage.setItem(`theref_player_${gameId}`, name);
    setClaimedPlayer(name);
  }

  async function handleJudge() {
    if (!network) return;
    setError("");
    setJudging(true);
    try {
      const result = await judgeGame(network, gameId);
      setJudgeTx(result.txHash);
      setJudgeResult(result.payload);
      await loadGame();
    } catch (err: any) {
      setError(String(err?.message ?? err).slice(0, 120));
    } finally {
      setJudging(false);
    }
  }

  async function handleEndGame() {
    if (!network) return;
    setError("");
    setJudging(true);
    try {
      const result = await endGame(network, gameId);
      setJudgeTx(result.txHash);
      setJudgeResult(result.payload);
      await loadGame();
    } catch (err: any) {
      setError(String(err?.message ?? err).slice(0, 120));
    } finally {
      setJudging(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!game) {
    return (
      <Card className="text-center py-10">
        <p className="text-mist">Game not found or could not be loaded.</p>
        <p className="text-xs text-mist/60 font-mono mt-2">{gameId}</p>
      </Card>
    );
  }

  const isActive    = game.status === "active";
  const isCompleted = game.status === "completed" || game.status === "draw";
  const isOpenEnded = game.max_rounds === 0;
  const isChess     = game.game_name?.toLowerCase() === "chess";

  // Check if claimed player already submitted this round (from on-chain state)
  const currentRound  = (game.rounds ?? []).find(r => r.round_number === game.round_count);
  const myMoveOnChain = claimedPlayer === game.player1
    ? currentRound?.move_player1
    : claimedPlayer === game.player2
    ? currentRound?.move_player2
    : null;
  const iAlreadySubmitted = !!myMoveOnChain;

  // Count pending rounds (both moves submitted, not yet judged)
  const pendingJudgment = (game.rounds ?? []).filter(
    r => r.move_player1 && r.move_player2 && r.result === "pending"
  ).length;

  async function handleForfeit() {
    if (!network || !claimedPlayer || claimedPlayer === "spectator") return;
    setForfeiting(true);
    setError("");
    try {
      // Submit a resignation move on-chain
      await submitMove(network, gameId, claimedPlayer, "I resign.");
      // Then trigger judgment so the opponent is declared winner
      await judgeGame(network, gameId);
      await loadGame();
    } catch (err: any) {
      setError(String(err?.message ?? err).slice(0, 120));
    } finally {
      setForfeiting(false);
      setShowConfirm(false);
    }
  }

  // Player identity picker
  if (!claimedPlayer && game) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] gap-6">
        <div className="text-center">
          <p className="font-display text-xl font-700 text-chalk mb-1">Who are you?</p>
          <p className="text-sm text-mist">Choose your player — this browser will be locked to your moves only</p>
        </div>
        <div className="flex gap-4 flex-wrap justify-center">
          {[game.player1, game.player2].map(name => (
            <button
              key={name}
              onClick={() => claimPlayer(name)}
              className="px-8 py-5 rounded-2xl border-2 border-line hover:border-ref bg-turf hover:bg-ref/10 transition-all duration-200 text-center group min-w-[140px]"
            >
              <p className="font-display text-lg font-700 text-chalk group-hover:text-ref">{name}</p>
              <p className="text-xs text-mist mt-1">Play as this player</p>
            </button>
          ))}
        </div>
        <button onClick={() => claimPlayer("spectator")} className="text-xs text-mist hover:text-chalk underline">
          Just watching
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">

      {/*  Game header  */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y:  0 }}
        transition={{ duration: 0.3 }}
      >
        <Card>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <Badge
                  variant={
                    isCompleted ? "completed" :
                    isActive    ? "active"    : "pending"
                  }
                  dot
                >
                  {game.status}
                </Badge>
                <span className="font-mono text-xs text-mist">#{gameId}</span>
                <Badge variant={game.visibility === "public" ? "ref" : "default"} size="sm">
                  {game.visibility}
                </Badge>
              </div>

              <h2 className="font-display text-2xl font-700 text-chalk">
                {game.game_name}
              </h2>

              <div className="flex items-center gap-3 mt-2">
                <PlayerChip
                  name={game.player1}
                  isWinner={game.winner === game.player1}
                />
                <span className="text-mist text-sm font-mono">vs</span>
                <PlayerChip
                  name={game.player2}
                  isWinner={game.winner === game.player2}
                />
              </div>
            </div>

            {/* Round counter */}
            <div className="text-right shrink-0">
              <div className="font-mono text-xs text-mist uppercase tracking-wider">
                Rounds
              </div>
              <div className="font-display text-3xl font-800 text-chalk">
                {game.round_count}
                {!isOpenEnded && (
                  <span className="text-mist text-lg font-400">
                    /{game.max_rounds}
                  </span>
                )}
              </div>
              {isOpenEnded && (
                <div className="text-[10px] text-mist font-mono">open-ended</div>
              )}
            </div>
          </div>

          {/* Rules preview */}
          {game.rules && (
            <>
              <CardDivider />
              <div>
                <p className="text-[10px] text-mist uppercase font-mono tracking-wider mb-1">
                  Rules
                </p>
                <p className="text-sm text-mist leading-relaxed line-clamp-2">
                  {game.rules}
                </p>
              </div>
            </>
          )}
        </Card>
      </motion.div>

      {/*  Completed verdict  */}
      {isCompleted && (
        <VerdictDisplay gameState={game} />
      )}

      {/* Active game - move inputs */}
      {isActive && (
        isChess ? (
          <Card>
            <ChessGame
              gameId={gameId}
              player1={game.player1}
              player2={game.player2}
              roundNum={game.round_count + 1}
              claimedPlayer={claimedPlayer ?? "spectator"}
              initialFen={rebuildChessState(game.rounds ?? []).fen}
              initialHistory={rebuildChessState(game.rounds ?? []).history}
              onSubmitted={() => loadGame()}
            />
          </Card>
        ) : claimedPlayer === "spectator" ? (
          <div className="text-center py-8 text-mist text-sm border border-dashed border-line rounded-2xl">
            👀 Spectating — share the URL with players so each can claim their side
          </div>
        ) : iAlreadySubmitted ? (
          <div className="flex flex-col gap-2 px-4 py-3 rounded-xl bg-win/5 border border-win/20">
            <div className="flex items-center gap-2">
              <span className="text-win">✓</span>
              <span className="text-sm font-500 text-chalk">Your move is on-chain: <span className="font-mono text-ref">{myMoveOnChain}</span></span>
            </div>
            <p className="text-xs text-mist pl-6">Waiting for opponent to submit their move...</p>
          </div>
        ) : (
          <MoveInput
            gameId={gameId}
            playerName={claimedPlayer ?? game.player1}
            roundNum={game.round_count + 1}
            onSubmitted={() => loadGame()}
          />
        )
      )}

      {/* Forfeit button — always available to claimed player while game is active */}
      {isActive && claimedPlayer && claimedPlayer !== "spectator" && (
        <div className="flex justify-end">
          {showConfirm ? (
            <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl border border-loss/30 bg-loss/5">
              <p className="text-sm text-chalk">Forfeit and concede the game?</p>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowConfirm(false)}
                disabled={forfeiting}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleForfeit}
                loading={forfeiting}
                className="bg-loss/80 hover:bg-loss border-loss text-white"
              >
                Yes, forfeit
              </Button>
            </div>
          ) : (
            <button
              onClick={() => setShowConfirm(true)}
              className="text-xs text-mist hover:text-loss transition-colors underline underline-offset-2"
            >
              🏳️ Forfeit game
            </button>
          )}
        </div>
      )}

      {/* Judge / End game actions — hidden for Chess (board handles it automatically) */}
      {isActive && !isChess && (
        <div className="flex flex-col gap-3">
          {pendingJudgment > 0 && (
            <Card className="border-ref/20 bg-ref/5">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <p className="text-sm font-500 text-chalk">
                    {pendingJudgment} round{pendingJudgment > 1 ? "s" : ""} ready for judgment
                  </p>
                  <p className="text-xs text-mist mt-0.5">
                    5 AI validators will independently evaluate the moves
                  </p>
                </div>
                <Button
                  onClick={handleJudge}
                  loading={judging}
                  size="md"
                >
                  Judge Game ⚖️
                </Button>
              </div>
            </Card>
          )}

          {isOpenEnded && (
            <Button
              variant="outline"
              onClick={handleEndGame}
              loading={judging}
              className="w-full"
            >
              End Game (Force Judgment)
            </Button>
          )}

          {judging && (
            <TxPending
              message="Waiting for AI consensus..."
              txHash={judgeTx || undefined}
            />
          )}
        </div>
      )}

      {/*  Judge result message  */}
      {judgeResult && !isCompleted && (
        <Card className="border-win/20 bg-win/5">
          <p className="text-sm font-500 text-chalk">{judgeResult}</p>
        </Card>
      )}

      {/*  Error  */}
      {error && (
        <Card className="border-loss/20 bg-loss/5">
          <p className="text-sm text-loss">{error}</p>
        </Card>
      )}

      {/*  Explorer link  */}
      {network?.explorer && (
        <p className="text-center text-xs text-mist font-mono">
          <a
            href={`${network.explorer}/address/${network.addresses.CORE}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-ref transition-colors"
          >
            View contract on explorer →
          </a>
        </p>
      )}
    </div>
  );
}

function PlayerChip({
  name,
  isWinner,
}: {
  name:     string;
  isWinner: boolean;
}) {
  return (
    <div className={cn(
      "flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-sm font-500",
      isWinner
        ? "bg-ref/10 text-ref border border-ref/25"
        : "bg-line text-chalk"
    )}>
      {isWinner && <span className="text-[10px]">🏆</span>}
      {name}
    </div>
  );
}
