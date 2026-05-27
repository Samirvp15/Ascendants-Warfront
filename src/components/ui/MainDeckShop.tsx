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
}: MainDeckShopProps<T>) {
  return (
    <div
      className="stone-panel relative flex flex-col overflow-hidden p-3"
      style={{
        backgroundImage: `linear-gradient(180deg, rgba(30,27,75,0.9), rgba(15,23,42,0.94)), url('/images/card_assassin.jpg')`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="mb-3 text-center">
        <h3 className="font-display text-sm font-bold tracking-wider text-amber-100">Main Deck</h3>
        <p className="mt-0.5 text-[10px] text-slate-400">{mainDeckRemaining} cards in pool</p>
      </div>

      <div className="flex flex-1 flex-col gap-2">
        {shopEntries.map((entry) => (
          <ShopBackCard
            key={entry.uid}
            entry={entry}
            canAfford={gold >= entry.def.price}
            canBuy={!deckFull}
            onBuy={() => onBuy(entry)}
          />
        ))}
        {shopEntries.length === 0 && (
          <div className="py-8 text-center text-xs text-slate-500">Main deck exhausted!</div>
        )}
      </div>

      <button
        type="button"
        onClick={onRefresh}
        disabled={refreshes <= 0 || winner}
        className="stone-btn mt-3 w-full py-2 text-[10px] text-indigo-200 disabled:opacity-40"
      >
        ↻ Refresh ({refreshes})
      </button>
    </div>
  );
}
