import { cn } from "../../utils/cn";

type ShopEntry = {
  uid: string;
  def: { price: number; type: string };
};

type ShopBackCardProps = {
  entry: ShopEntry;
  canAfford: boolean;
  canBuy: boolean;
  onBuy: () => void;
  compact?: boolean;
};

export function ShopBackCard({ entry, canAfford, canBuy, onBuy, compact = false }: ShopBackCardProps) {
  return (
    <button
      type="button"
      onClick={onBuy}
      disabled={!canAfford || !canBuy}
      className={cn(
        "group relative flex w-full min-h-0 flex-1 flex-col rounded-lg border-2 p-1 text-left transition-all duration-300",
        compact ? "min-h-[52px]" : "h-32",
        canAfford && canBuy
          ? "cursor-pointer border-amber-600/60 hover:-translate-y-0.5 hover:border-amber-400"
          : "cursor-not-allowed border-slate-700 opacity-60"
      )}
    >
      <div
        className="relative flex h-full w-full flex-col items-center justify-center overflow-hidden rounded-md"
        style={{
          background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 30%, #1e1b4b 60%, #0f172a 100%)",
        }}
      >
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 6px, rgba(251,191,36,0.1) 6px, rgba(251,191,36,0.1) 7px), repeating-linear-gradient(90deg, transparent, transparent 6px, rgba(251,191,36,0.1) 6px, rgba(251,191,36,0.1) 7px)`,
          }}
        />
        <div className="absolute inset-1 rounded border border-amber-500/30" />
        <div className="absolute inset-2 rounded border border-amber-500/15" />
        <div className="relative flex h-8 w-8 items-center justify-center rounded-full border-2 border-amber-400/50 bg-gradient-to-br from-amber-600/30 to-rose-600/30 shadow-lg shadow-amber-500/20">
          <span className={compact ? "text-sm" : "text-xl"}>🎴</span>
        </div>
        <div className={cn("relative font-bold uppercase tracking-[0.25em] text-amber-400/60", compact ? "mt-1 text-[7px]" : "mt-2 text-[9px]")}>
          Mystery
        </div>
      </div>

      <div
        className={cn(
          "absolute -right-1 -top-1 flex min-w-[2rem] items-center justify-center rounded-full border-2 border-amber-300 px-1.5 py-0.5 text-[11px] font-black shadow-lg",
          canAfford ? "bg-amber-400 text-slate-900" : "bg-slate-700 text-slate-400"
        )}
      >
        {entry.def.price}💰
      </div>
    </button>
  );
}
