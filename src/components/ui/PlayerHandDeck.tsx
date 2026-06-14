import type { ReactNode } from "react";
import { cn } from "../../utils/cn";
import { AbsoluteFrame } from "../layout/AbsoluteFrame";
import { FrameStatDisplay } from "./FrameStatDisplay";
import { StrikeButton } from "./StrikeButton";

type PlayerHandDeckProps = {
  playerMana: number;
  playerMaxMana: number;
  displayPlayerNexus: number;
  nexusMax: number;
  flashMana: boolean;
  flashNexus: boolean;
  deckCount: number;
  deckEmpty: boolean;
  selectedCardName: string | null;
  isMoving: boolean;
  strikeDisabled: boolean;
  onStrike: () => void;
  className?: string;
  embedded?: boolean;
  children: ReactNode;
};

export function PlayerHandDeck({
  playerMana,
  playerMaxMana,
  displayPlayerNexus,
  nexusMax,
  flashMana,
  flashNexus,
  deckCount,
  deckEmpty,
  selectedCardName,
  isMoving,
  strikeDisabled,
  onStrike,
  className = "",
  embedded = false,
  children,
}: PlayerHandDeckProps) {
  const showStatus = selectedCardName || isMoving || deckEmpty || deckCount <= 2;

  return (
    <>
      <AbsoluteFrame
        image="/images/hand_deck_player.png"
        className={cn(
          embedded
            ? "inset-0 h-full w-full"
            : "bottom-0 left-1/2 w-[var(--hand-w)] -translate-x-1/2",
          className
        )}
        bgStyle={embedded ? undefined : { top: "-8%", bottom: "-3%", height: "auto" }}
        contentClassName="hand-deck-content"
      >
        <FrameStatDisplay
          kind="mana"
          value={playerMana}
          max={playerMaxMana}
          flash={flashMana}
          className="frame-stat--player-mana"
        />

        <FrameStatDisplay
          kind="nexus"
          value={displayPlayerNexus}
          max={nexusMax}
          flash={flashNexus}
          className="frame-stat--player-nexus"
        />

        {showStatus && (
          <div
            className="absolute flex -translate-x-1/2 flex-wrap items-center justify-center gap-[0.2em] px-[2%]"
            style={{ left: "50%", top: "6.5%" }}
          >
            {deckEmpty && (
              <span className="text-[0.56em] font-semibold text-rose-200 drop-shadow-md">⚠ Deck empty</span>
            )}
            {!deckEmpty && deckCount <= 2 && (
              <span className="text-[0.56em] font-semibold text-amber-200 drop-shadow-md">{deckCount} left</span>
            )}
            {selectedCardName && (
              <span className="text-[0.56em] font-bold text-amber-100 drop-shadow-md animate-pulse">
                {selectedCardName} → lane
              </span>
            )}
            {isMoving && !selectedCardName && (
              <span className="text-[0.56em] font-bold text-sky-100 drop-shadow-md animate-pulse">Moving → lane</span>
            )}
          </div>
        )}

        <div
          className="absolute flex items-end justify-center gap-[0.28em] overflow-x-auto overflow-y-hidden [scrollbar-width:thin]"
          style={{ left: "8%", right: "8%", top: "24%", bottom: "8%" }}
        >
          {children}
        </div>
      </AbsoluteFrame>

      <div className="hand-strike-btn">
        <StrikeButton disabled={strikeDisabled} onClick={onStrike} />
      </div>
    </>
  );
}
