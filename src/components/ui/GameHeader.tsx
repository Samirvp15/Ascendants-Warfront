import { LanguageSwitcher } from "../i18n/LanguageSwitcher";
import { HeaderButton } from "./HeaderButton";
import { GoldIcon } from "./GoldIcon";
import { HowItWorksPanel } from "./HowItWorksPanel";
import { AbsoluteFrameAnchor } from "../layout/AbsoluteFrame";
import { cn } from "../../utils/cn";
import { useTranslation } from "react-i18next";

type GameSidebarProps = {
  maxDeck: number;
  goldWin: number;
  goldTie: number;
  goldLose: number;
};

export function GameSidebar({
  maxDeck,
  goldWin,
  goldTie,
  goldLose,
}: GameSidebarProps) {
  const { t } = useTranslation();

  return (
    <aside className="absolute-frame-anchor flex h-full min-h-0 flex-col items-center gap-[0.55em] overflow-x-visible overflow-y-auto">
      <div className="logo-block flex w-full shrink-0 items-center justify-center">
        <img
          src="/images/game_logo.png"
          alt={t("header.logoAlt")}
          className="h-[var(--logo-h)] w-auto max-w-[94%] object-contain drop-shadow-[0_8px_32px_rgba(0,0,0,0.85)]"
        />
      </div>

      <AbsoluteFrameAnchor
        className="mt-[0.15em] w-[var(--hiw-w)] shrink-0"
        style={{ height: "var(--hiw-h)" }}
      >
        <HowItWorksPanel
          className="inset-0"
          maxDeck={maxDeck}
          goldWin={goldWin}
          goldTie={goldTie}
          goldLose={goldLose}
        />
      </AbsoluteFrameAnchor>
    </aside>
  );
}

type GameControlsProps = {
  displayGold: number;
  flashGold: number | null;
  onReset: () => void;
  onStartTour: () => void;
};

export function GameControls({
  displayGold,
  flashGold,
  onReset,
  onStartTour,
}: GameControlsProps) {
  const { t } = useTranslation();

  return (
    <div className="absolute-frame-anchor z-40 flex shrink-0 flex-wrap items-center justify-end gap-[0.35em] p-2">
      <span
        data-tour="gold"
        className={cn(
          "gold-amount-badge header-gold-badge pointer-events-none transition-transform duration-500",
          flashGold !== null && "header-gold-badge-flash"
        )}
      >
        <span className="gold-amount-badge__value tabular-nums">{displayGold}</span>
        {flashGold !== null && (
          <span className="gold-amount-badge__bonus animate-pulse tabular-nums">+{flashGold}</span>
        )}
        <GoldIcon size="lg" className="gold-amount-badge__icon" />
      </span>
      <LanguageSwitcher />
      <HeaderButton onClick={onStartTour} title={t("header.guideTitle")}>
        {t("header.guide")}
      </HeaderButton>
      <HeaderButton onClick={onReset}>{t("header.resetAll")}</HeaderButton>
    </div>
  );
}
