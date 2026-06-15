import type { TooltipRenderProps } from "react-joyride";
import { useTranslation } from "react-i18next";
import { cn } from "../../utils/cn";

export function GameTourTooltip({
  step,
  index,
  size,
  isLastStep,
  backProps,
  closeProps,
  primaryProps,
  skipProps,
  tooltipProps,
}: TooltipRenderProps) {
  const { t } = useTranslation();

  return (
    <div {...tooltipProps} className="game-tour-tooltip">
      <button
        type="button"
        {...closeProps}
        className="game-tour-tooltip__close"
        aria-label={t("tour.closeAria")}
      >
        ×
      </button>

      {step.title && <h4 className="game-tour-tooltip__title font-display">{step.title}</h4>}

      <div className="game-tour-tooltip__content">{step.content}</div>

      <div className="game-tour-tooltip__footer">
        <button type="button" {...skipProps} className="game-tour-tooltip__btn game-tour-tooltip__btn--ghost">
          {t("tour.skip")}
        </button>

        <span className="game-tour-tooltip__progress tabular-nums">
          {index + 1} / {size}
        </span>

        <div className="game-tour-tooltip__actions">
          {index > 0 && (
            <button type="button" {...backProps} className="game-tour-tooltip__btn game-tour-tooltip__btn--ghost">
              {t("tour.back")}
            </button>
          )}
          <button
            type="button"
            {...primaryProps}
            className={cn("game-tour-tooltip__btn game-tour-tooltip__btn--primary font-display")}
          >
            {isLastStep ? t("tour.play") : t("tour.next")}
          </button>
        </div>
      </div>
    </div>
  );
}
