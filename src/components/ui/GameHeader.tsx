import { HeaderBadge, HeaderButton } from "./HeaderButton";
import { HowItWorksPanel } from "./HowItWorksPanel";

type GameHeaderProps = {
  round: number;
  mainDeckRemaining: number;
  displayGold: number;
  flashGold: number | null;
  maxDeck: number;
  goldWin: number;
  goldTie: number;
  goldLose: number;
  freeRescue: number;
  onNewMatch: () => void;
  onReset: () => void;
};

export function GameHeader({
  round,
  mainDeckRemaining,
  displayGold,
  flashGold,
  maxDeck,
  goldWin,
  goldTie,
  goldLose,
  freeRescue,
  onNewMatch,
  onReset,
}: GameHeaderProps) {
  return (
    <header className="absolute-frame-anchor z-30 h-[var(--header-h)] w-full shrink-0 overflow-visible">
      <HowItWorksPanel
        className="left-0 top-[-8%] z-20"
        maxDeck={maxDeck}
        goldWin={goldWin}
        goldTie={goldTie}
        goldLose={goldLose}
        freeRescue={freeRescue}
      />

      {/* Logo — absolute, larger, may overlap header bounds & main area */}
      <div className="pointer-events-none absolute left-1/2 top-[-12%] z-30 flex -translate-x-1/2 flex-col items-center">
        <img
          src="/images/game_logo.png"
          alt="Ascendants Warfront"
          className="h-[var(--logo-h)] w-auto max-w-[min(54vw,720px)] object-contain drop-shadow-[0_10px_48px_rgba(0,0,0,0.85)]"
        />
        <p
          className="mt-[0.3em] max-w-[90vw] truncate px-1 text-center text-[0.68em] text-slate-400/95 drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]"
          style={{ fontFamily: "Cinzel, Georgia, serif" }}
        >
          Round {round} · Main deck: {mainDeckRemaining} cards left
        </p>
      </div>

      <div className="absolute bottom-0 right-0 z-40 flex flex-wrap items-center justify-end gap-[0.35em]">
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
