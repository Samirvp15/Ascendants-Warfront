import { HeaderBadge, HeaderButton } from "./HeaderButton";
import { HowItWorksPanel } from "./HowItWorksPanel";
import { UI_ASPECT } from "../../utils/layoutTokens";

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
    <header className="relative z-30 h-[var(--header-h)] w-full shrink-0">
      <HowItWorksPanel
        className="absolute left-0 top-0 h-full"
        maxDeck={maxDeck}
        goldWin={goldWin}
        goldTie={goldTie}
        goldLose={goldLose}
        freeRescue={freeRescue}
      />

      <div className="pointer-events-none absolute left-1/2 top-1/2 z-10 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center">
        <img
          src="/images/game_logo.png"
          alt="Ascendants Warfront"
          className="h-[calc(var(--header-h)*0.72)] w-auto object-contain drop-shadow-[0_10px_48px_rgba(0,0,0,0.85)]"
          style={{ maxWidth: `calc(var(--header-h) * ${UI_ASPECT.gameLogo})` }}
        />
        <p
          className="mt-0.5 px-1 text-center text-[10px] text-slate-400/95 drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]"
          style={{ fontFamily: "Cinzel, Georgia, serif" }}
        >
          Round {round} · Main deck: {mainDeckRemaining} cards left
        </p>
      </div>

      <div className="absolute bottom-1 right-0 flex flex-wrap items-center justify-end gap-1.5">
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
