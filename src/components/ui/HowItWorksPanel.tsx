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
      className={`stone-panel relative overflow-hidden p-3 ${className}`}
      style={{
        backgroundImage: `linear-gradient(180deg, rgba(15,23,42,0.92), rgba(2,6,23,0.96)), url('/images/card_acolyte.jpg')`,
        backgroundSize: "cover",
        backgroundPosition: "center 35%",
      }}
    >
      <h3 className="font-display mb-3 text-center text-xs font-bold uppercase tracking-[0.2em] text-amber-400/90">
        How It Works
      </h3>
      <ul className="space-y-1.5 text-[10px] leading-snug text-slate-400">
        <li>
          • <b className="text-amber-300">Main Deck</b>: shared pool, face-down until bought.
        </li>
        <li>
          • <b className="text-slate-200">Buy</b> a card → revealed and added to your deck.
        </li>
        <li>
          • <b className="text-sky-300">Your Deck</b>: personal cards. Max {maxDeck}.
        </li>
        <li>
          • <b className="text-rose-300">Playing a card consumes it permanently.</b>
        </li>
        <li>
          • <b className="text-emerald-300">Gold each round:</b>
        </li>
        <li className="pl-2">
          – Win: <b className="text-emerald-300">+{goldWin}💰</b> · Tie: +{goldTie}💰 · Lose: +{goldLose}💰
        </li>
        <li>• Shop always has ≥1 unit. Refreshes 3× free/round.</li>
        <li>
          • Empty deck &amp; broke: receive {freeRescue}💰 rescue gold.
        </li>
      </ul>
    </div>
  );
}
