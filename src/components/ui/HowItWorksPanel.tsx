import { UI_ASPECT } from "../../utils/layoutTokens";

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
    <div
      className={`relative h-full shrink-0 ${className}`}
      style={{ aspectRatio: UI_ASPECT.howItWorks }}
    >
      <img
        src="/images/how_it_works.png"
        alt=""
        aria-hidden
        className="pointer-events-none absolute inset-0 h-full w-full select-none object-fill"
        draggable={false}
      />

      <div
        className="absolute z-10 overflow-hidden"
        style={{ left: "14%", right: "8%", top: "14%", bottom: "10%" }}
      >
        <h3
          className="font-display mb-2 text-center text-[10px] font-bold uppercase tracking-[0.18em] text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]"
          style={{ fontFamily: "Cinzel, Georgia, serif" }}
        >
          How It Works
        </h3>
        <ul
          className="space-y-1 text-[9px] leading-snug text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.85)]"
          style={{ fontFamily: "Cinzel, Georgia, serif" }}
        >
          <li>
            • <b className="font-bold text-white">Main Deck</b>: shared pool, face-down until bought.
          </li>
          <li>
            • <b className="font-bold text-white">Your Deck</b>: personal cards. Max {maxDeck}.
          </li>
          <li>
            • <b className="font-bold text-white">Gold each round 💰:</b>
          </li>
          <li className="pl-2">
            Win: <b className="font-bold text-white">+{goldWin}</b> · Tie: +{goldTie} · Lose: +{goldLose}
          </li>
          <li>• Empty deck &amp; broke: receive {freeRescue}💰 rescue gold.</li>
        </ul>
      </div>
    </div>
  );
}
