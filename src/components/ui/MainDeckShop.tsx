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
    <AbsoluteFrame
      image="/images/main_deck.png"
      className={`inset-0 z-10 ${className}`}
      bgStyle={{ left: "-4%", right: 0, top: "-2%", bottom: 0 }}
    >
      <div className="absolute text-center" style={{ left: "8%", right: "8%", top: "3%" }}>
        <h3 className="font-display text-[0.85em] font-bold tracking-wider text-amber-100 drop-shadow-md">
          Main Deck
        </h3>
        <p className="mt-[0.25em] text-[0.72em] text-slate-300 drop-shadow-md">
          {mainDeckRemaining} cards in pool
        </p>
      </div>

      <div
        className="absolute flex flex-col gap-[0.35em] overflow-hidden"
        style={{ left: "10%", right: "10%", top: "12%", bottom: "16%" }}
      >
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
          <div className="flex flex-1 items-center justify-center text-center text-[0.75em] text-slate-400">
            Main deck exhausted!
          </div>
        )}
      </div>

      <div className="absolute" style={{ left: "10%", right: "10%", bottom: "4%" }}>
        <button
          type="button"
          onClick={onRefresh}
          disabled={refreshes <= 0 || winner}
          className="stone-btn w-full py-[0.45em] text-[0.72em] text-indigo-200 disabled:opacity-40"
        >
          ↻ Refresh ({refreshes})
        </button>
      </div>
    </AbsoluteFrame>
  );
}
