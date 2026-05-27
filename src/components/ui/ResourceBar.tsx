import { cn } from "../../utils/cn";

type ResourceBarProps = {
  variant: "mana" | "nexus";
  current: number;
  max: number;
  flash?: boolean;
  compact?: boolean;
};

export function ResourceBar({ variant, current, max, flash, compact }: ResourceBarProps) {
  const pct = Math.max(0, Math.min(100, (current / max) * 100));
  const isMana = variant === "mana";

  return (
    <div className={cn("flex min-w-0 items-center gap-2", compact ? "gap-1.5" : "gap-2")}>
      <span className={cn("shrink-0 font-bold", compact ? "text-[10px]" : "text-xs")}>
        {isMana ? "◆" : "♥"}
      </span>
      <div
        className={cn(
          "relative flex-1 overflow-hidden rounded-sm border border-black/40 bg-black/50",
          compact ? "h-2.5" : "h-3.5"
        )}
      >
        <div
          className={cn(
            "h-full rounded-sm transition-all duration-700",
            flash && "animate-pulse",
            isMana
              ? "bg-gradient-to-r from-blue-500 to-blue-700"
              : "bg-gradient-to-r from-red-500 to-red-900"
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span
        className={cn(
          "shrink-0 tabular-nums font-bold",
          compact ? "text-[10px]" : "text-xs",
          isMana ? "text-blue-300" : "text-red-300"
        )}
      >
        {current}/{max}
      </span>
    </div>
  );
}
