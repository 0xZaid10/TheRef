"use client";

import { useState }    from "react";
import { useNetwork }  from "@/context/NetworkContext";
import { createTournament } from "@/lib/contracts";
import { Button }      from "@/components/ui/Button";
import { Input }       from "@/components/ui/Input";
import { Textarea }    from "@/components/ui/Input";
import { Select }      from "@/components/ui/Input";
import { TxPending }   from "@/components/ui/Spinner";
import { Card, CardHeader } from "@/components/ui/Card";

const FORMAT_OPTIONS = [
  { value: "single_elimination", label: "Single Elimination - bracket, losers out" },
  { value: "round_robin",        label: "Round Robin - everyone plays everyone" },
  { value: "swiss",              label: "Swiss - paired by standings each round" },
];

const PLAYER_OPTIONS = [
  { value: "4",  label: "4 players" },
  { value: "8",  label: "8 players" },
  { value: "16", label: "16 players" },
  { value: "2",  label: "2 players (1v1)" },
];

interface CreateTournamentFormProps {
  onCreated: (tid: string) => void;
}

export function CreateTournamentForm({ onCreated }: CreateTournamentFormProps) {
  const { network } = useNetwork();

  const [name,       setName]       = useState("");
  const [gameName,   setGameName]   = useState("Trivia");
  const [format,     setFormat]     = useState("single_elimination");
  const [maxPlayers, setMaxPlayers] = useState("4");
  const [rules,      setRules]      = useState("");
  const [loading,    setLoading]    = useState(false);
  const [txHash,     setTxHash]     = useState("");
  const [error,      setError]      = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!network) return;
    if (!name.trim())     { setError("Tournament name required"); return; }
    if (!gameName.trim()) { setError("Game name required");       return; }
    setError("");
    setLoading(true);

    try {
      const result = await createTournament(network, {
        name:           name.trim(),
        gameName:       gameName.trim(),
        format,
        maxPlayers:     parseInt(maxPlayers),
        entryFeeWei:    0,
        prizeSplit:     [70, 30],
        rules:          rules.trim(),
        roundsPerMatch: 1,
      });
      setTxHash(result.txHash);
      onCreated(result.payload);
    } catch (err: any) {
      setError(String(err?.message ?? err).slice(0, 120));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader
        heading="Create Tournament"
        subtitle="Set up a bracket for AI-judged matches"
      />

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="Tournament Name"
          placeholder="e.g. Bradbury Trivia Cup"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Game"
            placeholder="e.g. Trivia"
            value={gameName}
            onChange={(e) => setGameName(e.target.value)}
          />
          <Select
            label="Max Players"
            options={PLAYER_OPTIONS}
            value={maxPlayers}
            onChange={(e) => setMaxPlayers(e.target.value)}
          />
        </div>

        <Select
          label="Format"
          options={FORMAT_OPTIONS}
          value={format}
          onChange={(e) => setFormat(e.target.value)}
        />

        <Textarea
          label="Match Rules (optional)"
          placeholder="Leave blank to auto-fetch rules for the game..."
          value={rules}
          onChange={(e) => setRules(e.target.value)}
          rows={2}
          hint={!rules ? "✨ AI will fetch canonical rules automatically" : undefined}
        />

        {error && (
          <p className="text-xs text-loss bg-loss/5 border border-loss/20
                        rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        {loading && (
          <TxPending message="Creating tournament..." txHash={txHash || undefined} />
        )}

        <Button type="submit" loading={loading} className="w-full">
          Create Tournament
        </Button>
      </form>
    </Card>
  );
}
