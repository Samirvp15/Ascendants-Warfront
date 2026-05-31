import type { RefObject } from "react";

type UnitRefs = RefObject<Record<string, HTMLDivElement | null>>;

export type ClashImpactResult = {
  playerHp: number;
  enemyHp: number;
};

const COMBAT_LAYER_SEL = ".unit-card-combat-layer";
const REST = "translate3d(0, 0, 0) scale(1)";
const LUNGE_SCALE = 1.06;

const TIMING = {
  /** Faceoff pause before both units lunge */
  preClash: 520,
  lungeOut: 380,
  /** Hold at impact while HP discount plays */
  lifeDiscount: 520,
  lungeBack: 340,
  defeatFade: 360,
} as const;

function getLayer(root: HTMLElement): HTMLElement {
  return root.querySelector<HTMLElement>(COMBAT_LAYER_SEL) ?? root;
}

function commitKeyframe(layer: HTMLElement, frame: Keyframe) {
  if (frame.opacity !== undefined && frame.opacity !== null) {
    layer.style.opacity = String(frame.opacity);
  }
  if (frame.transform !== undefined && frame.transform !== null) {
    layer.style.transform = String(frame.transform);
  }
}

export function resetCombatVisuals(root: HTMLElement) {
  const layer = getLayer(root);
  layer.getAnimations().forEach((a) => a.cancel());
  layer.style.opacity = "1";
  layer.style.transform = REST;
  layer.style.removeProperty("filter");
  layer.style.removeProperty("will-change");
  requestAnimationFrame(() => {
    layer.style.removeProperty("transform");
    layer.style.removeProperty("opacity");
  });
}

export function resetAllCombatUnits(unitRefs: UnitRefs) {
  for (const el of Object.values(unitRefs.current)) {
    if (!el) continue;
    const layer = getLayer(el);
    if (layer.style.opacity === "0") continue;
    resetCombatVisuals(el);
    el.classList.remove("unit-card--combat-anim");
  }
}

function getLaneClashCenter(el: HTMLElement): { x: number; y: number } {
  const lane = el.closest(".absolute-frame-anchor");
  if (lane) {
    const divider = lane.querySelector(".lane-clash-line");
    if (divider) {
      const rect = divider.getBoundingClientRect();
      return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    }
    const rect = lane.getBoundingClientRect();
    return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
  }
  const rect = el.getBoundingClientRect();
  return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
}

function halfExtentAlongDirection(
  rect: DOMRect,
  nx: number,
  ny: number,
  scale: number
) {
  const hw = (rect.width * scale) / 2;
  const hh = (rect.height * scale) / 2;
  return Math.abs(nx) * hw + Math.abs(ny) * hh;
}

/**
 * Both units lunge toward the lane clash line. Travel is capped so scaled card
 * edges meet at the center without overlapping each other.
 */
function getSymmetricClashOffsets(
  player: HTMLElement,
  enemy: HTMLElement
): { player: { x: number; y: number }; enemy: { x: number; y: number } } {
  const center = getLaneClashCenter(player);
  const pRect = player.getBoundingClientRect();
  const eRect = enemy.getBoundingClientRect();

  const pCx = pRect.left + pRect.width / 2;
  const pCy = pRect.top + pRect.height / 2;
  const eCx = eRect.left + eRect.width / 2;
  const eCy = eRect.top + eRect.height / 2;

  const pDx = center.x - pCx;
  const pDy = center.y - pCy;
  const eDx = center.x - eCx;
  const eDy = center.y - eCy;

  const pDist = Math.hypot(pDx, pDy) || 1;
  const eDist = Math.hypot(eDx, eDy) || 1;

  const pNx = pDx / pDist;
  const pNy = pDy / pDist;
  const eNx = eDx / eDist;
  const eNy = eDy / eDist;

  const pHalf = halfExtentAlongDirection(pRect, pNx, pNy, LUNGE_SCALE);
  const eHalf = halfExtentAlongDirection(eRect, eNx, eNy, LUNGE_SCALE);

  // Stop each center short of the clash line by its scaled half-size (inner edge at center).
  const playerTravel = Math.max(0, pDist - pHalf);
  const enemyTravel = Math.max(0, eDist - eHalf);

  return {
    player: { x: pNx * playerTravel, y: pNy * playerTravel },
    enemy: { x: eNx * enemyTravel, y: eNy * enemyTravel },
  };
}

function getClashOffsetTowardCenter(unit: HTMLElement): { x: number; y: number } {
  const center = getLaneClashCenter(unit);
  const rect = unit.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  const dx = center.x - cx;
  const dy = center.y - cy;
  const dist = Math.hypot(dx, dy) || 1;
  const nx = dx / dist;
  const ny = dy / dist;
  const half = halfExtentAlongDirection(rect, nx, ny, LUNGE_SCALE);
  const travel = Math.max(0, dist - half);
  return { x: nx * travel, y: ny * travel };
}

