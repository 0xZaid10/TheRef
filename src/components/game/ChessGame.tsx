"use client";

import { useState, useEffect, useCallback } from "react";
import { useNetwork } from "@/context/NetworkContext";
import { submitMove, judgeGame } from "@/lib/contracts";
import { Button }    from "@/components/ui/Button";
import { Card }      from "@/components/ui/Card";
import { TxPending } from "@/components/ui/Spinner";

// ── Types ─────────────────────────────────────────────────────────────────────

type Color  = "w" | "b";
type Piece  = { type: string; color: Color };
type Square = string;

const FILES = ["a","b","c","d","e","f","g","h"];
const RANKS = ["8","7","6","5","4","3","2","1"];

const PIECE_UNICODE: Record<string, Record<Color, string>> = {
  k: { w: "♔", b: "♚" }, q: { w: "♕", b: "♛" },
  r: { w: "♖", b: "♜" }, b: { w: "♗", b: "♝" },
  n: { w: "♘", b: "♞" }, p: { w: "♙", b: "♟" },
};

// ── Board helpers ─────────────────────────────────────────────────────────────

function fenToBoard(fen: string): (Piece | null)[][] {
  const board: (Piece | null)[][] = Array(8).fill(null).map(() => Array(8).fill(null));
  const rows = fen.split(" ")[0].split("/");
  rows.forEach((row, r) => {
    let c = 0;
    for (const ch of row) {
      if (/\d/.test(ch)) { c += parseInt(ch); }
      else {
        board[r][c] = { type: ch.toLowerCase(), color: ch === ch.toUpperCase() ? "w" : "b" };
        c++;
      }
    }
  });
  return board;
}

function fenTurn(fen: string): Color { return fen.split(" ")[1] as Color; }

function squareToRC(sq: Square): [number, number] {
  return [8 - parseInt(sq[1]), FILES.indexOf(sq[0])];
}
function rcToSquare(r: number, c: number): Square { return FILES[c] + (8 - r); }

function boardToFenRows(board: (Piece | null)[][]): string {
  return board.map(row => {
    let s = ""; let empty = 0;
    for (const cell of row) {
      if (!cell) { empty++; }
      else {
        if (empty) { s += empty; empty = 0; }
        s += cell.color === "w" ? cell.type.toUpperCase() : cell.type;
      }
    }
    if (empty) s += empty;
    return s;
  }).join("/");
}

// ── Move generation ───────────────────────────────────────────────────────────

