import { useTranslation } from "react-i18next";
import { AbsoluteFrame } from "../layout/AbsoluteFrame";
import { ShopBackCard } from "./ShopBackCard";

type MainDeckShopProps<T extends { uid: string; def: { price: number; type: string } }> = {
  shopEntries: (T | null)[];
  mainDeckRemaining: number;
  gold: number;
  deckFull: boolean;
  refreshes: number;
  winner: boolean;
  onRefresh: () => void;
  onBuy: (entry: T, sourceEl: HTMLButtonElement) => void;
  className?: string;
};

export function MainDeckShop<T extends { uid: string; def: { price: number; type: string } }>({
  shopEntries,
  mainDeckRemaining,
  gold,
  deckFull,
  refreshes,
  winner,
  onRefresh,
  onBuy,
  className = "",
}: MainDeckShopProps<T>) {
  const { t } = useTranslation();
  const allEmpty = shopEntries.every((entry) => entry === null);

  return (
    <>
      <AbsoluteFrame
        image="/images/main_deck.png"
        className={`inset-0 h-full w-full ${className}`}
        contentClassName="main-deck-content"
      >
        <header className="main-deck-header">
          <h3 className="font-display text-[0.85em] font-bold tracking-wider text-amber-300 drop-shadow-md">
            {t("shop.title")}
          </h3>
          <p className="font-display mt-[0.25em] text-[0.72em] text-amber-100 drop-shadow-md">
            {t("shop.cardsInPool", { count: mainDeckRemaining })}
          </p>
        </header>

        <div className="main-deck-grid">
          {allEmpty ? (
            <div className="main-deck-grid__empty col-span-2 row-span-2 flex items-center justify-center text-center text-[0.75em] text-slate-400">
              {t("shop.exhausted")}
            </div>
          ) : (
            shopEntries.map((entry, index) =>
              entry ? (
                <ShopBackCard
                  key={entry.uid}
                  entry={entry}
                  canAfford={gold >= entry.def.price}
                  canBuy={!deckFull}
                  onBuy={(sourceEl) => onBuy(entry, sourceEl)}
                  compact
                />
              ) : (
                <div
                  key={`shop-empty-${index}`}
                  className="main-deck-grid__empty-slot"
                  aria-hidden="true"
                />
              )
            )
          )}
        </div>
      </AbsoluteFrame>

      <div className="main-deck-refresh">
        <button
          type="button"
          onClick={onRefresh}
          disabled={refreshes <= 0 || winner}
          title={t("shop.refreshTitle", { count: refreshes })}
          aria-label={t("shop.refreshAria", { count: refreshes })}
          className="shop-refresh-btn"
        >
          <span className="shop-refresh-btn__bg" aria-hidden="true" />
          <span className="shop-refresh-btn__count">{refreshes}</span>
        </button>
      </div>
    </>
  );
}
