"use client";

import { useState }    from "react";
import { useNetwork }  from "@/context/NetworkContext";
import { startGame }   from "@/lib/contracts";
import { Button }      from "@/components/ui/Button";
import { Input, Textarea, Select } from "@/components/ui/Input";
import { TxPending }   from "@/components/ui/Spinner";
import { Card, CardHeader } from "@/components/ui/Card";

const VISIBILITY_OPTIONS = [
  { value: "public",  label: "Public - visible to all" },
  { value: "private", label: "Private - invite only" },
];

const ROUNDS_OPTIONS = [
  { value: "1",  label: "1 round" },
  { value: "3",  label: "3 rounds" },
  { value: "5",  label: "5 rounds" },
  { value: "0",  label: "Open-ended (resign to end)" },
];

const GAME_PRESETS = [
  { name: "Trivia",               rules: "Most detailed and correct answer wins each round." },
  { name: "Rock Paper Scissors",  rules: "" },
  { name: "Chess",                rules: "Standard chess. Moves in algebraic notation. Game ends by checkmate or resignation." },
  { name: "Debate",               rules: "Best argued position wins. Judge on logic, evidence, and clarity." },
  { name: "Riddle",               rules: "" },
  { name: "Custom",               rules: "" },
];

interface StartGameFormProps {
  onGameCreated: (gameId: string) => void;
}

export function StartGameForm({ onGameCreated }: StartGameFormProps) {
  const { network } = useNetwork();

  const [gameName,   setGameName]   = useState("Trivia");
  const [customName, setCustomName] = useState("");
  const [visibility, setVisibility] = useState("public");
  const [maxRounds,  setMaxRounds]  = useState("1");
  const [rules,      setRules]      = useState("Most detailed and correct answer wins each round.");
  const [player1,    setPlayer1]    = useState("");
  const [player2,    setPlayer2]    = useState("");
  const [loading,    setLoading]    = useState(false);
  const [txHash,     setTxHash]     = useState("");
  const [error,      setError]      = useState("");

  function handlePreset(preset: typeof GAME_PRESETS[0]) {
    setGameName(preset.name);
    if (preset.name !== "Custom") {
      setRules(preset.rules);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!network) return;
    setError("");

    const finalName = gameName === "Custom" ? customName.trim() : gameName;
    if (!finalName) { setError("Game name is required"); return; }
    if (!player1.trim()) { setError("Player 1 name is required"); return; }
    if (!player2.trim()) { setError("Player 2 name is required"); return; }

    setLoading(true);
    try {
      const result = await startGame(network, {
        gameName:   finalName,
        visibility,
        maxRounds:  parseInt(maxRounds),
        rules:      rules.trim(),
        player1:    player1.trim(),
        player2:    player2.trim(),
      });
      setTxHash(result.txHash);
      onGameCreated(result.payload);
    } catch (err: any) {
      setError(String(err?.message ?? err).slice(0, 120));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader
        title="Start a Game"
        subtitle="Set up a new match for AI consensus judgment"
      />

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">

        {/* Game presets */}
        <div>
          <p className="text-xs font-500 text-mist uppercase tracking-wider mb-2">
            Game Type
          </p>
          <div className="flex flex-wrap gap-2">
            {GAME_PRESETS.map((p) => (
              <button
                key={p.name}
                type="button"
                onClick={() => handlePreset(p)}
                className={`px-3 py-1.5 rounded-lg text-xs font-500 transition-all duration-150
                  ${gameName === p.name
                    ? "bg-ref text-pitch"
                    : "bg-line text-mist hover:text-chalk hover:bg-line/80"
                  }`}
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>

        {/* Custom name input */}
        {gameName === "Custom" && (
          <Input
            label="Game Name"
            placeholder="e.g. Word Association, Spelling Bee..."
            value={customName}
            onChange={(e) => setCustomName(e.target.value)}
          />
        )}

        {/* Rules */}
        <Textarea
          label={rules === "" && gameName !== "Custom"
            ? "Rules (leave blank to auto-fetch)"
            : "Rules"
          }
          placeholder={
            gameName === "Rock Paper Scissors" || gameName === "Riddle"
              ? "Leave blank - AI will fetch canonical rules automatically"
              : "Describe how to judge the winner..."
          }
          value={rules}
          onChange={(e) => setRules(e.target.value)}
          rows={3}
          hint={
            rules === ""
              ? "✨ AI will fetch and apply official rules for this game"
              : undefined
          }
        />

        {/* Players */}
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Player 1"
            placeholder="e.g. Zaid"
            value={player1}
            onChange={(e) => setPlayer1(e.target.value)}
          />
          <Input
            label="Player 2"
            placeholder="e.g. Claude"
            value={player2}
            onChange={(e) => setPlayer2(e.target.value)}
          />
        </div>

        {/* Settings row */}
        <div className="grid grid-cols-2 gap-3">
          <Select
            label="Visibility"
            options={VISIBILITY_OPTIONS}
            value={visibility}
            onChange={(e) => setVisibility(e.target.value)}
          />
          <Select
            label="Rounds"
            options={ROUNDS_OPTIONS}
            value={maxRounds}
            onChange={(e) => setMaxRounds(e.target.value)}
          />
        </div>

        {/* Error */}
        {error && (
          <p className="text-xs text-loss bg-loss/5 border border-loss/20
                        rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        {/* Pending */}
        {loading && (
          <TxPending
            message="Creating game..."
            txHash={txHash || undefined}
          />
        )}

        <Button
          type="submit"
          size="lg"
          loading={loading}
          className="w-full mt-1"
        >
          Create Game
        </Button>
      </form>
    </Card>
  );
}
