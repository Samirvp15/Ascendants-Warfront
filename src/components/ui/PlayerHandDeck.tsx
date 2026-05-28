import type { ReactNode } from "react";
import { cn } from "../../utils/cn";
import { AbsoluteFrame } from "../layout/AbsoluteFrame";
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
    <AbsoluteFrame
      image="/images/hand_deck_player.png"
      className={cn(
        embedded
          ? "inset-0 h-full w-full"
          : "bottom-0 left-1/2 z-30 w-[var(--hand-w)] -translate-x-1/2",
        className
      )}
      bgStyle={embedded ? undefined : { top: "-8%", bottom: "-3%", height: "auto" }}
    >
      <div
        className={cn("absolute tabular-nums", flashMana && "animate-pulse")}
        style={{ left: "7.5%", top: "7%" }}
      >
        <span className="text-[0.62em] font-bold leading-none text-blue-100 drop-shadow-[0_1px_4px_rgba(0,0,0,1)]">
          ◆ {playerMana}/{playerMaxMana}
        </span>
      </div>

      <div
        className={cn("absolute tabular-nums", flashNexus && "animate-pulse")}
        style={{ right: "7.5%", top: "7%" }}
      >
        <span className="text-[0.62em] font-bold leading-none text-red-100 drop-shadow-[0_1px_4px_rgba(0,0,0,1)]">
          ♥ {displayPlayerNexus}/{nexusMax}
        </span>
      </div>

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
        style={{ left: "9%", right: "17%", top: "26%", bottom: "11%" }}
      >
        {children}
      </div>

      <div className="absolute" style={{ right: "2.2%", bottom: "5%" }}>
        <StrikeButton compact disabled={strikeDisabled} onClick={onStrike} />
      </div>
    </AbsoluteFrame>
  );
}
