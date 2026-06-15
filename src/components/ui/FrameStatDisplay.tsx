import type { CSSProperties } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "../../utils/cn";

const STAT_ICONS = {
  mana: "/images/mana_user_icon.png",
  nexus: "/images/nexus_life_icon.png",
} as const;

export type FrameStatKind = keyof typeof STAT_ICONS;
export type FrameStatPulseVariant = "damage" | "heal" | "spend" | "gain";

type FrameStatDisplayProps = {
  kind: FrameStatKind;
  value: number;
  max: number;
  layout?: "inline" | "icon-badge";
  valueOnBadge?: boolean;
  iconOnLeft?: boolean;
  valuePulseKey?: number;
  pulseVariant?: FrameStatPulseVariant;
  className?: string;
  style?: CSSProperties;
};

function pulseValueClass(pulseVariant?: FrameStatPulseVariant, valuePulseKey = 0) {
  if (!pulseVariant || valuePulseKey <= 0) return undefined;
  return `frame-stat__value-text--${pulseVariant}`;
}

function pulseFrameClass(kind: FrameStatKind, pulseVariant?: FrameStatPulseVariant, valuePulseKey = 0) {
  if (!pulseVariant || valuePulseKey <= 0) return undefined;
  return `frame-stat--pulse-${kind}-${pulseVariant}`;
}

function StatPulseFx({
  pulseKey,
  variant,
}: {
  pulseKey: number;
  variant: FrameStatPulseVariant;
}) {
  if (pulseKey <= 0) return null;

  return (
    <>
      <span
        key={`ring-a-${pulseKey}`}
        className={cn("frame-stat__fx-ring frame-stat__fx-ring--a", `frame-stat__fx-ring--${variant}`)}
        aria-hidden
      />
      <span
        key={`ring-b-${pulseKey}`}
        className={cn("frame-stat__fx-ring frame-stat__fx-ring--b", `frame-stat__fx-ring--${variant}`)}
        aria-hidden
      />
      <span
        key={`flash-${pulseKey}`}
        className={cn("frame-stat__fx-flash", `frame-stat__fx-flash--${variant}`)}
        aria-hidden
      />
      <span
        key={`spark-${pulseKey}`}
        className={cn("frame-stat__fx-spark", `frame-stat__fx-spark--${variant}`)}
        aria-hidden
      />
    </>
  );
}

export function FrameStatDisplay({
  kind,
  value,
  max,
  layout = "inline",
  valueOnBadge = false,
  iconOnLeft = false,
  valuePulseKey = 0,
  pulseVariant,
  className,
  style,
}: FrameStatDisplayProps) {
  const { t } = useTranslation();
  const label =
    kind === "mana"
      ? t("stats.manaAria", { value, max })
      : t("stats.nexusAria", { value, max });
  const isPulsing = valuePulseKey > 0 && !!pulseVariant;
  const valuePulseClass = pulseValueClass(pulseVariant, valuePulseKey);
  const framePulseClass = pulseFrameClass(kind, pulseVariant, valuePulseKey);

  const valueEl = (
    <span className="frame-stat__value-anchor">
      <span
        key={isPulsing ? `${value}-${valuePulseKey}` : undefined}
        className={cn("frame-stat__value-text font-display tabular-nums", valuePulseClass)}
        aria-label={label}
      >
        {value}
      </span>
    </span>
  );

  if (layout === "icon-badge") {
    return (
      <div
        className={cn(
          "frame-stat frame-stat--icon-badge",
          valueOnBadge && "frame-stat--value-on-badge",
          valueOnBadge && iconOnLeft && "frame-stat--icon-left",
          framePulseClass,
          className
        )}
        style={style}
      >
        {!valueOnBadge && valueEl}
        <div className="frame-stat__icon-stack">
          {isPulsing && pulseVariant && (
            <StatPulseFx pulseKey={valuePulseKey} variant={pulseVariant} />
          )}
          <span className="frame-stat__badge-bg" aria-hidden />
          {valueOnBadge && valueEl}
          <span className="frame-stat__icon-anchor">
            <img
              src={STAT_ICONS[kind]}
              alt=""
              aria-hidden
              draggable={false}
              className="frame-stat__icon"
            />
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("frame-stat", framePulseClass, className)} style={style}>
      <div className="frame-stat__icon-stack frame-stat__icon-stack--inline">
        {isPulsing && pulseVariant && (
          <StatPulseFx pulseKey={valuePulseKey} variant={pulseVariant} />
        )}
        <span className="frame-stat__icon-anchor">
          <img
            src={STAT_ICONS[kind]}
            alt=""
            aria-hidden
            draggable={false}
            className="frame-stat__icon"
          />
        </span>
      </div>
      {valueEl}
    </div>
  );
}
