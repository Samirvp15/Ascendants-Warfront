import { HeaderBadge, HeaderButton } from "./HeaderButton";

type GameHeaderProps = {
  round: number;
  mainDeckRemaining: number;
  displayGold: number;
  flashGold: number | null;
  onNewMatch: () => void;
  onReset: () => void;
};

export function GameHeader({
  round,
  mainDeckRemaining,
  displayGold,
  flashGold,
  onNewMatch,
  onReset,
}: GameHeaderProps) {
  return (
    <header className="relative z-30 mb-4 grid w-full grid-cols-1 items-center gap-4 md:grid-cols-[1fr_auto_1fr] md:gap-0">
      {/* Logo section — centered (true center on desktop via middle column) */}
      <div className="flex flex-col items-center md:col-start-2 md:row-start-1">
        <img
          src="/images/game_logo.png"
          alt="Ascendants Warfront"
          className="h-36 w-auto max-w-[min(96vw,780px)] object-contain drop-shadow-[0_10px_48px_rgba(0,0,0,0.85)] sm:h-36 md:h-40 lg:h-44 xl:h-46"
        />
        <p
          className="mt-2 px-1 text-center text-xs text-slate-400/95 drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)] sm:text-sm"
          style={{ fontFamily: "Cinzel, Georgia, serif" }}
        >
          Round {round} · Main deck: {mainDeckRemaining} cards left
        </p>
      </div>

      {/* Header buttons — right column, bottom-aligned */}
      <div className="flex flex-wrap items-center justify-center gap-2.5 md:col-start-3 md:row-start-1  md:pb-1">
        <HeaderBadge
          variant="gold"
          className={flashGold !== null ? "header-btn-gold-flash transition-transform duration-500" : ""}
        >
          <span className={flashGold !== null ? "animate-bounce" : ""}>💰</span>
          <span className="ml-1 tabular-nums">{displayGold}</span>
          {flashGold !== null && (
            <span className="ml-1 animate-pulse text-amber-200">+{flashGold}</span>
          )}
        </HeaderBadge>
        <HeaderButton onClick={onNewMatch}>New Match</HeaderButton>
        <HeaderButton onClick={onReset}>Reset All</HeaderButton>
      </div>
    </header>
  );
}