function wait(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

async function animateLayer(
  layer: HTMLElement,
  keyframes: Keyframe[],
  options: KeyframeAnimationOptions
) {
  const anim = layer.animate(keyframes, options);
  const lastFrame = keyframes[keyframes.length - 1];
  try {
    await anim.finished;
  } catch {
    // aborted
  } finally {
    if (options.fill === "forwards" || options.fill === "both") {
      commitKeyframe(layer, lastFrame);
    }
    anim.cancel();
  }
}

async function playAttackLunge(layer: HTMLElement, lungeTransform: string) {
  await animateLayer(
    layer,
    [{ transform: REST }, { transform: lungeTransform }],
    { duration: TIMING.lungeOut, easing: "cubic-bezier(0.22, 1, 0.36, 1)", fill: "forwards" }
  );
}

async function playReturnHome(layer: HTMLElement, lungeTransform: string) {
  await animateLayer(
    layer,
    [{ transform: lungeTransform }, { transform: REST }],
    { duration: TIMING.lungeBack, easing: "cubic-bezier(0.55, 0.06, 0.68, 0.19)", fill: "forwards" }
  );
  layer.style.removeProperty("transform");
}

async function playDefeated(layer: HTMLElement, lungeTransform: string) {
  const defeatedTransform = lungeTransform.replace(`scale(${LUNGE_SCALE})`, "scale(0.85)");
  await animateLayer(
    layer,
    [
      { opacity: 1, transform: lungeTransform },
      { opacity: 0, transform: defeatedTransform },
    ],
    { duration: TIMING.defeatFade, easing: "ease-in", fill: "forwards" }
  );
}

/**
 * Lane clash: attack lunge → life discount → return home OR defeated fade (hp === 0 only).
 */
export async function playLaneClash(
  playerId: string,
  enemyId: string,
  unitRefs: UnitRefs,
  onLifeDiscount: () => Promise<ClashImpactResult>
): Promise<ClashImpactResult> {
  const player = unitRefs.current[playerId];
  const enemy = unitRefs.current[enemyId];
  if (!player || !enemy) return { playerHp: 0, enemyHp: 0 };

  resetCombatVisuals(player);
  resetCombatVisuals(enemy);

  const playerLayer = getLayer(player);
  const enemyLayer = getLayer(enemy);
  const { player: pOffset, enemy: eOffset } = getSymmetricClashOffsets(player, enemy);
  const pLunge = `translate3d(${pOffset.x}px, ${pOffset.y}px, 0) scale(${LUNGE_SCALE})`;
  const eLunge = `translate3d(${eOffset.x}px, ${eOffset.y}px, 0) scale(${LUNGE_SCALE})`;

  player.classList.add("unit-card--combat-anim");
  enemy.classList.add("unit-card--combat-anim");

  let impactResult: ClashImpactResult = { playerHp: 1, enemyHp: 1 };

  try {
    await wait(TIMING.preClash);

    await Promise.all([playAttackLunge(playerLayer, pLunge), playAttackLunge(enemyLayer, eLunge)]);

    impactResult = await onLifeDiscount();
    await wait(TIMING.lifeDiscount);

    const playerDefeated = impactResult.playerHp === 0;
    const enemyDefeated = impactResult.enemyHp === 0;

    await Promise.all([
      playerDefeated ? playDefeated(playerLayer, pLunge) : playReturnHome(playerLayer, pLunge),
      enemyDefeated ? playDefeated(enemyLayer, eLunge) : playReturnHome(enemyLayer, eLunge),
    ]);
  } finally {
    player.classList.remove("unit-card--combat-anim");
    enemy.classList.remove("unit-card--combat-anim");
  }

  return impactResult;
}

/**
 * Single unit in a lane: faceoff → lunge to clash line → hold → return (unopposed nexus strike).
 */
export async function playUnopposedAttack(
  unitId: string,
  unitRefs: UnitRefs,
  onImpact?: () => Promise<void>
): Promise<void> {
  const unit = unitRefs.current[unitId];
  if (!unit) return;

  resetCombatVisuals(unit);

  const layer = getLayer(unit);
  const offset = getClashOffsetTowardCenter(unit);
  const lunge = `translate3d(${offset.x}px, ${offset.y}px, 0) scale(${LUNGE_SCALE})`;

  unit.classList.add("unit-card--combat-anim");

  try {
    await wait(TIMING.preClash);
    await playAttackLunge(layer, lunge);
    await onImpact?.();
    await wait(TIMING.lifeDiscount);
    await playReturnHome(layer, lunge);
  } finally {
    unit.classList.remove("unit-card--combat-anim");
  }
}
