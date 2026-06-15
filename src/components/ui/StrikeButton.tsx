import { useTranslation } from "react-i18next";
import { cn } from "../../utils/cn";

type StrikeButtonProps = {
  disabled: boolean;
  compact?: boolean;
  onClick: () => void;
};

export function StrikeButton({ disabled, compact = false, onClick }: StrikeButtonProps) {
  const { t } = useTranslation();

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={t("strike.title")}
      className={cn(
        "strike-btn shrink-0",
        compact && "strike-btn-compact",
        !disabled && "strike-btn-active"
      )}
    >
      <span className="strike-btn__label">{t("strike.label")}</span>
    </button>
  );
}
