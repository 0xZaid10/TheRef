// TheRef contracts v2 — updated for new genlayer.ts writeContract(network, ...) signature
import { writeContract, readContract, getClient } from "./genlayer";
import { NetworkConfig } from "@/config/networks";

//  Types 

export interface GameState {
  game_id:        string;
  game_name:      string;
  visibility:     string;
  max_rounds:     number;
  rules:          string;
  question:       string;
  player1:        string;
  player2:        string;
  agent1:         string;
  agent2:         string;
  status:         string;
  round_count:    number;
  judged_through: number;
  winner:         string;
  score:          Record<string, string>;
  player_types:   Record<string, string>;
  caller:         string;
  rounds:         RoundResult[];
}

export interface RoundResult {
  round_number:   number;
  move_player1:   string;
  move_player2:   string;
  result:         string;
  reason_type:    string;
  invalid_player: string;
  reasoning:      string;
  confidence:     string;
  status:         string;
}

export interface PlayerStats {
  player:  string;
  wins:    number;
  losses:  number;
  draws:   number;
  score:   string;
  games?:  number;
}

export interface LeaderboardEntry extends PlayerStats {
  player_type?: string;
}

export interface ActiveGame {
  game_id:     string;
  game_name:   string;
  player1:     string;
  player2:     string;
  round_count: number;
  max_rounds:  number;
}

export interface Tournament {
  tid:              string;
  name:             string;
  game_name:        string;
  format:           string;
  max_players:      number;
  entry_fee_wei:    number;
  prize_pool_wei:   number;
  prize_split:      number[];
  rules:            string;
  rounds_per_match: number;
  organizer:        string;
  status:           string;
  players:          string[];
  bracket:          BracketMatch[];
  current_round:    number;
  match_count:      number;
  winner:           string;
}

export interface BracketMatch {
  match_id: number;
  round:    number;
  player1:  string;
  player2:  string;
  game_id:  string;
  winner:   string;
  status:   string;
}

export interface Standing {
  player:     string;
  address:    string;
  type:       string;
  wins:       number;
  losses:     number;
  draws:      number;
  points:     number;
  eliminated: boolean;
}

//  Sanitizers

function str(v: unknown, fallback = ""): string {
  if (v === undefined || v === null) return fallback;
  return String(v);
}

function int(v: unknown, fallback = 0): number {
  const n = typeof v === "number" ? v : parseInt(String(v ?? fallback), 10);
  return isNaN(n) ? fallback : n;
}

function intArr(v: unknown, fallback: number[]): number[] {
  if (!Array.isArray(v)) return fallback;
  const mapped = v.map(x => int(x, 0));
  return mapped.some(isNaN) ? fallback : mapped;
}

function gidToNum(gid: string): number {
  return parseInt(String(gid).replace(/^0+/, "") || "0", 36) || 1;
}

//  RefereeCore - Writes

export async function startGame(
  network: NetworkConfig,
  params: {
    gameName:   string;
    visibility: string;
    rules:      string;
    player1:    string;
    player2:    string;
    agent1?:    string;
    agent2?:    string;
  }
) {
  const agent1 = str(params.agent1).trim();
  const agent2 = str(params.agent2).trim();
  return writeContract(network, network.addresses.CORE, "start_game", [
    str(params.gameName),
    str(params.visibility, "public"),
    str(params.rules),
    str(params.player1),
    str(params.player2),
    agent1 || 0,
    agent2 || 0,
  ]);
}

export async function submitMove(
  network: NetworkConfig,
  gameId:  string,
  player:  string,
  move:    string
) {
  return writeContract(network, network.addresses.CORE, "submit_move", [
    gidToNum(str(gameId)),
    str(player),
    str(move),
  ]);
}

export async function judgeGame(network: NetworkConfig, gameId: string) {
  return writeContract(network, network.addresses.CORE, "judge_game", [
    gidToNum(str(gameId)),
  ]);
}

export async function endGame(network: NetworkConfig, gameId: string) {
  return writeContract(network, network.addresses.CORE, "end_game", [
    gidToNum(str(gameId)),
  ]);
}

export async function forfeitGame(network: NetworkConfig, gameId: string) {
  return writeContract(network, network.addresses.CORE, "forfeit", [
    gidToNum(str(gameId)),
  ]);
}

export async function declareDrawGame(network: NetworkConfig, gameId: string) {
  return writeContract(network, network.addresses.CORE, "declare_draw", [
    gidToNum(str(gameId)),
  ]);
}

export async function joinGame(
  network:  NetworkConfig,
  gameId:   string,
  player2:  string,
  agent2?:  string
) {
  return writeContract(network, network.addresses.CORE, "join_game", [
    str(gameId),
    str(player2),
    agent2 || 0,
  ]);
}

//  RefereeCore - Reads

export async function getGameState(network: NetworkConfig, gameId: string): Promise<GameState | null> {
  try {
    const result = await readContract(network, network.addresses.CORE, "get_game_state", [str(gameId)]);
    return result as GameState;
  } catch { return null; }
}

