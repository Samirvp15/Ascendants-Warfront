import { cn } from "../../utils/cn";

type HeaderButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "danger" | "phase-player" | "phase-enemy" | "phase-combat";
};

export function HeaderButton({
  variant = "default",
  className,
  children,
  ...props
}: HeaderButtonProps) {
  return (
    <button
      type="button"
      className={cn(
        "header-btn",
        variant === "danger" && "header-btn-danger",
        variant === "phase-player" && "header-btn-phase-player",
        variant === "phase-enemy" && "header-btn-phase-enemy",
        variant === "phase-combat" && "header-btn-phase-combat",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

type HeaderBadgeProps = {
  variant?: "phase-player" | "phase-enemy" | "phase-combat" | "gold";
  children: React.ReactNode;
  className?: string;
};

export function HeaderBadge({ variant = "phase-player", className, children }: HeaderBadgeProps) {
  return (
    <span
      className={cn(
        "header-btn pointer-events-none",
        variant === "phase-player" && "header-btn-phase-player",
        variant === "phase-enemy" && "header-btn-phase-enemy",
        variant === "phase-combat" && "header-btn-phase-combat",
        variant === "gold" && "header-btn-gold",
        className
      )}
    >
      {children}
    </span>
  );
}
