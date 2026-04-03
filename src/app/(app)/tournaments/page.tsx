"use client";

import { useState, useEffect, useCallback } from "react";
import { motion }              from "framer-motion";
import { useNetwork }          from "@/context/NetworkContext";
import {
  listTournaments,
  getTournament,
  getStandings,
  getBracket,
  joinTournament,
  startTournament,
  Tournament,
  Standing,
  BracketMatch,
} from "@/lib/contracts";
import { CreateTournamentForm } from "@/components/tournament/CreateTournamentForm";
import { TournamentCard }       from "@/components/tournament/TournamentCard";
import { BracketView }          from "@/components/tournament/BracketView";
import { Standings }            from "@/components/tournament/Standings";
import { Button }               from "@/components/ui/Button";
import { Input }                from "@/components/ui/Input";
import { Badge }                from "@/components/ui/Badge";
import { Card, CardHeader, CardDivider } from "@/components/ui/Card";
import { TxPending, PageLoader, Spinner } from "@/components/ui/Spinner";

type TournamentSummary = {
  tid: string; name: string; format: string;
  status: string; players: number; max_players: number; prize_pool: number;
};

export default function TournamentsPage() {
  const { network } = useNetwork();

  const [list,        setList]        = useState<TournamentSummary[]>([]);
  const [selectedTid, setSelectedTid] = useState<string | null>(null);
  const [detail,      setDetail]      = useState<Tournament | null>(null);
  const [standings,   setStandings]   = useState<Standing[]>([]);
  const [bracket,     setBracket]     = useState<BracketMatch[]>([]);
  const [showCreate,  setShowCreate]  = useState(false);
  const [listLoading, setListLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [tab,         setTab]         = useState<"bracket" | "standings">("bracket");

  // Join form state
  const [joinPlayer,  setJoinPlayer]  = useState("");
  const [joinType,    setJoinType]    = useState("human");
  const [joining,     setJoining]     = useState(false);
  const [joinTx,      setJoinTx]      = useState("");
  const [joinError,   setJoinError]   = useState("");

  // Start tournament state
  const [starting,    setStarting]    = useState(false);
  const [startTx,     setStartTx]     = useState("");
  const [startError,  setStartError]  = useState("");

  // Load tournament list
  const loadList = useCallback(async () => {
    if (!network) return;
    setListLoading(true);
    try {
      const data = await listTournaments(network);
      setList((data as unknown as TournamentSummary[]).reverse());
    } finally {
      setListLoading(false);
    }
  }, [network]);

  useEffect(() => { loadList(); }, [loadList]);

  // Load tournament detail
  const loadDetail = useCallback(async (tid: string) => {
    if (!network) return;
    setDetailLoading(true);
    try {
      const [t, s, b] = await Promise.all([
        getTournament(network, tid),
        getStandings(network, tid),
        getBracket(network, tid),
      ]);
      setDetail(t);
      setStandings(s);
      setBracket(b);
    } finally {
      setDetailLoading(false);
    }
  }, [network]);

  useEffect(() => {
    if (selectedTid) loadDetail(selectedTid);
  }, [selectedTid, loadDetail]);

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    if (!network || !selectedTid || !joinPlayer.trim()) return;
    setJoinError("");
    setJoining(true);
    try {
      await joinTournament(network, selectedTid, joinPlayer.trim(), joinType);
      setJoinPlayer("");
      await loadDetail(selectedTid);
      await loadList();
    } catch (err: any) {
      setJoinError(String(err?.message ?? err).slice(0, 100));
    } finally {
      setJoining(false);
    }
  }

  async function handleStart() {
    if (!network || !selectedTid) return;
    setStartError("");
    setStarting(true);
    try {
      await startTournament(network, selectedTid);
      await loadDetail(selectedTid);
      await loadList();
    } catch (err: any) {
      setStartError(String(err?.message ?? err).slice(0, 100));
    } finally {
      setStarting(false);
    }
  }

  return (
    <div className="page">
      <div className="container-ref">

        {/*  Page header  */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-3xl font-800 text-chalk">
              Tournaments
            </h1>
            <p className="text-mist text-sm mt-1">
              Brackets, standings, and prize pools
            </p>
          </div>
          <Button
            onClick={() => { setShowCreate(!showCreate); setSelectedTid(null); }}
            variant={showCreate ? "secondary" : "primary"}
          >
            {showCreate ? "Cancel" : "+ New Tournament"}
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/*  Left: list  */}
          <div className="flex flex-col gap-4">

            {showCreate && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y:  0 }}
                transition={{ duration: 0.3 }}
              >
                <CreateTournamentForm
                  onCreated={(tid) => {
                    setShowCreate(false);
                    loadList().then(() => setSelectedTid(tid));
                  }}
                />
              </motion.div>
            )}

            <p className="text-xs text-mist uppercase font-mono tracking-wider">
              All Tournaments ({list.length})
            </p>

            {listLoading ? (
              <PageLoader message="Loading tournaments..." />
            ) : list.length === 0 ? (
              <div className="text-center py-10 text-mist text-sm">
                <p className="text-2xl mb-2">🏆</p>
                No tournaments yet.
                <br />
                <button
                  onClick={() => setShowCreate(true)}
                  className="text-ref hover:underline mt-1 inline-block"
                >
                  Create one →
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {list.map((t) => (
                  <TournamentCard
                    key={t.tid}
                    tournament={t}
                    active={selectedTid === t.tid}
                    onClick={() => {
                      setSelectedTid(t.tid);
                      setShowCreate(false);
                      setTab("bracket");
                    }}
                  />
                ))}
              </div>
            )}
          </div>

          {/*  Right: detail  */}
          <div className="lg:col-span-2">
            {!selectedTid ? (
              <div className="flex flex-col items-center justify-center
                              min-h-[400px] rounded-2xl border border-dashed border-line
                              text-center gap-4 p-8">
                <div className="text-4xl">🏆</div>
                <div>
                  <p className="font-display text-lg font-600 text-chalk">
                    Select a tournament
                  </p>
                  <p className="text-mist text-sm mt-1">
                    Choose from the list or create a new one
                  </p>
                </div>
              </div>
            ) : detailLoading ? (
              <div className="flex items-center justify-center min-h-[300px]">
                <Spinner size="lg" />
              </div>
            ) : detail ? (
              <div className="flex flex-col gap-4">

                {/* Tournament header */}
                <Card>
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div>
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <Badge
                          variant={
                            detail.status === "completed" ? "completed" :
                            detail.status === "active"    ? "active"    : "pending"
                          }
                          dot
                        >
                          {detail.status}
                        </Badge>
                        <span className="font-mono text-xs text-mist">{detail.tid}</span>
                      </div>
                      <h2 className="font-display text-2xl font-700 text-chalk">
                        {detail.name}
                      </h2>
                      <p className="text-mist text-sm mt-1">
                        {detail.game_name} . {detail.format.replace(/_/g, " ")}
                      </p>
                    </div>

                    <div className="text-right">
                      <div className="font-display text-3xl font-800 text-chalk">
                        {detail.players.length}
                        <span className="text-mist text-xl font-400">
                          /{detail.max_players}
                        </span>
                      </div>
                      <div className="text-[10px] text-mist font-mono uppercase">
                        players
                      </div>
                    </div>
                  </div>

                  {/* Winner banner */}
                  {detail.status === "completed" && detail.winner && (
                    <>
                      <CardDivider />
                      <div className="flex items-center gap-3 py-1">
                        <span className="text-2xl">🏆</span>
                        <div>
                          <p className="text-xs text-mist font-mono uppercase tracking-wider">
                            Champion
                          </p>
                          <p className="font-display text-xl font-700 text-ref">
                            {detail.winner}
                          </p>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Players list */}
                  {detail.players.length > 0 && (
                    <>
                      <CardDivider />
                      <div>
                        <p className="text-[10px] text-mist uppercase font-mono tracking-wider mb-2">
                          Registered Players
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {detail.players.map((p) => (
                            <span
                              key={p}
                              className="px-2 py-0.5 rounded-lg text-xs font-500
                                         bg-pitch border border-line text-chalk"
                            >
                              {p}
                            </span>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </Card>

                {/* Join form - open tournaments */}
                {detail.status === "open" && (
                  <Card>
                    <CardHeader heading="Join Tournament" />
                    <form onSubmit={handleJoin} className="flex flex-col gap-3">
                      <div className="grid grid-cols-2 gap-3">
                        <Input
                          label="Your Name"
                          placeholder="e.g. Zaid"
                          value={joinPlayer}
                          onChange={(e) => setJoinPlayer(e.target.value)}
                        />
                        <div>
                          <p className="text-xs font-500 text-mist uppercase tracking-wider mb-1.5">
                            Type
                          </p>
                          <div className="flex gap-2">
                            {["human", "agent"].map((t) => (
                              <button
                                key={t}
                                type="button"
                                onClick={() => setJoinType(t)}
                                className={`flex-1 py-2 rounded-xl text-xs font-500 capitalize
                                  transition-all border
                                  ${joinType === t
                                    ? "bg-ref text-pitch border-ref"
                                    : "bg-line text-mist border-line hover:text-chalk"
                                  }`}
                              >
                                {t}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      {joinError && (
                        <p className="text-xs text-loss">{joinError}</p>
                      )}
                      {joining && (
                        <TxPending message="Joining tournament..." txHash={joinTx || undefined} />
                      )}
                      <Button
                        type="submit"
                        loading={joining}
                        disabled={!joinPlayer.trim()}
                        className="w-full"
                      >
                        Join
                      </Button>
                    </form>
                  </Card>
                )}

                {/* Start button - open with 2+ players */}
                {detail.status === "open" && detail.players.length >= 2 && (
                  <Card className="border-ref/20 bg-ref/5">
                    <div className="flex items-center justify-between gap-4 flex-wrap">
                      <div>
                        <p className="text-sm font-500 text-chalk">
                          Ready to start
                        </p>
                        <p className="text-xs text-mist mt-0.5">
                          {detail.players.length} players registered
                        </p>
                      </div>
                      {starting ? (
                        <TxPending message="Starting tournament..." txHash={startTx || undefined} />
                      ) : (
                        <Button onClick={handleStart} loading={starting}>
                          Start Tournament →
                        </Button>
                      )}
                    </div>
                    {startError && (
                      <p className="text-xs text-loss mt-2">{startError}</p>
                    )}
                  </Card>
                )}

                {/* Bracket / Standings tabs */}
                {(bracket.length > 0 || standings.length > 0) && (
                  <div>
                    {/* Tab buttons */}
                    <div className="flex gap-1 mb-4 bg-turf border border-line
                                    rounded-xl p-1 w-fit">
                      {(["bracket", "standings"] as const).map((t) => (
                        <button
                          key={t}
                          onClick={() => setTab(t)}
                          className={`px-4 py-1.5 rounded-lg text-sm font-500 capitalize
                            transition-all duration-150
                            ${tab === t
                              ? "bg-ref text-pitch"
                              : "text-mist hover:text-chalk"
                            }`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>

                    <motion.div
                      key={tab}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.25 }}
                    >
                      {tab === "bracket" ? (
                        <BracketView
                          tid={detail.tid}
                          matches={bracket}
                          onUpdate={() => loadDetail(detail.tid)}
                        />
                      ) : (
                        <Standings
                          standings={standings}
                          winner={detail.winner}
                        />
                      )}
                    </motion.div>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
