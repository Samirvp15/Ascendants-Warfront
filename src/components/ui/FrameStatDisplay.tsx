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
  layout?: "inline" | "icon-badge";
  /** When icon-badge: value sits on the header_button plaque. */
  valueOnBadge?: boolean;
  /** With valueOnBadge: icon on the left, value on the right of the plaque (mana style). */
  iconOnLeft?: boolean;
  className?: string;
  style?: CSSProperties;
};

export function FrameStatDisplay({
  kind,
  value,
  max,
  flash = false,
  layout = "inline",
  valueOnBadge = false,
  iconOnLeft = false,
  className,
  style,
}: FrameStatDisplayProps) {
  const label = `${kind === "mana" ? "Mana" : "Nexus life"} ${value} of ${max}`;

  if (layout === "icon-badge") {
    const valueEl = (
      <span
        className="frame-stat__value-text font-display tabular-nums"
        aria-label={label}
      >
        {value}
      </span>
    );

    return (
      <div
        className={cn(
          "frame-stat frame-stat--icon-badge",
          valueOnBadge && "frame-stat--value-on-badge",
          valueOnBadge && iconOnLeft && "frame-stat--icon-left",
          flash && "animate-pulse",
          className
        )}
        style={style}
      >
        {!valueOnBadge && valueEl}
        <div className="frame-stat__icon-stack">
          <span className="frame-stat__badge-bg" aria-hidden />
          {valueOnBadge && valueEl}
          <img
            src={STAT_ICONS[kind]}
            alt=""
            aria-hidden
            draggable={false}
            className="frame-stat__icon"
          />
        </div>
      </div>
    );
  }

  return (
    <div className={cn("frame-stat", flash && "animate-pulse", className)} style={style}>
      <img
        src={STAT_ICONS[kind]}
        alt=""
        aria-hidden
        draggable={false}
        className="frame-stat__icon"
      />
      <span className="frame-stat__value font-display tabular-nums" aria-label={label}>
        {value}
      </span>
    </div>
  );
}
