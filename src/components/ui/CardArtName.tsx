type CardArtNameProps = {
  name: string;
  className?: string;
};

export function CardArtName({ name, className = "" }: CardArtNameProps) {
  return (
    <div className={`card-art-name pointer-events-none absolute z-[11] ${className}`}>
      <span className="card-name-badge">{name}</span>
    </div>
  );
}
