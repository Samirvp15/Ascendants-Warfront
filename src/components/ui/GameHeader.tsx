import { HeaderBadge, HeaderButton } from "./HeaderButton";

type GameHeaderProps = {
  round: number;
  mainDeckRemaining: number;
  displayGold: number;
  flashGold: number | null;
  phase: "playerTurn" | "enemyTurn" | "combat";
  onNewMatch: () => void;
  onReset: () => void;
};

export function GameHeader({
  round,
  mainDeckRemaining,
  displayGold,
  flashGold,
  phase,
  onNewMatch,
  onReset,
}: GameHeaderProps) {
  const phaseLabel =
    phase === "playerTurn" ? "Your Turn" : phase === "enemyTurn" ? "Enemy Turn" : "Combat";

  const phaseVariant =
    phase === "playerTurn"
      ? "phase-player"
      : phase === "enemyTurn"
        ? "phase-enemy"
        : "phase-combat";

  const controls = (
    <>
      <HeaderBadge
        variant="gold"
        className={flashGold !== null ? "header-btn-gold-flash transition-transform duration-500" : ""}
      >
        <span className={flashGold !== null ? "animate-bounce" : ""}>💰</span>
        <span className="ml-1 tabular-nums">{displayGold}</span>
        {flashGold !== null && (
          <span className="ml-1 animate-pulse text-emerald-200">+{flashGold}</span>
        )}
      </HeaderBadge>
      <HeaderBadge variant={phaseVariant}>{phaseLabel}</HeaderBadge>
      <HeaderButton onClick={onNewMatch}>New Match</HeaderButton>
      <HeaderButton variant="danger" onClick={onReset}>
        Reset All
      </HeaderButton>
    </>
  );

  return (
    <header className="relative mb-5 px-1 pt-1 lg:min-h-[5.5rem]">
      <div className="pointer-events-none flex flex-col items-center pt-1">
        <img
          src="/images/game_logo.png"
          alt="Ascendants Warfront"
          className="h-14 w-auto max-w-[min(100%,320px)] object-contain drop-shadow-[0_4px_24px_rgba(0,0,0,0.65)] md:h-16"
        />
        <p
          className="mt-2 text-[11px] text-slate-400/90 drop-shadow-md"
          style={{ fontFamily: "Cinzel, Georgia, serif" }}
        >
          Round {round} · Main deck: {mainDeckRemaining} cards left
        </p>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-center gap-2 lg:absolute lg:right-0 lg:top-0 lg:mt-0 lg:justify-end">
        {controls}
      </div>
    </header>
  );
}
