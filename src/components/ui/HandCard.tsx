import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation();
  const isUnit = card.type === "unit";
  const isHealNexus = card.effect === "heal_nexus";
  const isDamageNexus = card.effect === "damage_nexus";
  const autoCastable = isHealNexus || isDamageNexus;
  const centeredName = cardUsesCenteredName(card.id);
  const customArt = cardHasCustomArt(card.id);
  const artSrc = getCardImageSrc(card.id);
  const displayName = t(`cards.${card.id}`);

  return (
    <button
      type="button"
      data-hand-card={card.uid}
      onClick={onClick}
      disabled={!clickable}
      title={
        healWouldWaste
          ? t("hand.tooltipFullNexus")
          : autoCastable
            ? t("hand.tooltipTapCast")
            : t("hand.tooltipTapSelect")
      }
      className={cn(
        "card-frame group relative shrink-0 flex-col overflow-hidden transition-all duration-300",
        compact ? "hand-card-compact flex" : "flex h-[108px] w-[76px]",
        compact && selected && "-translate-y-1 scale-105 border-amber-400 shadow-lg shadow-amber-400/40",
        !compact && selected && "-translate-y-2 scale-105 border-amber-400 shadow-lg shadow-amber-400/40",
        clickable ? "cursor-pointer hover:-translate-y-1 hover:scale-[1.02]" : "cursor-not-allowed opacity-50",
        newlyBought && "hand-card--newly-bought"
      )}
    >
      <div className="absolute inset-0">
        <img
          src={artSrc}
          alt={displayName}
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

      {centeredName && <CardArtName name={displayName} />}

      {compact ? (
        <>
          <CardStatIcon
            kind="mana"
            value={card.cost}
            size="xs"
            className="hand-card-stat hand-card-stat--mana"
          />

          {isUnit && (
            <>
              <CardStatIcon
                kind="attack"
                value={card.atk ?? 0}
                size="xs"
                className="hand-card-stat hand-card-stat--attack"
              />
              <CardStatIcon kind="hp" value={card.hp ?? 0} size="xs" className="hand-card-stat hand-card-stat--hp" />
            </>
          )}

          {!centeredName && (
            <div className="hand-card-footer absolute z-10">
              <CardNameBadge name={displayName} />
            </div>
          )}
        </>
      ) : (
        <>
          <CardStatIcon kind="mana" value={card.cost} size="sm" className="absolute left-0.5 top-0.5 z-10" />

          <div className="relative z-10 mt-auto p-1.5">
            {!centeredName && <CardNameBadge name={displayName} className="mb-0.5" />}
            {isUnit && (
              <div className="flex items-end justify-between gap-0.5">
                <CardStatIcon kind="attack" value={card.atk ?? 0} size="sm" />
                <CardStatIcon kind="hp" value={card.hp ?? 0} size="sm" />
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
          {t("cardTypes.tap")}
        </div>
      )}
    </button>
  );
}
