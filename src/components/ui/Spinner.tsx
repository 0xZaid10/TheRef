import { cn } from "@/lib/utils";

interface SpinnerProps {
  size?:    "sm" | "md" | "lg";
  color?:   "ref" | "chalk" | "mist";
  className?: string;
}

const sizes = {
  sm: "w-3.5 h-3.5 border-[1.5px]",
  md: "w-5   h-5   border-2",
  lg: "w-8   h-8   border-2",
};

const colors = {
  ref:   "border-ref border-t-transparent",
  chalk: "border-chalk border-t-transparent",
  mist:  "border-mist border-t-transparent",
};

export function Spinner({ size = "md", color = "ref", className }: SpinnerProps) {
  return (
    <span
      role="status"
      aria-label="Loading"
      className={cn(
        "inline-block rounded-full animate-spin shrink-0",
        sizes[size],
        colors[color],
        className
      )}
    />
  );
}

//  Full page loading state 
export function PageLoader({ message = "Loading..." }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4">
      <Spinner size="lg" />
      <p className="text-mist text-sm">{message}</p>
    </div>
  );
}

//  Inline loading row 
export function LoadingRow({ message = "Processing..." }: { message?: string }) {
  return (
    <div className="flex items-center gap-2.5 py-3 px-4 rounded-xl bg-turf border border-line">
      <Spinner size="sm" />
      <span className="text-sm text-mist">{message}</span>
    </div>
  );
}

//  Tx pending state 
export function TxPending({
  message = "Waiting for consensus...",
  txHash,
}: {
  message?: string;
  txHash?:  string;
}) {
  return (
    <div className="flex flex-col gap-2 py-4 px-5 rounded-xl bg-ref/5 border border-ref/20">
      <div className="flex items-center gap-2.5">
        <Spinner size="sm" color="ref" />
        <span className="text-sm text-chalk font-500">{message}</span>
      </div>
      {txHash && (
        <p className="text-[11px] font-mono text-mist pl-6 truncate">
          {txHash}
        </p>
      )}
      <p className="text-[11px] text-mist pl-6">
        5 independent AI models are reaching consensus
      </p>
    </div>
  );
}
