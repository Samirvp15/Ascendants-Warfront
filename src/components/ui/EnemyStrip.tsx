import { cn } from "../../utils/cn";
import { AbsoluteFrame } from "../layout/AbsoluteFrame";
import { FrameStatDisplay } from "./FrameStatDisplay";
import { MysteryDeckCard } from "./MysteryDeckCard";

type EnemyStripProps = {
  enemyMana: number;
  enemyMaxMana: number;
  displayEnemyNexus: number;
  nexusMax: number;
  enemyDeckCount: number;
  flashMana: boolean;
  flashNexus: boolean;
  activeTurn: boolean;
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
  flashMana,
  flashNexus,
  activeTurn,
  className = "",
  embedded = false,
  deckCardUids = [],
  newlyBoughtUid = null,
}: EnemyStripProps) {
  return (
    <AbsoluteFrame
      image="/images/enemy_strip.png"
      className={cn(
        embedded
          ? "inset-0 h-full w-full"
          : "left-1/2 top-0 z-30 w-[var(--enemy-w)] -translate-x-1/2",
        "transition-all duration-700",
        activeTurn && "ring-1 ring-rose-400/40",
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
            <span className="enemy-deck-zone__empty font-display">—</span>
          )}
        </div>
      </div>

      <div className="enemy-strip-stats">
        <FrameStatDisplay
          kind="mana"
          value={enemyMana}
          max={enemyMaxMana}
          flash={flashMana}
          className="frame-stat--enemy-mana"
        />
        <FrameStatDisplay
          kind="nexus"
          value={displayEnemyNexus}
          max={nexusMax}
          flash={flashNexus}
          className="frame-stat--enemy-nexus"
        />
      </div>

      {enemyDeckCount > 0 && (
        <span className="enemy-strip-count font-display tabular-nums">{enemyDeckCount}</span>
      )}
    </AbsoluteFrame>
  );
}
