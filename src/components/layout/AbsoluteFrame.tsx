import type { CSSProperties, ReactNode } from "react";
import { cn } from "../../utils/cn";

type AbsoluteFrameProps = React.HTMLAttributes<HTMLDivElement> & {
  image: string;
  children?: ReactNode;
  className?: string;
  bgClassName?: string;
  contentClassName?: string;
  style?: CSSProperties;
  bgStyle?: CSSProperties;
};

/** PNG frame layer — always `position: absolute` so sections can overlap for space */
export function AbsoluteFrame({
  image,
  children,
  className,
  bgClassName,
  contentClassName,
  style,
  bgStyle,
  ...rest
}: AbsoluteFrameProps) {
  return (
    <div className={cn("absolute-frame", className)} style={style} {...rest}>
      <img
        src={image}
        alt=""
        aria-hidden
        draggable={false}
        className={cn(
          "absolute-frame__bg pointer-events-none absolute inset-0 h-full w-full select-none object-fill",
          bgClassName
        )}
        style={bgStyle}
      />
      {children ? (
        <div className={cn("absolute-frame__content absolute inset-0 z-10", contentClassName)}>
          {children}
        </div>
      ) : null}
    </div>
  );
}

/** Relative slot that holds one or more overlapping absolute frames */
export function AbsoluteFrameAnchor({
  children,
  className,
  style,
  onClick,
  ...rest
}: React.HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  onClick?: () => void;
}) {
  return (
    <div
      className={cn("absolute-frame-anchor relative", className)}
      style={style}
      onClick={onClick}
      onKeyDown={onClick ? (e) => e.key === "Enter" && onClick() : undefined}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      {...rest}
    >
      {children}
    </div>
  );
}
