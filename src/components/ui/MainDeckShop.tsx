import { AbsoluteFrame } from "../layout/AbsoluteFrame";
import { ShopBackCard } from "./ShopBackCard";

type MainDeckShopProps<T extends { uid: string; def: { price: number; type: string } }> = {
  shopEntries: T[];
  mainDeckRemaining: number;
  gold: number;
  deckFull: boolean;
  refreshes: number;
  winner: boolean;
  onRefresh: () => void;
  onBuy: (entry: T) => void;
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
  return (
    <>
      <AbsoluteFrame
        image="/images/main_deck.png"
        className={`inset-0 h-full w-full ${className}`}
        contentClassName="main-deck-content"
      >
        <header className="main-deck-header">
          <h3 className="font-display text-[0.85em] font-bold tracking-wider text-amber-300 drop-shadow-md">
            MAIN DECK
          </h3>
          <p className="font-display mt-[0.25em] text-[0.72em] text-amber-100 drop-shadow-md">
            {mainDeckRemaining} cards in pool
          </p>
        </header>

        <div className="main-deck-grid">
          {shopEntries.map((entry) => (
            <ShopBackCard
              key={entry.uid}
              entry={entry}
              canAfford={gold >= entry.def.price}
              canBuy={!deckFull}
              onBuy={() => onBuy(entry)}
              compact
            />
          ))}
          {shopEntries.length === 0 && (
            <div className="main-deck-grid__empty col-span-2 row-span-2 flex items-center justify-center text-center text-[0.75em] text-slate-400">
              Main deck exhausted!
            </div>
          )}
        </div>
      </AbsoluteFrame>

      <div className="main-deck-refresh">
        <button
          type="button"
          onClick={onRefresh}
          disabled={refreshes <= 0 || winner}
          title={`Refresh shop (${refreshes} left)`}
          aria-label={`Refresh shop, ${refreshes} remaining`}
          className="shop-refresh-btn"
        >
          <span className="shop-refresh-btn__count">{refreshes}</span>
        </button>
      </div>
    </>
  );
}
