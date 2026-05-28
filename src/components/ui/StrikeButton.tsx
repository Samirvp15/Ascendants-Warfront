import { cn } from "../../utils/cn";

type StrikeButtonProps = {
  disabled: boolean;
  compact?: boolean;
  onClick: () => void;
};

export function StrikeButton({ disabled, compact = false, onClick }: StrikeButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title="End your turn and begin combat"
      className={cn("strike-btn shrink-0", compact && "strike-btn-compact", !disabled && "strike-btn-active")}
    >
      STRIKE
    </button>
  );
}