function getRawMoves(board: (Piece | null)[][], from: Square, color: Color): Square[] {
  const [fr, fc] = squareToRC(from);
  const piece = board[fr][fc];
  if (!piece || piece.color !== color) return [];

  const moves: Square[] = [];
  const inBounds = (r: number, c: number) => r >= 0 && r < 8 && c >= 0 && c < 8;
  const isEmpty  = (r: number, c: number) => inBounds(r,c) && !board[r][c];
  const isEnemy  = (r: number, c: number) => inBounds(r,c) && !!board[r][c] && board[r][c]!.color !== color;
  const canGo    = (r: number, c: number) => isEmpty(r,c) || isEnemy(r,c);

  const slide = (dirs: [number,number][]) => {
    for (const [dr,dc] of dirs) {
      let r = fr+dr, c = fc+dc;
      while (inBounds(r,c)) {
        if (board[r][c]) { if (board[r][c]!.color !== color) moves.push(rcToSquare(r,c)); break; }
        moves.push(rcToSquare(r,c));
        r+=dr; c+=dc;
      }
    }
  };
  const jump = (targets: [number,number][]) => {
    for (const [dr,dc] of targets) {
      const r=fr+dr, c=fc+dc;
      if (canGo(r,c)) moves.push(rcToSquare(r,c));
    }
  };

  switch (piece.type) {
    case "p": {
      const dir = color === "w" ? -1 : 1;
      const start = color === "w" ? 6 : 1;
      if (isEmpty(fr+dir, fc)) {
        moves.push(rcToSquare(fr+dir, fc));
        if (fr === start && isEmpty(fr+2*dir, fc)) moves.push(rcToSquare(fr+2*dir, fc));
      }
      if (isEnemy(fr+dir, fc-1)) moves.push(rcToSquare(fr+dir, fc-1));
      if (isEnemy(fr+dir, fc+1)) moves.push(rcToSquare(fr+dir, fc+1));
      break;
    }
    case "r": slide([[1,0],[-1,0],[0,1],[0,-1]]); break;
    case "b": slide([[1,1],[1,-1],[-1,1],[-1,-1]]); break;
    case "q": slide([[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]); break;
    case "n": jump([[2,1],[2,-1],[-2,1],[-2,-1],[1,2],[1,-2],[-1,2],[-1,-2]]); break;
    case "k": jump([[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]); break;
  }
  return moves;
}

function applyMoveToBoard(
  board: (Piece | null)[][],
  from: Square, to: Square,
  promo?: string
): (Piece | null)[][] {
  const [fr,fc] = squareToRC(from);
  const [tr,tc] = squareToRC(to);
  const piece   = board[fr][fc]!;
  const newBoard = board.map(row => [...row]);
  newBoard[tr][tc] = promo ? { type: promo, color: piece.color } : piece;
  newBoard[fr][fc] = null;
  return newBoard;
}

function findKing(board: (Piece | null)[][], color: Color): Square | null {
  for (let r = 0; r < 8; r++)
    for (let c = 0; c < 8; c++)
      if (board[r][c]?.type === "k" && board[r][c]?.color === color)
        return rcToSquare(r, c);
  return null;
}

function isSquareAttacked(board: (Piece | null)[][], sq: Square, byColor: Color): boolean {
  for (let r = 0; r < 8; r++)
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (!piece || piece.color !== byColor) continue;
      const from = rcToSquare(r, c);
      if (getRawMoves(board, from, byColor).includes(sq)) return true;
    }
  return false;
}

function isInCheck(board: (Piece | null)[][], color: Color): boolean {
  const king = findKing(board, color);
  if (!king) return false;
  const enemy: Color = color === "w" ? "b" : "w";
  return isSquareAttacked(board, king, enemy);
}

// Legal moves = raw moves that don't leave own king in check
function getLegalMoves(board: (Piece | null)[][], from: Square, color: Color): Square[] {
  return getRawMoves(board, from, color).filter(to => {
    const newBoard = applyMoveToBoard(board, from, to);
    return !isInCheck(newBoard, color);
  });
}

function getAllLegalMoves(board: (Piece | null)[][], color: Color): { from: Square; to: Square }[] {
  const moves: { from: Square; to: Square }[] = [];
  for (let r = 0; r < 8; r++)
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (!piece || piece.color !== color) continue;
      const from = rcToSquare(r, c);
      for (const to of getLegalMoves(board, from, color))
        moves.push({ from, to });
    }
  return moves;
}

type GameEndState = "checkmate" | "stalemate" | null;

function getGameEnd(board: (Piece | null)[][], color: Color): GameEndState {
  const legalMoves = getAllLegalMoves(board, color);
  if (legalMoves.length > 0) return null;
  return isInCheck(board, color) ? "checkmate" : "stalemate";
}

function toAlgebraic(from: Square, to: Square, piece: Piece, capture: boolean, promo?: string, check?: boolean, checkmate?: boolean): string {
  const p = piece.type;
  const pChar = p === "p" ? "" : p.toUpperCase();
  const capChar = capture ? "x" : "";
  const prChar  = promo ? `=${promo.toUpperCase()}` : "";
  const suffix  = checkmate ? "#" : check ? "+" : "";
  if (p === "p") return `${capture ? from[0] : ""}${capChar}${to}${prChar}${suffix}`;
  return `${pChar}${capChar}${to}${prChar}${suffix}`;
}

// ── Component ─────────────────────────────────────────────────────────────────

interface ChessGameProps {
  gameId:        string;
  player1:       string;
  player2:       string;
  roundNum:      number;
  claimedPlayer: string;
  onSubmitted:   () => void;
}

