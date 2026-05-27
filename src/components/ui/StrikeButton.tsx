import { cn } from "../../utils/cn";

type StrikeButtonProps = {
  disabled: boolean;
  onClick: () => void;
};

export function StrikeButton({ disabled, onClick }: StrikeButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title="End your turn and begin combat"
      className={cn("strike-btn shrink-0", !disabled && "strike-btn-active")}
    >
      STRIKE
    </button>
  );
}
