"use client";

import { useEffect, useRef, useCallback } from "react";

const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? "wss://ws.theref.fun";

export type WSMessage =
  | { type: "joined";      gameId: string; roomSize: number }
  | { type: "peer_joined"; gameId: string }
  | { type: "peer_left";   gameId: string }
  | { type: "move";        gameId: string; payload: ChessMove }
  | { type: "submitted";   gameId: string; payload: { player: string } }
  | { type: "game_over";   gameId: string; payload: { winner?: string } }
  | { type: "pong" };

export interface ChessMove {
  from:      string;
  to:        string;
  piece:     string;
  alg:       string;
  fen:       string;  // full FEN after move so opponent board stays in sync
  promotion?: string;
}

interface UseGameSocketOptions {
  gameId:    string;
  onMove:    (move: ChessMove) => void;
  onSubmitted: (player: string) => void;
  onGameOver: (winner?: string) => void;
  onPeerJoined: () => void;
  onPeerLeft:   () => void;
}

export function useGameSocket({
  gameId,
  onMove,
  onSubmitted,
  onGameOver,
  onPeerJoined,
  onPeerLeft,
}: UseGameSocketOptions) {
  const wsRef      = useRef<WebSocket | null>(null);
  const pingRef    = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);

  // Stable callback refs so reconnect doesn't need to re-register
  const onMoveRef       = useRef(onMove);
  const onSubmittedRef  = useRef(onSubmitted);
  const onGameOverRef   = useRef(onGameOver);
  const onPeerJoinedRef = useRef(onPeerJoined);
  const onPeerLeftRef   = useRef(onPeerLeft);

  useEffect(() => { onMoveRef.current       = onMove;       }, [onMove]);
  useEffect(() => { onSubmittedRef.current  = onSubmitted;  }, [onSubmitted]);
  useEffect(() => { onGameOverRef.current   = onGameOver;   }, [onGameOver]);
  useEffect(() => { onPeerJoinedRef.current = onPeerJoined; }, [onPeerJoined]);
  useEffect(() => { onPeerLeftRef.current   = onPeerLeft;   }, [onPeerLeft]);

  const connect = useCallback(() => {
    if (!mountedRef.current) return;

    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log("[ws] connected");
      ws.send(JSON.stringify({ type: "join", gameId }));

      // Keepalive ping every 30s
      pingRef.current = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: "ping" }));
        }
      }, 30000);
    };

    ws.onmessage = (event) => {
      let msg: WSMessage;
      try { msg = JSON.parse(event.data); } catch { return; }

      switch (msg.type) {
        case "move":        onMoveRef.current(msg.payload);           break;
        case "submitted":   onSubmittedRef.current(msg.payload.player); break;
        case "game_over":   onGameOverRef.current(msg.payload?.winner); break;
        case "peer_joined": onPeerJoinedRef.current();                break;
        case "peer_left":   onPeerLeftRef.current();                  break;
      }
    };

    ws.onclose = () => {
      console.log("[ws] disconnected — reconnecting in 3s");
      if (pingRef.current) clearInterval(pingRef.current);
      if (mountedRef.current) setTimeout(connect, 3000);
    };

    ws.onerror = (err) => {
      console.error("[ws] error", err);
      ws.close();
    };
  }, [gameId]);

  useEffect(() => {
    mountedRef.current = true;
    connect();
    return () => {
      mountedRef.current = false;
      if (pingRef.current) clearInterval(pingRef.current);
      wsRef.current?.close();
    };
  }, [connect]);

  // Send a chess move to the opponent
  const sendMove = useCallback((move: ChessMove) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "move", gameId, payload: move }));
    }
  }, [gameId]);

  // Tell opponent a move was submitted on-chain
  const sendSubmitted = useCallback((player: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "submitted", gameId, payload: { player } }));
    }
  }, [gameId]);

  // Tell opponent the game ended
  const sendGameOver = useCallback((winner?: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "game_over", gameId, payload: { winner } }));
    }
  }, [gameId]);

  return { sendMove, sendSubmitted, sendGameOver };
}
