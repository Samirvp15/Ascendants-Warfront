import type { CSSProperties } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "../../utils/cn";

export const MYSTERY_CARD_SRC = "/images/mystery_card.png";

type MysteryDeckCardProps = {
  newlyBought?: boolean;
  className?: string;
  style?: CSSProperties;
};

export function MysteryDeckCard({ newlyBought, className, style }: MysteryDeckCardProps) {
  const { t } = useTranslation();

  return (
    <div
      className={cn(
        "enemy-mystery-card shrink-0",
        newlyBought && "hand-card--newly-bought",
        className
      )}
      style={style}
    >
      <img
        src={MYSTERY_CARD_SRC}
        alt={t("shop.mysteryAlt")}
        draggable={false}
        className="enemy-mystery-card__img"
      />
    </div>
  );
}
