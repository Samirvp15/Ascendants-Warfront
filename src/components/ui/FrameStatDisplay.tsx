import type { CSSProperties } from "react";
import { cn } from "../../utils/cn";

const STAT_ICONS = {
  mana: "/images/mana_user_icon.png",
  nexus: "/images/nexus_life_icon.png",
} as const;

export type FrameStatKind = keyof typeof STAT_ICONS;

type FrameStatDisplayProps = {
  kind: FrameStatKind;
  value: number;
  max: number;
  flash?: boolean;
  className?: string;
  style?: CSSProperties;
};

export function FrameStatDisplay({
  kind,
  value,
  max,
  flash = false,
  className,
  style,
}: FrameStatDisplayProps) {
  return (
    <div className={cn("frame-stat", flash && "animate-pulse", className)} style={style}>
      <img
        src={STAT_ICONS[kind]}
        alt=""
        aria-hidden
        draggable={false}
        className="frame-stat__icon"
      />
      <span
        className="frame-stat__value font-display tabular-nums"
        aria-label={`${kind === "mana" ? "Mana" : "Nexus life"} ${value} of ${max}`}
      >
        {value}
      </span>
    </div>
  );
}
