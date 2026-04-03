"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter }           from "next/navigation";
import { motion }              from "framer-motion";
import { useNetwork }          from "@/context/NetworkContext";
import { Button }              from "@/components/ui/Button";
import { Card }                from "@/components/ui/Card";
import { Badge }               from "@/components/ui/Badge";
import { getTotalGames, getActiveGames, getTournamentCount, getOrganizerCount, ActiveGame } from "@/lib/contracts";

const fade = (delay = 0) => ({
  initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, delay, ease: "easeOut" },
});

const STEPS = [
  { n: "01", icon: "🎮", title: "Create a Game",        desc: "Name your game, set the rules - or leave it blank and let AI fetch canonical rules automatically." },
  { n: "02", icon: "⚡", title: "Submit Moves",          desc: "Players submit natural language moves. Chess, trivia, riddles, debates - any game, any format." },
  { n: "03", icon: "⚖️", title: "AI Consensus Verdict", desc: "5 independent AI models independently judge. Majority rules. Verdict stored on-chain forever." },
];

const MODELS = [
  { name: "GPT-5.4",     org: "OpenAI",    color: "text-emerald-400" },
  { name: "Claude 4.6",  org: "Anthropic", color: "text-ref" },
  { name: "Gemini 3",    org: "Google",    color: "text-blue-400" },
  { name: "DeepSeek V3", org: "DeepSeek",  color: "text-violet-400" },
  { name: "Llama 4",     org: "Meta",      color: "text-orange-400" },
];

