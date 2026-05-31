import { cn } from "../../utils/cn";
import { cardHasCustomArt, cardUsesCenteredName, getCardImageSrc } from "../../utils/cardAssets";
import { CardArtName } from "./CardArtName";
import { CardNameBadge } from "./CardNameBadge";
import { CardStatIcon } from "./CardStatIcon";

type UnitCardProps = {
  cardId: string;
  name: string;
  atk: number;
  hp: number;
  side: "player" | "enemy";
  showDmg?: boolean;
  dmg?: number | null;
  dying?: boolean;
  selected?: boolean;
  moving?: boolean;
  onClick?: (ev: React.MouseEvent) => void;
  className?: string;
  lane?: boolean;
};

export function UnitCard({
  cardId,
  name,
  atk,
  hp,
  side,
  showDmg,
  dmg,
  dying,
  selected,
  moving,
  onClick,
  className,
  lane = false,
}: UnitCardProps) {
  const isEnemy = side === "enemy";
  const centeredName = cardUsesCenteredName(cardId);
  const customArt = cardHasCustomArt(cardId);
  const artSrc = getCardImageSrc(cardId);

  return (
    <div
      onClick={onClick}
      className={cn(
        "card-frame relative flex flex-col overflow-hidden transition-all duration-700",
        lane
          ? "lane-unit-card h-full min-h-0 w-full min-w-0 max-h-full max-w-full"
          : "h-full max-h-[130px] w-full max-w-[155px]",
        isEnemy ? "border-rose-700/70" : "cursor-pointer border-sky-600/70",
        selected && "scale-105 ring-2 ring-amber-400 shadow-lg shadow-amber-400/30",
        showDmg && dmg != null && "ring-2 ring-rose-400/60",
        dying && "scale-95 opacity-30 blur-[1px]",
        className
      )}
    >
      <div className="absolute inset-0 z-0">
        <img
          src={artSrc}
          alt={name}
          className={cn(
            "h-full w-full",
            customArt ? "object-fill opacity-100" : "object-cover opacity-80"
          )}
          onError={(ev) => {
            (ev.target as HTMLImageElement).style.display = "none";
          }}
        />
        {!customArt && (
          <div
            className={cn(
              "absolute inset-0 bg-gradient-to-t via-transparent to-transparent",
              isEnemy ? "from-rose-950/95 via-rose-900/40" : "from-sky-950/95 via-sky-900/40"
            )}
          />
        )}
      </div>

      {centeredName && <CardArtName name={name} />}

      {lane ? (
        <>
          <CardStatIcon
            kind="attack"
            value={atk}
            size="xs"
            className="hand-card-stat hand-card-stat--attack"
          />
          <CardStatIcon kind="hp" value={hp} size="xs" className="hand-card-stat hand-card-stat--hp" />

          {!centeredName && (
            <div className="hand-card-footer absolute z-10">
              <CardNameBadge name={name} />
            </div>
          )}
        </>
      ) : (
        <>
          {!centeredName && (
            <div className="relative z-10 flex justify-center p-2">
              <CardNameBadge name={name} />
            </div>
          )}

          <div className="relative z-10 mt-auto flex items-end justify-between p-2">
            <CardStatIcon kind="attack" value={atk} size="sm" />
            <CardStatIcon kind="hp" value={hp} size="sm" />
          </div>
        </>
      )}

      {moving && (
        <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
          <span className="font-display rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-black text-slate-900 shadow-lg animate-pulse">
            MOVING
          </span>
        </div>
      )}

      {showDmg && dmg != null && !moving && (
        <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
          <span className="font-display rounded-full bg-rose-600/95 px-3 py-1 text-base font-bold text-white shadow-lg animate-bounce">
            -{dmg}
          </span>
        </div>
      )}
    </div>
  );
}

type EmptySlotProps = {
  label: string;
  active?: boolean;
  lane?: boolean;
  className?: string;
};

export function EmptySlot({ label, active, lane = false, className }: EmptySlotProps) {
  return (
    <div
      className={cn(
        "font-display flex items-center justify-center rounded-md border border-dashed",
        lane ? "lane-empty-slot" : "h-full max-h-[76px] w-full max-w-[155px] text-[9px]",
        active ? "border-amber-400/70 bg-amber-400/5 text-amber-300" : "border-slate-600/50 text-slate-600",
        className
      )}
    >
      {label}
    </div>
  );
}
