import { cn } from "../../utils/cn";

type HandCardData = {
  uid: string;
  id: string;
  name: string;
  type: "unit" | "spell";
  cost: number;
  atk?: number;
  hp?: number;
  effect?: "damage" | "heal" | "damage_nexus" | "heal_nexus";
  value?: number;
};

type HandCardProps = {
  card: HandCardData;
  selected: boolean;
  clickable: boolean;
  newlyBought: boolean;
  healWouldWaste: boolean;
  compact?: boolean;
  onClick: () => void;
};

export function HandCard({
  card,
  selected,
  clickable,
  newlyBought,
  healWouldWaste,
  compact = false,
  onClick,
}: HandCardProps) {
  const isUnit = card.type === "unit";
  const isHealNexus = card.effect === "heal_nexus";
  const isDamageNexus = card.effect === "damage_nexus";
  const autoCastable = isHealNexus || isDamageNexus;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!clickable}
      title={
        healWouldWaste
          ? "Nexus already at full HP"
          : autoCastable
            ? "Tap to cast"
            : "Tap to select, then click a lane"
      }
      className={cn(
        "card-frame group relative shrink-0 flex-col overflow-hidden transition-all duration-300",
        compact ? "flex h-[100px] w-[70px]" : "flex h-[108px] w-[76px]",
        selected && (compact ? "-translate-y-1 scale-105 border-amber-400 shadow-lg shadow-amber-400/40" : "-translate-y-2 scale-105 border-amber-400 shadow-lg shadow-amber-400/40"),
        clickable ? "cursor-pointer hover:-translate-y-1 hover:scale-[1.02]" : "cursor-not-allowed opacity-50",
        newlyBought && "animate-bounce"
      )}
    >
      <div className="absolute inset-0">
        <img
          src={`/images/card_${card.id}.jpg`}
          alt={card.name}
          className="h-full w-full object-cover opacity-75 transition-opacity group-hover:opacity-90"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = "none";
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/55 to-transparent" />
      </div>

      <div className={cn("absolute left-1 top-1 z-10 flex items-center justify-center rounded-full border border-blue-400/60 bg-blue-700/95 font-black text-white shadow", compact ? "h-4 w-4 text-[8px]" : "h-5 w-5 text-[10px]")}>
        {card.cost}
      </div>

      <div className={cn("absolute right-1 top-1 z-10 rounded border border-white/20 bg-black/65 px-1 py-0.5 font-bold uppercase tracking-wider text-white/90", compact ? "text-[6px]" : "text-[7px]")}>
        {isDamageNexus ? "💥nex" : isHealNexus ? "♥nex" : isUnit ? "unit" : "spell"}
      </div>

      <div className={cn("relative z-10 mt-auto", compact ? "p-1" : "p-1.5")}>
        <div className={cn("card-nameplate mb-0.5 px-1 py-0.5 text-center", compact && "mb-0")}>
          <div className={cn("font-display truncate font-bold text-amber-50", compact ? "text-[7px]" : "text-[9px]")}>{card.name}</div>
        </div>
        {isUnit ? (
          <div className="flex justify-between gap-0.5">
            <span className={cn("rounded border border-amber-600/40 bg-amber-500/95 font-extrabold text-slate-900", compact ? "px-0.5 py-0 text-[7px]" : "px-1 py-0.5 text-[8px]")}>
              ⚔{card.atk}
            </span>
            <span className={cn("rounded border border-emerald-700/40 bg-emerald-500/95 font-extrabold text-slate-900", compact ? "px-0.5 py-0 text-[7px]" : "px-1 py-0.5 text-[8px]")}>
              ♥{card.hp}
            </span>
          </div>
        ) : (
          <div className={cn("rounded bg-black/55 px-1 py-0.5 text-center font-semibold text-white/90", compact ? "text-[7px]" : "text-[8px]")}>
            {isDamageNexus
              ? `💥-${card.value}`
              : isHealNexus
                ? `♥+${card.value}`
                : card.effect === "damage"
                  ? `⚔${card.value}`
                  : `💚${card.value}`}
          </div>
        )}
      </div>

      {selected && (
        <div className="pointer-events-none absolute inset-0 z-20 rounded-md ring-2 ring-amber-400 ring-offset-1 ring-offset-slate-900" />
      )}

      {autoCastable && clickable && (
        <div className={cn("absolute left-1/2 z-20 -translate-x-1/2 rounded-full bg-amber-400 font-black uppercase tracking-wider text-slate-900 shadow", compact ? "-bottom-1.5 px-1.5 py-0 text-[6px]" : "-bottom-2 px-2 py-0.5 text-[7px]")}>
          Tap
        </div>
      )}
    </button>
  );
}
