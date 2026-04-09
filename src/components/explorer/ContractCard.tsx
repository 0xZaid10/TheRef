"use client";

import { useState }        from "react";
import { Badge }           from "@/components/ui/Badge";
import { Button }          from "@/components/ui/Button";
import { Card, CardDivider } from "@/components/ui/Card";
import { copyToClipboard, truncateAddr, cn } from "@/lib/utils";
import {
  CONTRACT_NAMES,
  CONTRACT_DESCRIPTIONS,
  NetworkAddresses,
} from "@/config/networks";

interface ContractCardProps {
  contractKey:  keyof NetworkAddresses;
  address:      string;
  explorerUrl:  string;
  networkName:  string;
}

const CONTRACT_METHODS: Record<string, { writes: string[]; reads: string[] }> = {
  CORE: {
    writes: ["start_game", "submit_move", "judge_game", "end_game", "declare_draw", "join_game", "set_leaderboard_vault"],
    reads:  ["get_game_state", "get_round_result", "get_leaderboard", "get_player_stats", "get_active_games", "get_total_games"],
  },
  CORE_V1: {
    writes: ["start_game", "submit_move", "judge_game", "end_game", "set_leaderboard_vault"],
    reads:  ["get_game_state", "get_round_result", "get_leaderboard", "get_player_stats", "get_active_games", "get_total_games"],
  },
  LB: {
    writes: ["authorize", "record_result"],
    reads:  ["get_leaderboard", "get_player_stats", "get_top_players"],
  },
  ORG: {
    writes: ["register", "update_status", "increment_games_hosted"],
    reads:  ["get", "is_active", "get_all", "get_count"],
  },
  FEE: {
    writes: ["collect_fee", "authorize_caller", "set_fee", "set_treasury", "withdraw"],
    reads:  ["get_fee", "get_balance", "get_all_fees", "get_treasury"],
  },
  TRN: {
    writes: ["authorize_organizer", "create_tournament", "join_tournament", "start_tournament", "record_match_result"],
    reads:  ["get_tournament", "get_standings", "get_bracket", "list_tournaments", "get_total"],
  },
};

export function ContractCard({
  contractKey,
  address,
  explorerUrl,
  networkName,
}: ContractCardProps) {
  const [copied,    setCopied]    = useState(false);
  const [expanded,  setExpanded]  = useState(false);

  const name        = CONTRACT_NAMES[contractKey];
  const description = CONTRACT_DESCRIPTIONS[contractKey];
  const methods     = CONTRACT_METHODS[contractKey];
  const explorerLink = `${explorerUrl}/address/${address}`;

  async function handleCopy() {
    await copyToClipboard(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Card className="group">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="ref" size="sm">{contractKey}</Badge>
            <Badge
              variant={networkName === "Studionet" ? "studionet" : "bradbury"}
              size="sm"
              dot
            >
              {networkName}
            </Badge>
          </div>
          <h3 className="font-display font-700 text-chalk text-base">
            {name}
          </h3>
          <p className="text-xs text-mist mt-0.5 leading-relaxed">
            {description}
          </p>
        </div>
      </div>

      {/* Address */}
      <div className="flex items-center gap-2 p-3 rounded-xl bg-pitch border border-line mb-3">
        <code className="font-mono text-xs text-chalk flex-1 truncate">
          {address}
        </code>
        <button
          onClick={handleCopy}
          className={cn(
            "shrink-0 px-2 py-1 rounded-lg text-xs font-mono font-500",
            "transition-all duration-200",
            copied
              ? "bg-win/20 text-win border border-win/30"
              : "bg-line text-mist hover:text-chalk hover:bg-line/80"
          )}
        >
          {copied ? "✓ Copied" : "Copy"}
        </button>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 mb-3">
        <a
          href={explorerLink}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1"
        >
          <Button variant="outline" size="sm" className="w-full">
            View on Explorer →
          </Button>
        </a>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? "Hide" : "Methods"}
        </Button>
      </div>

      {/* Expanded methods */}
      {expanded && (
        <>
          <CardDivider />
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] text-mist uppercase font-mono tracking-wider mb-2">
                Write Methods
              </p>
              <div className="flex flex-col gap-1">
                {methods.writes.map((m) => (
                  <span
                    key={m}
                    className="font-mono text-xs text-chalk px-2 py-1
                               rounded-lg bg-pitch border border-line"
                  >
                    {m}()
                  </span>
                ))}
              </div>
            </div>
            <div>
              <p className="text-[10px] text-mist uppercase font-mono tracking-wider mb-2">
                Read Methods
              </p>
              <div className="flex flex-col gap-1">
                {methods.reads.map((m) => (
                  <span
                    key={m}
                    className="font-mono text-xs text-mist px-2 py-1
                               rounded-lg bg-pitch border border-line"
                  >
                    {m}()
                  </span>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </Card>
  );
}
