import { cn } from "../../utils/cn";

type GoldIconProps = {
  className?: string;
  size?: "xs" | "sm" | "md" | "lg";
};

export function GoldIcon({ className, size = "sm" }: GoldIconProps) {
  return (
    <span
      className={cn(
        "gold-icon inline-block shrink-0 bg-transparent bg-center bg-contain bg-no-repeat",
        size === "xs" && "gold-icon-xs",
        size === "sm" && "gold-icon-sm",
        size === "md" && "gold-icon-md",
        size === "lg" && "gold-icon-lg",
        className
      )}
      role="img"
      aria-hidden
    />
  );
}
