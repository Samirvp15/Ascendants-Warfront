const CARD_ART: Record<string, { src: string; centeredName?: boolean }> = {
  scout: { src: "/images/scout_img.png", centeredName: true },
  acolyte: { src: "/images/acolyte_img.png", centeredName: true },
  guardian: { src: "/images/guardian_img.png", centeredName: true },
  soldier: { src: "/images/soldier_img.png", centeredName: true },
  tank: { src: "/images/tank_img.png", centeredName: true },
  raider: { src: "/images/raider_img.png", centeredName: true },
  knight: { src: "/images/knight_img.png", centeredName: true },
  assassin: { src: "/images/assasin_img.png", centeredName: true },
  brute: { src: "/images/brute_img.png", centeredName: true },
  colossus: { src: "/images/colossus_img.png", centeredName: true },
  mend: { src: "/images/mend_spell.png", centeredName: true },
  healing_wave: { src: "/images/healing_wave_spell.png", centeredName: true },
};

export function getCardImageSrc(cardId: string): string {
  return CARD_ART[cardId]?.src ?? `/images/card_${cardId}.jpg`;
}

export function cardHasCustomArt(cardId: string): boolean {
  return cardId in CARD_ART;
}

export function cardUsesCenteredName(cardId: string): boolean {
  return CARD_ART[cardId]?.centeredName ?? false;
}
