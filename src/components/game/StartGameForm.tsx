"use client";

import { useState } from "react";
import { useNetwork } from "@/context/NetworkContext";
import { startGame } from "@/lib/contracts";
import { Button } from "@/components/ui/Button";
import { Input, Textarea, Select } from "@/components/ui/Input";

const GAME_PRESETS = [
  { label: "Trivia",               value: "Trivia",               rules: "" },
  { label: "Chess",                value: "Chess",                rules: "" },
  { label: "Rock Paper Scissors",  value: "Rock Paper Scissors",  rules: "" },
  { label: "Debate",               value: "Debate",               rules: "Player 1 argues FOR the topic. Player 2 argues AGAINST. Judge on logic, evidence, and clarity." },
  { label: "Custom",               value: "",                     rules: "" },
];

interface Props {
  onGameCreated: (gameId: string) => void;
}

export default function StartGameForm({ onGameCreated }: Props) {
  const { network } = useNetwork();

  const [gameName,    setGameName]    = useState("Trivia");
  const [customName,  setCustomName]  = useState("");
  const [rules,       setRules]       = useState("");
  const [player1,     setPlayer1]     = useState("");
  const [player2,     setPlayer2]     = useState("");
  const [visibility,  setVisibility]  = useState("public");
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState("");

  const isCustom    = gameName === "";
  const finalName   = isCustom ? customName.trim() : gameName;
  const selectedPre = GAME_PRESETS.find(p => p.value === gameName);
  const finalRules  = rules.trim() || selectedPre?.rules || "";

  async function handleSubmit() {
    if (!network) return;
    if (!finalName)   { setError("Game name is required"); return; }
    if (!player1.trim()) { setError("Player 1 name is required"); return; }
    if (!player2.trim()) { setError("Player 2 name is required"); return; }

    setLoading(true);
    setError("");
    try {
      const gameId = await startGame(network, {
        gameName:   finalName,
        visibility,
        rules:      finalRules,
        player1:    player1.trim(),
        player2:    player2.trim(),
        agent1:     "0",
        agent2:     "0",
      });
      onGameCreated(gameId);
    } catch (e: any) {
      setError(String(e?.message ?? e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-5">

      {/* Game type */}
      <div>
        <label className="block text-sm text-mist mb-1.5">Game Type</label>
        <Select
          value={gameName}
          onChange={e => {
            const preset = GAME_PRESETS.find(p => p.value === e.target.value);
            setGameName(e.target.value);
            if (preset && preset.rules) setRules(preset.rules);
            else if (e.target.value !== "") setRules("");
          }}
        >
          {GAME_PRESETS.map(p => (
            <option key={p.label} value={p.value}>{p.label}</option>
          ))}
        </Select>
      </div>

      {/* Custom game name */}
      {isCustom && (
        <div>
          <label className="block text-sm text-mist mb-1.5">Game Name</label>
          <Input
            placeholder="e.g. Spelling Bee, Code Review..."
            value={customName}
            onChange={e => setCustomName(e.target.value)}
          />
        </div>
      )}

      {/* Rules — optional, shows hint */}
      <div>
        <label className="block text-sm text-mist mb-1.5">
          Rules
          <span className="ml-2 text-xs text-mist opacity-60">
            (optional — AI auto-fetches if left blank)
          </span>
        </label>
        <Textarea
          placeholder={
            isCustom
              ? "Describe how to judge the winner, valid moves, and what counts as invalid..."
              : `Leave blank to auto-fetch ${finalName} rules, or customize...`
          }
          value={rules}
          onChange={e => setRules(e.target.value)}
          rows={3}
          maxLength={400}
        />
        {rules.length > 0 && (
          <p className="text-xs text-mist mt-1">{rules.length}/400</p>
        )}
      </div>

      {/* Players */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-mist mb-1.5">Player 1</label>
          <Input
            placeholder="Player 1 name"
            value={player1}
            onChange={e => setPlayer1(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm text-mist mb-1.5">Player 2</label>
          <Input
            placeholder="Player 2 name"
            value={player2}
            onChange={e => setPlayer2(e.target.value)}
          />
        </div>
      </div>

      {/* Visibility */}
      <div>
        <label className="block text-sm text-mist mb-1.5">Visibility</label>
        <Select value={visibility} onChange={e => setVisibility(e.target.value)}>
          <option value="public">Public</option>
          <option value="private">Private</option>
        </Select>
      </div>

      {error && (
        <p className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded px-3 py-2">
          {error}
        </p>
      )}

      <Button
        onClick={handleSubmit}
        loading={loading}
        disabled={loading || !finalName || !player1.trim() || !player2.trim()}
        className="w-full"
      >
        {loading ? "Creating game..." : "Create Game"}
      </Button>
    </div>
  );
}

export { StartGameForm };
