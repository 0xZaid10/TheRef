import { cn } from "@/lib/utils";

type BadgeVariant =
  | "default"
  | "ref"
  | "win"
  | "loss"
  | "draw"
  | "active"
  | "pending"
  | "completed"
  | "agree"
  | "timeout"
  | "disagree"
  | "studionet"
  | "bradbury";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  dot?:     boolean;
  size?:    "sm" | "md";
}

const variants: Record<BadgeVariant, string> = {
  default:   "bg-line text-mist",
  ref:       "bg-ref/15 text-ref border border-ref/30",
  win:       "bg-win/10 text-win border border-win/20",
  loss:      "bg-loss/10 text-loss border border-loss/20",
  draw:      "bg-draw/10 text-draw border border-draw/20",
  active:    "bg-win/10 text-win border border-win/20",
  pending:   "bg-timeout/10 text-timeout border border-timeout/20",
  completed: "bg-mist/10 text-mist border border-mist/20",
  agree:     "bg-agree/10 text-agree border border-agree/20",
  timeout:   "bg-timeout/10 text-timeout border border-timeout/20",
  disagree:  "bg-disagree/10 text-disagree border border-disagree/20",
  studionet: "bg-ref/10 text-ref border border-ref/20",
  bradbury:  "bg-win/10 text-win border border-win/20",
};

const dotColors: Record<BadgeVariant, string> = {
  default:   "bg-mist",
  ref:       "bg-ref",
  win:       "bg-win",
  loss:      "bg-loss",
  draw:      "bg-draw",
  active:    "bg-win animate-pulse",
  pending:   "bg-timeout animate-pulse",
  completed: "bg-mist",
  agree:     "bg-agree",
  timeout:   "bg-timeout",
  disagree:  "bg-disagree",
  studionet: "bg-ref animate-pulse",
  bradbury:  "bg-win animate-pulse",
};

export function Badge({
  variant = "default",
  dot     = false,
  size    = "sm",
  children,
  className,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-mono font-500",
        size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs",
        variants[variant],
        className
      )}
      {...props}
    >
      {dot && (
        <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", dotColors[variant])} />
      )}
      {children}
    </span>
  );
}

//  Result badge specifically for game outcomes 
export function ResultBadge({
  result,
  playerName,
}: {
  result: string;
  playerName?: string;
}) {
  if (result === "draw") {
    return <Badge variant="draw">Draw</Badge>;
  }
  if (result === "player1" || result === "player2") {
    return (
      <Badge variant="win">
        {playerName ? `${playerName} wins` : "Winner"}
      </Badge>
    );
  }
  return <Badge variant="pending">{result}</Badge>;
}

//  Vote badge for validator consensus display 
export function VoteBadge({ vote }: { vote: string }) {
  const upper = vote.toUpperCase();
  const variant =
    upper === "AGREE"    ? "agree"   :
    upper === "TIMEOUT"  ? "timeout" :
    upper === "DISAGREE" ? "disagree": "default";
  const icon =
    upper === "AGREE"    ? "✓" :
    upper === "TIMEOUT"  ? "⏱" : "✗";

  return (
    <Badge variant={variant} dot={false}>
      {icon} {vote}
    </Badge>
  );
}
