import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "../../utils/cn";
import { AbsoluteFrame } from "../layout/AbsoluteFrame";
import { FrameStatDisplay, type FrameStatPulseVariant } from "./FrameStatDisplay";
import { StrikeButton } from "./StrikeButton";

type PlayerHandDeckProps = {
  playerMana: number;
  playerMaxMana: number;
  displayPlayerNexus: number;
  nexusMax: number;
  manaPulseKey?: number;
  manaPulseVariant?: FrameStatPulseVariant;
  nexusPulseKey?: number;
  nexusPulseVariant?: FrameStatPulseVariant;
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
  manaPulseKey = 0,
  manaPulseVariant,
  nexusPulseKey = 0,
  nexusPulseVariant,
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
  const { t } = useTranslation();
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
          valuePulseKey={manaPulseKey}
          pulseVariant={manaPulseVariant}
          layout="icon-badge"
          valueOnBadge
          iconOnLeft
          className="frame-stat--player-mana"
        />

        <FrameStatDisplay
          kind="nexus"
          value={displayPlayerNexus}
          max={nexusMax}
          valuePulseKey={nexusPulseKey}
          pulseVariant={nexusPulseVariant}
          layout="icon-badge"
          valueOnBadge
          className="frame-stat--player-nexus"
        />

        {showStatus && (
          <div
            className="absolute flex -translate-x-1/2 flex-wrap items-center justify-center gap-[0.2em] px-[2%]"
            style={{ left: "50%", top: "6.5%" }}
          >
            {deckEmpty && (
              <span className="text-[0.56em] font-semibold text-rose-200 drop-shadow-md">
                {t("hand.deckEmpty")}
              </span>
            )}
            {!deckEmpty && deckCount <= 2 && (
              <span className="text-[0.56em] font-semibold text-amber-200 drop-shadow-md">
                {t("hand.cardsLeft", { count: deckCount })}
              </span>
            )}
            {selectedCardName && (
              <span className="text-[0.56em] font-bold text-amber-100 drop-shadow-md animate-pulse">
                {t("hand.selectedToLane", { name: selectedCardName })}
              </span>
            )}
            {isMoving && !selectedCardName && (
              <span className="text-[0.56em] font-bold text-sky-100 drop-shadow-md animate-pulse">
                {t("hand.movingToLane")}
              </span>
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
