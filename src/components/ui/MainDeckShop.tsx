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
    <div className={`relative h-full w-full min-h-0 ${className}`}>
      <img
        src="/images/main_deck.png"
        alt=""
        aria-hidden
        className="pointer-events-none absolute inset-0 h-full w-full select-none object-fill"
        draggable={false}
      />

      <div
        className="absolute z-10 text-center"
        style={{ left: "8%", right: "8%", top: "3%" }}
      >
        <h3 className="font-display text-xs font-bold tracking-wider text-amber-100 drop-shadow-md">
          Main Deck
        </h3>
        <p className="mt-0.5 text-[9px] text-slate-300 drop-shadow-md">{mainDeckRemaining} cards in pool</p>
      </div>

      <div
        className="absolute z-10 flex flex-col gap-1.5 overflow-hidden"
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
          <div className="flex flex-1 items-center justify-center text-center text-[10px] text-slate-400">
            Main deck exhausted!
          </div>
        )}
      </div>

      <div className="absolute z-10" style={{ left: "10%", right: "10%", bottom: "4%" }}>
        <button
          type="button"
          onClick={onRefresh}
          disabled={refreshes <= 0 || winner}
          className="stone-btn w-full py-1.5 text-[9px] text-indigo-200 disabled:opacity-40"
        >
          ↻ Refresh ({refreshes})
        </button>
      </div>
    </div>
  );
}