export default function HomePage() {
  const { network } = useNetwork();
  const router      = useRouter();
  const hasFetched  = useRef(false);

  const [stats, setStats]         = useState({ totalGames: 0, activeGames: 0, tournaments: 0, organizers: 0 });
  const [recentGames, setRecentGames] = useState<ActiveGame[]>([]);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    if (!network || hasFetched.current) return;
    hasFetched.current = true; // only fetch once per mount, prevents rate-limit hammering

    (async () => {
      setLoading(true);
      try {
        // Stagger requests slightly to avoid hitting rate limits simultaneously
        const total   = await getTotalGames(network).catch(() => 0);
        const active  = await getActiveGames(network).catch(() => [] as ActiveGame[]);
        await new Promise(r => setTimeout(r, 300));
        const tourney = await getTournamentCount(network).catch(() => 0);
        const orgs    = await getOrganizerCount(network).catch(() => 0);

        setRecentGames((active as ActiveGame[]).slice(0, 4));
        setStats({
          totalGames:  total as number,
          activeGames: (active as ActiveGame[]).length,
          tournaments: tourney as number,
          organizers:  orgs as number,
        });
      } finally {
        setLoading(false);
      }
    })();
  }, [network]);

  return (
    <div className="min-h-screen bg-pitch">

      {/* Hero */}
      <section className="relative pt-20 pb-24 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-70 pointer-events-none" />
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-ref/30 to-transparent" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[450px] rounded-full bg-ref/6 blur-[120px] pointer-events-none" />

        <div className="container-ref relative z-10 flex flex-col items-center text-center">
          <motion.div {...fade(0)}>
            <Badge variant="ref" dot size="md" className="mb-6">
              Built on GenLayer . Optimistic Democracy
            </Badge>
          </motion.div>

          <motion.h1
            {...fade(0.1)}
            className="font-display font-800 text-chalk tracking-tight max-w-4xl"
            style={{ fontSize: "clamp(42px,6vw,72px)", lineHeight: 1.04, letterSpacing: "-0.04em" }}
          >
            Every game deserves<br />
            <span className="text-ref text-glow">a fair ref.</span>
          </motion.h1>

          <motion.p {...fade(0.2)} className="text-mist text-lg mt-6 max-w-xl leading-relaxed">
            5 independent AI models reach consensus to judge any game.<br />
            Verifiable, incorruptible, on-chain forever.
          </motion.p>

          <motion.div {...fade(0.3)} className="flex flex-wrap items-center justify-center gap-3 mt-10">
            <Button size="lg" onClick={() => router.push("/play")} iconRight={<span>→</span>}>
              Start a Game
            </Button>
            <Button variant="outline" size="lg" onClick={() => router.push("/tournaments")}>
              View Tournaments
            </Button>
          </motion.div>

          <motion.div {...fade(0.4)} className="mt-8">
            <span className="text-xs text-mist font-mono">
              Connected to <span className="text-ref">{network?.name}</span>
            </span>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="px-4 pb-16">
        <div className="container-ref">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Total Games",  value: loading ? "-" : stats.totalGames,  icon: "🎮" },
              { label: "Active Games", value: loading ? "-" : stats.activeGames, icon: "⚡" },
              { label: "Tournaments",  value: loading ? "-" : stats.tournaments, icon: "🏆" },
              { label: "Organizers",   value: loading ? "-" : stats.organizers,  icon: "🏛" },
            ].map((s) => (
              <div key={s.label} className="relative bg-turf border border-line rounded-xl p-5 text-center overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2/3 h-px bg-gradient-to-r from-transparent via-ref/40 to-transparent" />
                <div className="text-2xl mb-2">{s.icon}</div>
                <div className="font-display text-3xl font-800 text-chalk">{s.value}</div>
                <div className="text-xs text-mist mt-1 font-mono uppercase tracking-wider">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="px-4 pb-20">
        <div className="container-ref">
          <div className="text-center mb-10">
            <h2 className="font-display text-3xl font-700 text-chalk">How it works</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {STEPS.map((step, i) => (
              <motion.div key={step.n} {...fade(i * 0.1)}>
                <Card className="h-full relative overflow-hidden group hover:border-ref/30 transition-all duration-300">
                  <div className="absolute -top-3 -right-2 font-display text-8xl font-800 text-line select-none pointer-events-none group-hover:text-ref/5 transition-colors duration-300">
                    {step.n}
                  </div>
                  <div className="relative z-10">
                    <div className="text-3xl mb-4">{step.icon}</div>
                    <h3 className="font-display font-700 text-chalk text-lg mb-2">{step.title}</h3>
                    <p className="text-mist text-sm leading-relaxed">{step.desc}</p>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Validator panel */}
      <section className="px-4 pb-20">
        <div className="container-ref">
          <Card variant="highlight" className="overflow-hidden">
            <div className="flex flex-col md:flex-row items-center gap-8 p-2">
              <div className="flex-1">
                <Badge variant="ref" className="mb-3">Optimistic Democracy</Badge>
                <h2 className="font-display text-2xl font-700 text-chalk mb-3">5 AI models. One verdict.</h2>
                <p className="text-mist text-sm leading-relaxed max-w-sm">
                  Every judgment is independently evaluated by validators running different AI models
                  from competing companies. No single model can manipulate the outcome.
                </p>
              </div>
              <div className="flex flex-col gap-2 w-full md:w-auto md:min-w-[280px]">
                {MODELS.map((m, i) => (
                  <motion.div
                    key={m.name}
                    initial={{ opacity: 0, x: 16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.08, duration: 0.3 }}
                    className="flex items-center justify-between gap-4 px-3.5 py-2.5 rounded-xl bg-pitch border border-line"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-win animate-pulse" />
                      <span className={`font-mono text-sm font-500 ${m.color}`}>{m.name}</span>
                    </div>
                    <span className="text-xs text-mist">{m.org}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* Active games preview */}
      {recentGames.length > 0 && (
        <section className="px-4 pb-20">
          <div className="container-ref">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display text-2xl font-700 text-chalk">Active Games</h2>
              <Button variant="ghost" size="sm" onClick={() => router.push("/play")}>View all →</Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {recentGames.map((game) => (
                <Card key={game.game_id} hover onClick={() => router.push(`/play?game=${game.game_id}`)} className="cursor-pointer">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="active" dot size="sm">Active</Badge>
                        <span className="font-mono text-xs text-mist">#{game.game_id}</span>
                      </div>
                      <h3 className="font-display font-600 text-chalk">{game.game_name}</h3>
                      <p className="text-sm text-mist mt-1">
                        {game.player1} <span className="text-line mx-1">vs</span> {game.player2}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-xs text-mist font-mono">
                        Round {game.round_count}{game.max_rounds > 0 ? `/${game.max_rounds}` : ""}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="border-t border-line px-4 py-8">
        <div className="container-ref flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-mist font-mono">
          <span>TheRef - Built on <a href="https://genlayer.com" target="_blank" rel="noopener noreferrer" className="text-ref hover:underline">GenLayer</a></span>
          <span>5 AIs. One verdict. On-chain forever.</span>
        </div>
      </footer>
    </div>
  );
}