export function ChessGame({ gameId, player1, player2, roundNum, claimedPlayer, onSubmitted }: ChessGameProps) {
  const { network } = useNetwork();

  const INIT_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
  const [fen,        setFen]        = useState(INIT_FEN);
  const [selected,   setSelected]   = useState<Square | null>(null);
  const [legalMoves, setLegalMoves] = useState<Square[]>([]);
  const [history,    setHistory]    = useState<string[]>([]);
  const [lastMove,   setLastMove]   = useState<{from:Square;to:Square}|null>(null);
  const [gameEnd,    setGameEnd]    = useState<GameEndState>(null);

  const [p1Submitted, setP1Submitted] = useState(false);
  const [p2Submitted, setP2Submitted] = useState(false);
  const [submitting,  setSubmitting]  = useState<"p1"|"p2"|null>(null);
  const [judging,     setJudging]     = useState(false);
  const [txHash,      setTxHash]      = useState("");
  const [error,       setError]       = useState("");
  const [pendingPromo, setPendingPromo] = useState<{from:Square;to:Square}|null>(null);

  const board = fenToBoard(fen);
  const turn  = fenTurn(fen);
  const activePlayer = turn === "w" ? player1 : player2;
  const inCheck = isInCheck(board, turn);

  function commitMove(from: Square, to: Square, promo?: string) {
    const [fr,fc] = squareToRC(from);
    const piece   = board[fr][fc]!;
    const capture = !!board[squareToRC(to)[0]][squareToRC(to)[1]];
    const newBoard = applyMoveToBoard(board, from, to, promo);
    const nextTurn: Color = turn === "w" ? "b" : "w";

    const endState = getGameEnd(newBoard, nextTurn);
    const check    = !endState && isInCheck(newBoard, nextTurn);
    const alg = toAlgebraic(from, to, piece, capture, promo, check, endState === "checkmate");

    const newFen = `${boardToFenRows(newBoard)} ${nextTurn} - - 0 ${Math.floor((history.length+1)/2)+1}`;
    setFen(newFen);
    setHistory(h => [...h, alg]);
    setLastMove({ from, to });
    setSelected(null);
    setLegalMoves([]);
    setPendingPromo(null);
    setGameEnd(endState);
  }

  const isSpectator = claimedPlayer === "spectator";
  const myTurn = !isSpectator && (
    (turn === "w" && claimedPlayer === player1) ||
    (turn === "b" && claimedPlayer === player2)
  );

  function handleSquareClick(sq: Square) {
    if (gameEnd) return;
    if (!myTurn) return; // not your turn
    const [r,c] = squareToRC(sq);
    const piece = board[r][c];

    if (selected) {
      if (legalMoves.includes(sq)) {
        // Pawn promotion?
        const [fr,fc] = squareToRC(selected);
        const movingPiece = board[fr][fc]!;
        const [tr]       = squareToRC(sq);
        if (movingPiece.type === "p" && (tr === 0 || tr === 7)) {
          setPendingPromo({ from: selected, to: sq });
          setSelected(null); setLegalMoves([]);
          return;
        }
        commitMove(selected, sq);
      } else if (piece && piece.color === turn) {
        setSelected(sq);
        setLegalMoves(getLegalMoves(board, sq, turn));
      } else {
        setSelected(null); setLegalMoves([]);
      }
    } else {
      if (piece && piece.color === turn) {
        setSelected(sq);
        setLegalMoves(getLegalMoves(board, sq, turn));
      }
    }
  }

  // Auto submit + judge on checkmate/stalemate
  useEffect(() => {
    if (!gameEnd || !network) return;

    async function autoFinish() {
      setJudging(true);
      try {
        // Submit final moves for both players from history
        const p1Moves = history.filter((_, i) => i % 2 === 0);
        const p2Moves = history.filter((_, i) => i % 2 === 1);
        const p1Last  = p1Moves[p1Moves.length - 1];
        const p2Last  = p2Moves[p2Moves.length - 1];

        if (p1Last && !p1Submitted) {
          const r = await submitMove(network!, gameId, player1, p1Last);
          setTxHash(r.txHash);
          setP1Submitted(true);
        }
        if (p2Last && !p2Submitted) {
          const r = await submitMove(network!, gameId, player2, p2Last);
          setTxHash(r.txHash);
          setP2Submitted(true);
        }

        // Judge the game — AI confirms the result on-chain
        await judgeGame(network!, gameId);
        onSubmitted();
      } catch(err: any) {
        setError(String(err?.message ?? err).slice(0, 120));
      } finally {
        setJudging(false);
      }
    }

    autoFinish();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameEnd]);

  async function submitPlayerMove(playerName: string, isP1: boolean) {
    if (!network) return;
    const playerMoves = history.filter((_, i) => isP1 ? i%2===0 : i%2===1);
    const lastMove    = playerMoves[playerMoves.length - 1];
    if (!lastMove) return;

    setSubmitting(isP1 ? "p1" : "p2");
    setError("");
    try {
      const result = await submitMove(network, gameId, playerName, lastMove);
      setTxHash(result.txHash);
      if (isP1) setP1Submitted(true);
      else       setP2Submitted(true);
      if ((isP1 && p2Submitted) || (!isP1 && p1Submitted)) onSubmitted();
    } catch(err: any) {
      setError(String(err?.message ?? err).slice(0, 120));
    } finally {
      setSubmitting(null);
    }
  }

  const isLight = (r: number, c: number) => (r+c)%2 === 0;

  // Winner display
  const winner = gameEnd === "checkmate"
    ? (turn === "w" ? player2 : player1)  // side to move is mated → other side wins
    : null;

  return (
    <div className="flex flex-col gap-4">

      {/* Status bar */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          {gameEnd ? (
            <span className="text-sm font-600 text-ref">
              {gameEnd === "checkmate" ? `Checkmate — ${winner} wins! 🏆` : "Stalemate — Draw!"}
            </span>
          ) : (
            <>
              <div className={`w-3 h-3 rounded-full border ${turn==="w" ? "bg-chalk border-chalk" : "bg-pitch border-mist"}`} />
              <span className="text-sm font-500 text-chalk">
                {activePlayer}'s turn{!myTurn && !isSpectator && <span className="text-mist ml-2 text-xs">(waiting for opponent)</span>}
                {inCheck && <span className="text-loss ml-2 font-600">· Check!</span>}
              </span>
            </>
          )}
        </div>
        <span className="text-xs font-mono text-mist">Round {roundNum} · {history.length} moves</span>
      </div>

      {/* Board + history */}
      <div className="flex gap-4 items-start flex-wrap">

        {/* Board */}
        <div className="select-none">
          <div className="flex">
            <div className="w-5" />
            {FILES.map(f => (
              <div key={f} className="w-10 text-center text-[10px] text-mist font-mono">{f}</div>
            ))}
          </div>

          {RANKS.map((rank, ri) => (
            <div key={rank} className="flex items-center">
              <div className="w-5 text-[10px] text-mist font-mono text-right pr-1">{rank}</div>
              {FILES.map((file, fi) => {
                const sq    = file + rank;
                const piece = board[ri][fi];
                const isSel    = selected === sq;
                const isLegal  = legalMoves.includes(sq);
                const isLast   = lastMove?.from === sq || lastMove?.to === sq;
                const light    = isLight(ri, fi);
                const kingInCheck = piece?.type === "k" && piece.color === turn && inCheck;

                let bg = light ? "bg-[#f0d9b5]" : "bg-[#b58863]";
                if (isLast)      bg = light ? "bg-[#cdd26a]" : "bg-[#aaa23a]";
                if (isSel)       bg = "bg-ref/70";
                if (isLegal)     bg = light ? "bg-[#cdd26a]/80" : "bg-[#aaa23a]/80";
                if (kingInCheck) bg = "bg-loss/60";

                return (
                  <div
                    key={sq}
                    onClick={() => handleSquareClick(sq)}
                    className={`w-10 h-10 flex items-center justify-center relative transition-colors
                      ${gameEnd ? "cursor-default" : "cursor-pointer"} ${bg}`}
                  >
                    {isLegal && !piece && (
                      <div className="w-3 h-3 rounded-full bg-black/25" />
                    )}
                    {isLegal && piece && (
                      <div className="absolute inset-0 ring-4 ring-inset ring-black/25 rounded-sm" />
                    )}
                    {piece && (
                      <span className={`text-[26px] leading-none select-none z-10 relative
                        ${piece.color === "w" ? "drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]" : "drop-shadow-[0_1px_1px_rgba(255,255,255,0.1)]"}`}>
                        {PIECE_UNICODE[piece.type][piece.color]}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {/* Right panel */}
        <div className="flex-1 min-w-[150px] flex flex-col gap-3">

          {/* Move history */}
          <div>
            <p className="text-[10px] text-mist font-mono uppercase tracking-wider mb-1.5">Move History</p>
            <div className="bg-turf border border-line rounded-xl p-3 h-64 overflow-y-auto">
              {history.length === 0 ? (
                <p className="text-xs text-mist italic">No moves yet</p>
              ) : (
                <div className="grid grid-cols-[20px_1fr_1fr] gap-x-2 gap-y-0.5 text-xs font-mono">
                  {Array.from({ length: Math.ceil(history.length / 2) }).map((_, i) => (
                    <>
                      <span key={`n${i}`} className="text-mist/60">{i+1}.</span>
                      <span key={`w${i}`} className={`${history[i*2]?.includes("#") ? "text-ref font-700" : "text-chalk"}`}>
                        {history[i*2] ?? ""}
                      </span>
                      <span key={`b${i}`} className={`${history[i*2+1]?.includes("#") ? "text-ref font-700" : "text-chalk"}`}>
                        {history[i*2+1] ?? ""}
                      </span>
                    </>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Promotion picker */}
          {pendingPromo && (
            <div className="p-3 bg-turf border border-ref/30 rounded-xl">
              <p className="text-xs text-mist mb-2">Promote to:</p>
              <div className="flex gap-2">
                {["q","r","b","n"].map(p => (
                  <button
                    key={p}
                    onClick={() => commitMove(pendingPromo.from, pendingPromo.to, p)}
                    className="w-10 h-10 flex items-center justify-center bg-line hover:bg-ref/20 rounded-lg text-2xl transition-colors"
                  >
                    {PIECE_UNICODE[p][turn]}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Game end overlay */}
          {gameEnd && (
            <div className="p-4 rounded-xl border border-ref/30 bg-ref/5 text-center">
              <div className="text-3xl mb-2">{gameEnd === "checkmate" ? "🏆" : "🤝"}</div>
              <p className="font-display font-700 text-chalk text-lg">
                {gameEnd === "checkmate" ? `${winner} wins!` : "Draw!"}
              </p>
              <p className="text-xs text-mist mt-1">
                {gameEnd === "checkmate" ? "Checkmate" : "Stalemate"}
              </p>
              {judging && (
                <div className="mt-3">
                  <TxPending message="Submitting result on-chain..." txHash={txHash||undefined} />
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Manual submit buttons — only shown for your own player */}
      {!gameEnd && !isSpectator && (
        <div className="grid grid-cols-2 gap-3 mt-1">
          {[
            { name: player1, isP1: true,  submitted: p1Submitted, loading: submitting==="p1" },
            { name: player2, isP1: false, submitted: p2Submitted, loading: submitting==="p2" },
          ].filter(p => p.name === claimedPlayer).map(({ name, isP1, submitted, loading }) => {
            const playerMoves = history.filter((_, i) => isP1 ? i%2===0 : i%2===1);
            const hasMove = playerMoves.length > 0;
            const lastAlg = playerMoves[playerMoves.length-1];
            return (
              <div key={name} className="flex flex-col gap-1.5">
                <p className="text-xs text-mist font-mono">{name}</p>
                {submitted ? (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-win/5 border border-win/20">
                    <span className="text-win">✓</span>
                    <span className="text-xs text-chalk">Submitted</span>
                  </div>
                ) : (
                  <Button
                    size="sm"
                    variant={hasMove ? "primary" : "secondary"}
                    loading={loading}
                    disabled={!hasMove || !!submitting}
                    onClick={() => submitPlayerMove(name, isP1)}
                    className="w-full"
                  >
                    {hasMove ? `Submit: ${lastAlg}` : "No move yet"}
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {error && <p className="text-xs text-loss bg-loss/5 border border-loss/20 rounded-lg px-3 py-2">{error}</p>}
      {!gameEnd && submitting && <TxPending message="Submitting move..." txHash={txHash||undefined} />}
    </div>
  );
}
