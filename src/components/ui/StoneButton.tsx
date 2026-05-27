import { cn } from "../../utils/cn";

type StoneButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "danger";
};

export function StoneButton({ variant = "default", className, children, ...props }: StoneButtonProps) {
  return (
    <button
      type="button"
      className={cn(
        "stone-btn px-3 py-1.5",
        variant === "danger" && "border-red-900/60 text-red-200",
        variant === "default" && "text-slate-200",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
