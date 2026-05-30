import { cn } from "../../utils/cn";

const STAT_IMAGES = {
  mana: "/images/mana_icon.png",
  attack: "/images/attack_icon.png",
  hp: "/images/hp_icon.png",
} as const;

type StatKind = keyof typeof STAT_IMAGES;

type CardStatIconProps = {
  kind: StatKind;
  value: number | string;
  size?: "xs" | "sm" | "md" | "lane";
  className?: string;
};

export function CardStatIcon({ kind, value, size = "md", className }: CardStatIconProps) {
  return (
    <span
      className={cn(
        "card-stat-icon",
        size === "xs" && "card-stat-icon--xs",
        size === "sm" && "card-stat-icon--sm",
        size === "md" && "card-stat-icon--md",
        size === "lane" && "card-stat-icon--lane",
        className
      )}
      aria-hidden
    >
      <img src={STAT_IMAGES[kind]} alt="" draggable={false} className="card-stat-icon__img" />
      <span className="card-stat-icon__value tabular-nums">{value}</span>
    </span>
  );
}
