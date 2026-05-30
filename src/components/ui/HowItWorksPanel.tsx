import { AbsoluteFrame } from "../layout/AbsoluteFrame";
import { GoldIcon } from "./GoldIcon";

type HowItWorksPanelProps = {
  maxDeck: number;
  goldWin: number;
  goldTie: number;
  goldLose: number;
  freeRescue: number;
  className?: string;
};

export function HowItWorksPanel({
  maxDeck,
  goldWin,
  goldTie,
  goldLose,
  freeRescue,
  className = "",
}: HowItWorksPanelProps) {
  return (
    <AbsoluteFrame
      image="/images/how_it_works.png"
      className={className}
      style={{ width: "var(--hiw-w)", height: "var(--hiw-h)" }}
      contentClassName="overflow-hidden"
    >
      <div
        className="absolute overflow-hidden"
        style={{ left: "11%", right: "9%", top: "16%", bottom: "7%" }}
      >
        <h3
          className="font-display mb-[0.55em] text-center text-[0.82em] font-bold uppercase tracking-[0.14em] text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]"
          style={{ fontFamily: "Cinzel, Georgia, serif" }}
        >
          How It Works
        </h3>
        <ul
          className="space-y-[0.4em] text-[0.74em] leading-snug text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.85)]"
          style={{ fontFamily: "Cinzel, Georgia, serif" }}
        >
          <li>
            • <b className="font-bold text-white">Main Deck</b>: shared pool, face-down until bought.
          </li>
          <li>
            • <b className="font-bold text-white">Your Deck</b>: personal cards. Max {maxDeck}.
          </li>
          <li className="flex items-center gap-[0.35em]">
            <span>•</span>
            <b className="font-bold text-white">Gold each round</b>
            <GoldIcon size="xs" className="translate-y-[-0.05em]" />
            <span>:</span>
          </li>
          <li className="pl-[0.45em]">
            Win: <b className="font-bold text-white">+{goldWin}</b> · Tie: +{goldTie} · Lose: +{goldLose}
          </li>
          <li className="flex items-center gap-[0.35em]">
            <span>• Empty deck &amp; broke: receive {freeRescue}</span>
            <GoldIcon size="xs" />
            <span>rescue gold.</span>
          </li>
        </ul>
      </div>
    </AbsoluteFrame>
  );
}
