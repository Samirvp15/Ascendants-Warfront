import { useTranslation } from "react-i18next";
import { AbsoluteFrame } from "../layout/AbsoluteFrame";
import { GoldIcon } from "./GoldIcon";

type HowItWorksPanelProps = {
  maxDeck: number;
  goldWin: number;
  goldTie: number;
  goldLose: number;
  className?: string;
};

export function HowItWorksPanel({
  maxDeck,
  goldWin,
  goldTie,
  goldLose,
  className = "",
}: HowItWorksPanelProps) {
  const { t } = useTranslation();

  return (
    <AbsoluteFrame
      image="/images/how_it_works.png"
      className={className}
      data-tour="how-it-works"
      style={{ width: "var(--hiw-w)", height: "var(--hiw-h)" }}
      contentClassName="overflow-hidden"
    >
      <div
        className="absolute overflow-hidden"
        style={{ left: "11%", right: "9%", top: "16%", bottom: "7%" }}
      >
        <h3
          className="font-display mb-[0.55em] text-center text-[0.82em] font-bold uppercase tracking-[0.14em] text-amber-300 drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]"
        >
          {t("howItWorks.title")}
        </h3>
        <ul className="font-display space-y-[0.4em] text-[0.74em] leading-snug text-amber-100 drop-shadow-[0_1px_2px_rgba(0,0,0,0.85)]">
          <li>
            • <b className="font-bold text-amber-200">{t("howItWorks.mainDeck")}</b>:
          </li>
          <li className="pl-[0.45em]">{t("howItWorks.mainDeckDesc")}</li>
          <li>
            • <b className="font-bold text-amber-200">{t("howItWorks.yourDeck")}</b>:
          </li>
          <li className="pl-[0.45em]">{t("howItWorks.yourDeckDesc", { maxDeck })}</li>
          <li className="flex items-center gap-[0.35em]">
            <span>•</span>
            <b className="font-bold text-amber-200">{t("howItWorks.goldEachRound")}</b>
            <GoldIcon size="xs" className="translate-y-[-0.05em]" />
            <span>:</span>
          </li>
          <li className="pl-[0.45em]">
            {t("howItWorks.goldPayouts", { goldWin, goldTie, goldLose })}
          </li>
        </ul>
      </div>
    </AbsoluteFrame>
  );
}
