import { useTranslation } from "react-i18next";
import { cn } from "../../utils/cn";
import { GoldIcon } from "./GoldIcon";

type ShopEntry = {
  uid: string;
  def: { price: number; type: string };
};

type ShopBackCardProps = {
  entry: ShopEntry;
  canAfford: boolean;
  canBuy: boolean;
  onBuy: (sourceEl: HTMLButtonElement) => void;
  compact?: boolean;
};

export function ShopBackCard({ entry, canAfford, canBuy, onBuy }: ShopBackCardProps) {
  const { t } = useTranslation();
  const enabled = canAfford && canBuy;

  return (
    <button
      type="button"
      data-shop-entry={entry.uid}
      onClick={(e) => onBuy(e.currentTarget)}
      disabled={!enabled}
      title={t("shop.buyTitle", { price: entry.def.price })}
      className={cn(
        "group flex h-full w-full min-h-0 items-center justify-center border-0 bg-transparent p-0 transition-all duration-300",
        enabled
          ? "cursor-pointer hover:scale-[1.03] hover:drop-shadow-[0_0_12px_rgba(251,191,36,0.45)]"
          : "cursor-not-allowed opacity-55 grayscale-[0.25]"
      )}
    >
      <span className="shop-card-face">
        <img
          src="/images/mystery_card.png"
          alt={t("shop.mysteryAlt")}
          draggable={false}
          className="block h-full w-auto max-w-full select-none object-contain drop-shadow-[0_4px_12px_rgba(0,0,0,0.55)]"
        />

        <span
          className={cn(
            "gold-amount-badge shop-price-badge",
            canAfford ? "shop-price-badge--affordable" : "shop-price-badge--locked"
          )}
        >
          <span className="gold-amount-badge__value tabular-nums">{entry.def.price}</span>
          <GoldIcon size="sm" className="gold-amount-badge__icon" />
        </span>
      </span>
    </button>
  );
}
