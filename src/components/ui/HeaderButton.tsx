import { cn } from "../../utils/cn";

type HeaderButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement>;

export function HeaderButton({ className, children, ...props }: HeaderButtonProps) {
  return (
    <button type="button" className={cn("header-btn", className)} {...props}>
      {children}
    </button>
  );
}

type HeaderBadgeProps = {
  variant?: "gold";
  children: React.ReactNode;
  className?: string;
};

export function HeaderBadge({ variant = "gold", className, children }: HeaderBadgeProps) {
  return (
    <span className={cn("header-btn pointer-events-none", variant === "gold" && "header-btn-gold", className)}>
      {children}
    </span>
  );
}
