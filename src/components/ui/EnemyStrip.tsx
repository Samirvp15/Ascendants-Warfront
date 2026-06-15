import { cn } from "../../utils/cn";
import { AbsoluteFrame } from "../layout/AbsoluteFrame";
import { FrameStatDisplay, type FrameStatPulseVariant } from "./FrameStatDisplay";
import { MysteryDeckCard } from "./MysteryDeckCard";
import { useTranslation } from "react-i18next";

type EnemyStripProps = {
  enemyMana: number;
  enemyMaxMana: number;
  displayEnemyNexus: number;
  nexusMax: number;
  enemyDeckCount: number;
  manaPulseKey?: number;
  manaPulseVariant?: FrameStatPulseVariant;
  nexusPulseKey?: number;
  nexusPulseVariant?: FrameStatPulseVariant;
  className?: string;
  embedded?: boolean;
  deckCardUids?: string[];
  newlyBoughtUid?: string | null;
};

export function EnemyStrip({
  enemyMana,
  enemyMaxMana,
  displayEnemyNexus,
  nexusMax,
  enemyDeckCount,
  manaPulseKey = 0,
  manaPulseVariant,
  nexusPulseKey = 0,
  nexusPulseVariant,
  className = "",
  embedded = false,
  deckCardUids = [],
  newlyBoughtUid = null,
}: EnemyStripProps) {
  const { t } = useTranslation();

  return (
    <AbsoluteFrame
      image="/images/enemy_strip.png"
      className={cn(
        embedded
          ? "inset-0 h-full w-full"
          : "left-1/2 top-0 z-30 w-[var(--enemy-w)] -translate-x-1/2",
        "transition-all duration-700",
        className
      )}
      contentClassName="enemy-strip-content"
    >
      <div className="enemy-deck-zone">
        <div className="enemy-deck-zone__deck">
          {deckCardUids.length > 0 ? (
            deckCardUids.map((uid, index) => (
              <MysteryDeckCard
                key={uid}
                newlyBought={newlyBoughtUid === uid}
                style={{
                  zIndex: newlyBoughtUid === uid ? deckCardUids.length + 10 : index + 1,
                }}
              />
            ))
          ) : (
            <span className="enemy-deck-zone__empty font-display">{t("common.dash")}</span>
          )}
        </div>
      </div>

      <div className="enemy-strip-stats">
        <FrameStatDisplay
          kind="mana"
          value={enemyMana}
          max={enemyMaxMana}
          valuePulseKey={manaPulseKey}
          pulseVariant={manaPulseVariant}
          layout="icon-badge"
          valueOnBadge
          iconOnLeft
          className="frame-stat--enemy-left"
        />
        <FrameStatDisplay
          kind="nexus"
          value={displayEnemyNexus}
          max={nexusMax}
          valuePulseKey={nexusPulseKey}
          pulseVariant={nexusPulseVariant}
          layout="icon-badge"
          valueOnBadge
          className="frame-stat--enemy-right"
        />
      </div>

      
    </AbsoluteFrame>
  );
}
