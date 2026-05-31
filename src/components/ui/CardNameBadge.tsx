type CardNameBadgeProps = {
  name: string;
  className?: string;
};

export function CardNameBadge({ name, className = "" }: CardNameBadgeProps) {
  return <span className={`card-name-badge ${className}`.trim()}>{name}</span>;
}
