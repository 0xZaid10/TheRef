import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// Tailwind class merging
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Convert base-36 game ID string to number for contract calls
// "00001" -> 1, "0000A" -> 10, "0000G" -> 16
export function gidToNum(gid: string): number {
  const stripped = gid.replace(/^0+/, "") || "0";
  return parseInt(stripped, 36) || 1;
}

// Format game ID for display
export function formatGid(gid: string): string {
  return gid.toUpperCase();
}

// Truncate ethereum address
export function truncateAddr(addr: string, chars = 4): string {
  if (!addr || addr.length < 10) return addr;
  return `${addr.slice(0, chars + 2)}...${addr.slice(-chars)}`;
}

// Format score - handles both string and number
export function formatScore(score: string | number): string {
  const n = typeof score === "string" ? parseFloat(score) : score;
  if (isNaN(n)) return "0";
  return n % 1 === 0 ? String(n) : n.toFixed(1);
}

// Format confidence as percentage
export function formatConf(conf: string | number): string {
  const n = typeof conf === "string" ? parseFloat(conf) : conf;
  if (isNaN(n)) return "-";
  return `${Math.round(n * 100)}%`;
}

// Time ago helper
export function timeAgo(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// Parse verdict from judge_game payload
// "Judgment complete. Winner: Claude | Score: {\"Zaid\": 0.0, \"Claude\": 3.5}"
export function parseVerdict(payload: string): {
  winner: string;
  isDraw: boolean;
  score:  Record<string, number>;
  raw:    string;
} {
  const winner = payload.match(/Winner:\s*([^|]+)/)?.[1]?.trim() ?? "";
  const isDraw = payload.toLowerCase().includes("draw");

  let score: Record<string, number> = {};
  const scoreMatch = payload.match(/Score:\s*(\{.+\})/);
  if (scoreMatch) {
    try {
      const cleaned = scoreMatch[1].replace(/\\"/g, '"');
      score = JSON.parse(cleaned);
    } catch {}
  }

  return { winner, isDraw, score, raw: payload };
}

// Get vote color class
export function voteColor(vote: string): string {
  switch (vote.toUpperCase()) {
    case "AGREE":    return "text-agree";
    case "TIMEOUT":  return "text-timeout";
    case "DISAGREE": return "text-disagree";
    default:         return "text-mist";
  }
}

// Get vote icon
export function voteIcon(vote: string): string {
  switch (vote.toUpperCase()) {
    case "AGREE":    return "✓";
    case "TIMEOUT":  return "⏱";
    case "DISAGREE": return "✗";
    default:         return "?";
  }
}

// Shorten model name for display
export function shortModel(model: string): string {
  return model
    .split("/").pop()!
    .replace(/-\d{4,}.*/, "")   // strip version numbers
    .replace(/-preview$/, "")
    .replace(/:free$/, "")
    .slice(0, 24);
}

// Result color class
export function resultColor(result: string): string {
  switch (result) {
    case "player1":
    case "player2": return "text-win";
    case "draw":    return "text-draw";
    default:        return "text-mist";
  }
}

// Copy to clipboard with fallback
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback
    const el = document.createElement("textarea");
    el.value = text;
    document.body.appendChild(el);
    el.select();
    document.execCommand("copy");
    document.body.removeChild(el);
    return true;
  }
}
