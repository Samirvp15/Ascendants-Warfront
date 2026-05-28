import { cn } from "../../utils/cn";

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
}: EnemyStripProps) {
  return (
    <div
      className={cn(
        "relative w-full shrink-0 transition-all duration-700",
        activeTurn && "ring-1 ring-rose-400/40",
        className
      )}
    >
      <img
        src="/images/enemy_strip.png"
        alt=""
        aria-hidden
        className="pointer-events-none absolute inset-0 h-full w-full select-none object-fill"
        draggable={false}
      />

      <div
        className="absolute z-10 flex flex-col items-center justify-center"
        style={{ left: "1.2%", top: "50%", width: "10.5%", height: "88%", transform: "translateY(-50%)" }}
      >
        <span className="text-xl leading-none drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)]">👹</span>
      </div>

      <div className="absolute z-10" style={{ left: "12.5%", top: "22%" }}>
        <span className="font-display text-[10px] font-bold text-rose-100 drop-shadow-[0_1px_4px_rgba(0,0,0,1)]">
          Enemy
        </span>
        <span className="ml-1.5 text-[9px] text-slate-300 drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]">
          · {enemyDeckCount} cards
        </span>
      </div>

      <div
        className={cn("absolute z-20 tabular-nums", flashMana && "animate-pulse")}
        style={{ left: "6.5%", bottom: "18%" }}
      >
        <span className="text-[10px] font-bold text-blue-100 drop-shadow-[0_1px_4px_rgba(0,0,0,1)]">
          ◆ {enemyMana}/{enemyMaxMana}
        </span>
      </div>

      <div
        className={cn("absolute z-20 tabular-nums", flashNexus && "animate-pulse")}
        style={{ right: "6.5%", bottom: "18%" }}
      >
        <span className="text-[10px] font-bold text-red-100 drop-shadow-[0_1px_4px_rgba(0,0,0,1)]">
          ♥ {displayEnemyNexus}/{nexusMax}
        </span>
      </div>
    </div>
  );
}
