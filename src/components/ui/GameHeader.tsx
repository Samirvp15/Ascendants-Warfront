import { HeaderButton } from "./HeaderButton";
import { GoldIcon } from "./GoldIcon";
import { HowItWorksPanel } from "./HowItWorksPanel";
import { AbsoluteFrameAnchor } from "../layout/AbsoluteFrame";
import { cn } from "../../utils/cn";

type GameSidebarProps = {
  round: number;
  mainDeckRemaining: number;
  maxDeck: number;
  goldWin: number;
  goldTie: number;
  goldLose: number;
  freeRescue: number;
};

export function GameSidebar({
  round,
  mainDeckRemaining,
  maxDeck,
  goldWin,
  goldTie,
  goldLose,
  freeRescue,
}: GameSidebarProps) {
  return (
    <aside className="absolute-frame-anchor flex h-full min-h-0 flex-col items-center gap-[0.55em] overflow-x-visible overflow-y-auto">
      <div
        className="logo-block flex w-full shrink-0 items-center justify-center"
      >
        <img
          src="/images/game_logo.png"
          alt="Ascendants Warfront"
          className="h-[var(--logo-h)] w-auto max-w-[94%] object-contain drop-shadow-[0_8px_32px_rgba(0,0,0,0.85)]"
        />
      </div>
      <p
        className="w-full max-w-full px-0.5 text-center text-[0.62em] leading-snug text-slate-400/95 drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)]"
        style={{ fontFamily: "Cinzel, Georgia, serif" }}
      >
        Round {round} · Main deck: {mainDeckRemaining} cards left
      </p>

      <AbsoluteFrameAnchor
        className="mt-[0.15em] w-[var(--hiw-w)] shrink-0"
        style={{ height: "var(--hiw-h)" }}
      >
        <HowItWorksPanel
          className="inset-0"
          maxDeck={maxDeck}
          goldWin={goldWin}
          goldTie={goldTie}
          goldLose={goldLose}
          freeRescue={freeRescue}
        />
      </AbsoluteFrameAnchor>
    </aside>
  );
}

type GameControlsProps = {
  displayGold: number;
  flashGold: number | null;
  onNewMatch: () => void;
  onReset: () => void;
};

export function GameControls({ displayGold, flashGold, onNewMatch, onReset }: GameControlsProps) {
  return (
    <div className="absolute-frame-anchor z-40 flex shrink-0 flex-wrap items-center justify-end gap-[0.35em] p-2">
      <span
        className={cn(
          "gold-amount-badge header-gold-badge pointer-events-none transition-transform duration-500",
          flashGold !== null && "header-gold-badge-flash"
        )}
      >
        <span className="gold-amount-badge__value tabular-nums">{displayGold}</span>
        {flashGold !== null && (
          <span className="gold-amount-badge__bonus animate-pulse tabular-nums">+{flashGold}</span>
        )}
        <GoldIcon size="lg" className="gold-amount-badge__icon" />
      </span>
      <HeaderButton onClick={onNewMatch}>New Match</HeaderButton>
      <HeaderButton onClick={onReset}>Reset All</HeaderButton>
    </div>
  );
}
