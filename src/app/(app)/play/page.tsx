"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams }  from "next/navigation";
import { motion }           from "framer-motion";
import { useNetwork }       from "@/context/NetworkContext";
import { getActiveGames, ActiveGame } from "@/lib/contracts";
import { StartGameForm }    from "@/components/game/StartGameForm";
import { GameCard }         from "@/components/game/GameCard";
import { GameView }         from "@/components/game/GameView";
import { Button }           from "@/components/ui/Button";
import { PageLoader }       from "@/components/ui/Spinner";

function PlayContent() {
  const { network }   = useNetwork();
  const searchParams  = useSearchParams();
  const [activeGames, setActiveGames] = useState<ActiveGame[]>([]);
  const [selectedId,  setSelectedId]  = useState<string | null>(
    searchParams.get("game")
  );
  const [showForm,    setShowForm]    = useState(false);
  const [loading,     setLoading]     = useState(true);

  useEffect(() => {
    if (!network) return;
    async function load() {
      setLoading(true);
      try {
        const games = await getActiveGames(network!);
        setActiveGames(games);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [network]);

  function handleGameCreated(gameId: string) {
    setShowForm(false);
    if (gameId) setSelectedId(gameId);
    // Refresh active games list
    if (network) {
      getActiveGames(network).then(setActiveGames);
    }
  }

  return (
    <div className="page">
      <div className="container-ref">

        {/*  Page header  */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-3xl font-800 text-chalk">Play</h1>
            <p className="text-mist text-sm mt-1">
              Create a game or continue an active match
            </p>
          </div>
          <Button
            onClick={() => { setShowForm(!showForm); setSelectedId(null); }}
            variant={showForm ? "secondary" : "primary"}
          >
            {showForm ? "Cancel" : "+ New Game"}
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/*  Left: game list  */}
          <div className="lg:col-span-1 flex flex-col gap-4">

            {/* New game form */}
            {showForm && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y:  0 }}
                transition={{ duration: 0.3 }}
              >
                <StartGameForm onGameCreated={handleGameCreated} />
              </motion.div>
            )}

            {/* Active games */}
            <div>
              <p className="text-xs text-mist uppercase font-mono tracking-wider mb-3">
                Active Games ({activeGames.length})
              </p>

              {loading ? (
                <PageLoader message="Loading games..." />
              ) : activeGames.length === 0 ? (
                <div className="text-center py-10 text-mist text-sm">
                  <p className="text-2xl mb-2">🎮</p>
                  No active games.
                  <br />
                  <button
                    onClick={() => setShowForm(true)}
                    className="text-ref hover:underline mt-1 inline-block"
                  >
                    Start one →
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {activeGames.map((game) => (
                    <GameCard
                      key={game.game_id}
                      game={game}
                      active={selectedId === game.game_id}
                      onClick={() => {
                        setSelectedId(game.game_id);
                        setShowForm(false);
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/*  Right: game view  */}
          <div className="lg:col-span-2">
            {selectedId ? (
              <GameView gameId={selectedId} />
            ) : (
              <div className="flex flex-col items-center justify-center
                              min-h-[400px] rounded-2xl border border-dashed border-line
                              text-center gap-4 p-8">
                <div className="text-4xl">⚖️</div>
                <div>
                  <p className="font-display text-lg font-600 text-chalk">
                    Select a game
                  </p>
                  <p className="text-mist text-sm mt-1">
                    Choose from the list or start a new game
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => setShowForm(true)}
                >
                  + New Game
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PlayPage() {
  return (
    <Suspense fallback={<PageLoader message="Loading..." />}>
      <PlayContent />
    </Suspense>
  );
}