export async function getRoundResult(network: NetworkConfig, gameId: string, roundNumber: number): Promise<RoundResult | null> {
  try {
    const result = await readContract(network, network.addresses.CORE, "get_round_result", [str(gameId), int(roundNumber)]);
    return result as RoundResult;
  } catch { return null; }
}

export async function getCoreLeaderboard(network: NetworkConfig, gameName: string): Promise<LeaderboardEntry[]> {
  try {
    const result = await readContract(network, network.addresses.CORE, "get_leaderboard", [str(gameName)]);
    return (result as LeaderboardEntry[]) ?? [];
  } catch { return []; }
}

export async function getPlayerStats(network: NetworkConfig, gameName: string, playerName: string): Promise<PlayerStats | null> {
  try {
    const result = await readContract(network, network.addresses.CORE, "get_player_stats", [str(gameName), str(playerName)]);
    return result as PlayerStats;
  } catch { return null; }
}

export async function getActiveGames(network: NetworkConfig): Promise<ActiveGame[]> {
  try {
    const result = await readContract(network, network.addresses.CORE, "get_active_games");
    return (result as ActiveGame[]) ?? [];
  } catch { return []; }
}

export async function getTotalGames(network: NetworkConfig): Promise<number> {
  try {
    const result = await readContract(network, network.addresses.CORE, "get_total_games");
    return int(result as number, 0);
  } catch { return 0; }
}

//  LeaderboardVault - Reads

export async function getVaultLeaderboard(network: NetworkConfig, gameName: string, playerType: "human" | "agent" | "all" = "all"): Promise<LeaderboardEntry[]> {
  try {
    const result = await readContract(network, network.addresses.LB, "get_leaderboard", [str(gameName), str(playerType, "all")]);
    return (result as LeaderboardEntry[]) ?? [];
  } catch { return []; }
}

export async function getTopPlayers(network: NetworkConfig, gameName: string, n: number = 10): Promise<LeaderboardEntry[]> {
  try {
    const result = await readContract(network, network.addresses.LB, "get_top_players", [str(gameName), int(n, 10)]);
    return (result as LeaderboardEntry[]) ?? [];
  } catch { return []; }
}

//  OrganizerRegistry - Reads

export async function isOrganizerActive(network: NetworkConfig, address: string): Promise<boolean> {
  try {
    const result = await readContract(network, network.addresses.ORG, "is_active", [str(address)]);
    return Boolean(result);
  } catch { return false; }
}

export async function getOrganizerCount(network: NetworkConfig): Promise<number> {
  try {
    const result = await readContract(network, network.addresses.ORG, "get_count");
    return int(result as number, 0);
  } catch { return 0; }
}

//  TournamentEngine - Writes

export async function createTournament(
  network: NetworkConfig,
  params: {
    name:           string;
    gameName:       string;
    format:         string;
    maxPlayers:     number;
    entryFeeWei:    number;
    prizeSplit:     number[];
    rules:          string;
    roundsPerMatch: number;
  }
) {
  return writeContract(network, network.addresses.TRN, "create_tournament", [
    str(params.name),
    str(params.gameName),
    str(params.format, "single_elimination"),
    int(params.maxPlayers, 4),
    int(params.entryFeeWei, 0),
    intArr(params.prizeSplit, [70, 30]),
    str(params.rules),
    int(params.roundsPerMatch, 1),
  ]);
}

export async function joinTournament(network: NetworkConfig, tid: string, playerName: string, playerType: string) {
  return writeContract(network, network.addresses.TRN, "join_tournament", [
    str(tid), str(playerName), str(playerType, "human"),
  ]);
}

export async function startTournament(network: NetworkConfig, tid: string) {
  return writeContract(network, network.addresses.TRN, "start_tournament", [str(tid)]);
}

export async function recordMatchResult(network: NetworkConfig, tid: string, matchId: number, winner: string) {
  return writeContract(network, network.addresses.TRN, "record_match_result", [
    str(tid), int(matchId, 0), str(winner),
  ]);
}

//  TournamentEngine - Reads

export async function getTournament(network: NetworkConfig, tid: string): Promise<Tournament | null> {
  try {
    const result = await readContract(network, network.addresses.TRN, "get_tournament", [str(tid)]);
    return result as Tournament;
  } catch { return null; }
}

export async function getBracket(network: NetworkConfig, tid: string): Promise<BracketMatch[]> {
  try {
    const result = await readContract(network, network.addresses.TRN, "get_bracket", [str(tid)]);
    return (result as BracketMatch[]) ?? [];
  } catch { return []; }
}

export async function getStandings(network: NetworkConfig, tid: string): Promise<Standing[]> {
  try {
    const result = await readContract(network, network.addresses.TRN, "get_standings", [str(tid)]);
    return (result as Standing[]) ?? [];
  } catch { return []; }
}

export async function listTournaments(network: NetworkConfig): Promise<Partial<Tournament>[]> {
  try {
    const result = await readContract(network, network.addresses.TRN, "list_tournaments");
    return (result as Partial<Tournament>[]) ?? [];
  } catch { return []; }
}

export async function getTournamentCount(network: NetworkConfig): Promise<number> {
  try {
    const result = await readContract(network, network.addresses.TRN, "get_total");
    return int(result as number, 0);
  } catch { return 0; }
}
