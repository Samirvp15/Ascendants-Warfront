import { cn } from "../../utils/cn";
import { cardHasCustomArt, cardUsesCenteredName, getCardImageSrc } from "../../utils/cardAssets";
import { CardArtName } from "./CardArtName";
import { CardNameBadge } from "./CardNameBadge";
import { CardStatIcon } from "./CardStatIcon";

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
  const spellStatKind =
    isDamageNexus || card.effect === "damage" ? ("attack" as const) : ("hp" as const);
  const centeredName = cardUsesCenteredName(card.id);
  const customArt = cardHasCustomArt(card.id);
  const artSrc = getCardImageSrc(card.id);

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
        compact ? "hand-card-compact flex" : "flex h-[108px] w-[76px]",
        compact && selected && "-translate-y-1 scale-105 border-amber-400 shadow-lg shadow-amber-400/40",
        !compact && selected && "-translate-y-2 scale-105 border-amber-400 shadow-lg shadow-amber-400/40",
        clickable ? "cursor-pointer hover:-translate-y-1 hover:scale-[1.02]" : "cursor-not-allowed opacity-50",
        newlyBought && "animate-bounce"
      )}
    >
      <div className="absolute inset-0">
        <img
          src={artSrc}
          alt={card.name}
          className={cn(
            "h-full w-full transition-opacity",
            customArt ? "object-fill opacity-100" : "object-cover opacity-75 group-hover:opacity-90"
          )}
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = "none";
          }}
        />
        {!customArt && (
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/55 to-transparent" />
        )}
      </div>

      {centeredName && <CardArtName name={card.name} />}

      {compact ? (
        <>
          <CardStatIcon
            kind="mana"
            value={card.cost}
            size="xs"
            className="hand-card-stat hand-card-stat--mana"
          />

          {isUnit ? (
            <>
              <CardStatIcon
                kind="attack"
                value={card.atk ?? 0}
                size="xs"
                className="hand-card-stat hand-card-stat--attack"
              />
              <CardStatIcon kind="hp" value={card.hp ?? 0} size="xs" className="hand-card-stat hand-card-stat--hp" />
            </>
          ) : (
            <CardStatIcon
              kind={spellStatKind}
              value={card.value ?? 0}
              size="xs"
              className={cn(
                "hand-card-stat",
                spellStatKind === "attack" ? "hand-card-stat--attack" : "hand-card-stat--hp"
              )}
            />
          )}

          <div className="hand-card-type absolute right-[3%] top-[3%] z-10 rounded border border-white/20 bg-black/65 px-1 py-0.5 font-bold uppercase tracking-wider text-white/90">
            {isDamageNexus ? "💥nex" : isHealNexus ? "♥nex" : isUnit ? "unit" : "spell"}
          </div>

          {!centeredName && (
            <div className="hand-card-footer absolute z-10">
              <CardNameBadge name={card.name} />
            </div>
          )}
        </>
      ) : (
        <>
          <CardStatIcon kind="mana" value={card.cost} size="sm" className="absolute left-0.5 top-0.5 z-10" />

          <div className="hand-card-type absolute right-1 top-1 z-10 rounded border border-white/20 bg-black/65 px-1 py-0.5 text-[7px] font-bold uppercase tracking-wider text-white/90">
            {isDamageNexus ? "💥nex" : isHealNexus ? "♥nex" : isUnit ? "unit" : "spell"}
          </div>

          <div className="relative z-10 mt-auto p-1.5">
            {!centeredName && <CardNameBadge name={card.name} className="mb-0.5" />}
            {isUnit ? (
              <div className="flex items-end justify-between gap-0.5">
                <CardStatIcon kind="attack" value={card.atk ?? 0} size="sm" />
                <CardStatIcon kind="hp" value={card.hp ?? 0} size="sm" />
              </div>
            ) : (
              <div className="flex justify-center">
                <CardStatIcon kind={spellStatKind} value={card.value ?? 0} size="sm" />
              </div>
            )}
          </div>
        </>
      )}

      {selected && (
        <div className="pointer-events-none absolute inset-0 z-20 rounded-md ring-2 ring-amber-400 ring-offset-1 ring-offset-slate-900" />
      )}

      {autoCastable && clickable && (
        <div
          className={cn(
            "hand-card-tap absolute left-1/2 z-20 -translate-x-1/2 rounded-full bg-amber-400 font-black uppercase tracking-wider text-slate-900 shadow",
            compact ? "-bottom-1.5 px-1.5 py-0 text-[6px]" : "-bottom-2 px-2 py-0.5 text-[7px]"
          )}
        >
          Tap
        </div>
      )}
    </button>
  );
}
