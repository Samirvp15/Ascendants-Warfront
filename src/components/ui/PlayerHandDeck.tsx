import type { ReactNode } from "react";
import { cn } from "../../utils/cn";
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
  children,
}: PlayerHandDeckProps) {
  return (
    <div className={cn("relative w-full shrink-0", className)}>
      <img
        src="/images/hand_deck_player.png"
        alt=""
        aria-hidden
        className="pointer-events-none absolute inset-0 h-full w-full select-none object-fill"
        draggable={false}
      />

      <div
        className={cn("absolute z-20 tabular-nums", flashMana && "animate-pulse")}
        style={{ left: "7%", top: "9%" }}
      >
        <span className="text-[11px] font-bold text-blue-100 drop-shadow-[0_1px_4px_rgba(0,0,0,1)]">
          ◆ {playerMana}/{playerMaxMana}
        </span>
      </div>

      <div
        className={cn("absolute z-20 tabular-nums", flashNexus && "animate-pulse")}
        style={{ right: "7%", top: "9%" }}
      >
        <span className="text-[11px] font-bold text-red-100 drop-shadow-[0_1px_4px_rgba(0,0,0,1)]">
          ♥ {displayPlayerNexus}/{nexusMax}
        </span>
      </div>

      {(selectedCardName || isMoving || deckEmpty || deckCount <= 2) && (
        <div
          className="absolute z-20 flex -translate-x-1/2 flex-wrap items-center justify-center gap-1 px-2"
          style={{ left: "50%", top: "8%" }}
        >
          {deckEmpty && (
            <span className="text-[8px] font-semibold text-rose-200 drop-shadow-md">⚠ Deck empty</span>
          )}
          {!deckEmpty && deckCount <= 2 && (
            <span className="text-[8px] font-semibold text-amber-200 drop-shadow-md">{deckCount} cards left</span>
          )}
          {selectedCardName && (
            <span className="text-[8px] font-bold text-amber-100 drop-shadow-md animate-pulse">
              {selectedCardName} → lane
            </span>
          )}
          {isMoving && !selectedCardName && (
            <span className="text-[8px] font-bold text-sky-100 drop-shadow-md animate-pulse">Moving → lane</span>
          )}
        </div>
      )}

      <div
        className="absolute z-10 flex items-end justify-center gap-1.5 overflow-x-auto overflow-y-hidden [scrollbar-width:thin]"
        style={{ left: "10%", right: "18%", top: "30%", bottom: "14%" }}
      >
        {children}
      </div>

      <div className="absolute z-20" style={{ right: "2.5%", bottom: "6%" }}>
        <StrikeButton compact disabled={strikeDisabled} onClick={onStrike} />
      </div>
    </div>
  );
}
