import { cn } from "../../utils/cn";
import { AbsoluteFrame } from "../layout/AbsoluteFrame";

type EnemyStripProps = {
  enemyMana: number;
  enemyMaxMana: number;
  displayEnemyNexus: number;
  nexusMax: number;
  enemyDeckCount: number;
  flashMana: boolean;
  flashNexus: boolean;
  activeTurn: boolean;
  className?: string;
  embedded?: boolean;
};

export function EnemyStrip({
  enemyMana,
  enemyMaxMana,
  displayEnemyNexus,
  nexusMax,
  enemyDeckCount,
  flashMana,
  flashNexus,
  activeTurn,
  className = "",
  embedded = false,
}: EnemyStripProps) {
  return (
    <AbsoluteFrame
      image="/images/enemy_strip.png"
      className={cn(
        embedded
          ? "inset-0 h-full w-full"
          : "left-1/2 top-0 z-30 w-[var(--enemy-w)] -translate-x-1/2",
        "transition-all duration-700",
        activeTurn && "ring-1 ring-rose-400/40",
        className
      )}
      bgStyle={embedded ? undefined : { top: "-4%", bottom: "-10%", height: "auto" }}
      contentClassName="grid grid-cols-[10%_1fr_13%] grid-rows-[48%_52%] px-[2.8%] pb-[8.5%] pt-[5.5%]"
    >
      <div className="row-span-2 flex items-center justify-center">
        <span className="text-[0.95em] leading-none drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)]">👹</span>
      </div>

      <div className="flex items-start self-start pl-[0.5%] pt-[2%]">
        <span className="font-display text-[0.62em] font-bold leading-tight text-rose-100 drop-shadow-[0_1px_4px_rgba(0,0,0,1)]">
          Enemy
        </span>
        <span className="ml-[0.35em] text-[0.56em] leading-tight text-slate-300 drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]">
          · {enemyDeckCount}
        </span>
      </div>

      <div className="flex items-start justify-between px-[6%] pt-[10%]">
        <span
          className={cn(
            "tabular-nums text-[0.58em] font-bold leading-none text-blue-100 drop-shadow-[0_1px_4px_rgba(0,0,0,1)]",
            flashMana && "animate-pulse"
          )}
        >
          {enemyMana}
        </span>
        <span
          className={cn(
            "tabular-nums text-[0.58em] font-bold leading-none text-red-100 drop-shadow-[0_1px_4px_rgba(0,0,0,1)]",
            flashNexus && "animate-pulse"
          )}
        >
          {displayEnemyNexus}
        </span>
      </div>

      <div className="flex items-end pb-[4%] pl-[0.5%]">
        <span
          className={cn(
            "tabular-nums text-[0.62em] font-bold leading-none text-blue-100 drop-shadow-[0_1px_4px_rgba(0,0,0,1)]",
            flashMana && "animate-pulse"
          )}
        >
          ◆ {enemyMana}/{enemyMaxMana}
        </span>
      </div>

      <div className="flex items-end justify-end pb-[4%] pr-[3%]">
        <span
          className={cn(
            "tabular-nums text-[0.62em] font-bold leading-none text-red-100 drop-shadow-[0_1px_4px_rgba(0,0,0,1)]",
            flashNexus && "animate-pulse"
          )}
        >
          ♥ {displayEnemyNexus}/{nexusMax}
        </span>
      </div>
    </AbsoluteFrame>
  );
}
