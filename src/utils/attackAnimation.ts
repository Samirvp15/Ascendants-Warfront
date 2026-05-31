import type { RefObject } from "react";

type UnitRefs = RefObject<Record<string, HTMLDivElement | null>>;

export type ClashImpactResult = {
  playerDead: boolean;
  enemyDead: boolean;
};

const COMBAT_LAYER_SEL = ".unit-card-combat-layer";
const REST = "translate3d(0, 0, 0) scale(1)";

const TIMING = {
  /** Beat before both units lunge — facing each other in lane */
  preClash: 920,
  lungeOut: 300,
  /** Hold at impact while HP updates are visible */
  impactHold: 780,
  lungeBack: 280,
  defeatFade: 420,
} as const;

function getLayer(root: HTMLElement): HTMLElement {
  return root.querySelector<HTMLElement>(COMBAT_LAYER_SEL) ?? root;
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
    resetCombatVisuals(el);
    el.classList.remove("unit-card--combat-anim");
  }
}

function getLungeOffset(attacker: HTMLElement, target: HTMLElement, maxLunge = 40) {
  const a = attacker.getBoundingClientRect();
  const t = target.getBoundingClientRect();
  const dx = t.left + t.width / 2 - (a.left + a.width / 2);
  const dy = t.top + t.height / 2 - (a.top + a.height / 2);
  const dist = Math.hypot(dx, dy);
  if (dist === 0) return { x: 0, y: maxLunge };
  const scale = Math.min(maxLunge, dist * 0.38) / dist;
  return { x: dx * scale, y: dy * scale };
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
  try {
    await anim.finished;
  } catch {
    // aborted
  } finally {
    anim.cancel();
  }
}

async function fadeOutDefeated(layer: HTMLElement, atTransform: string) {
  await animateLayer(
    layer,
    [
      { opacity: 1, transform: atTransform, filter: "brightness(1)" },
      { opacity: 0, transform: `${atTransform.replace("scale(1.08)", "scale(0.72)")}`, filter: "brightness(0.6)" },
    ],
    { duration: TIMING.defeatFade, easing: "ease-in", fill: "forwards" }
  );
}

/**
 * One lane clash (left→right order handled by caller):
 * pause → simultaneous lunge → hold at impact while damage applies → return survivors / fade defeated.
 */
export async function playLaneClash(
  playerId: string,
  enemyId: string,
  unitRefs: UnitRefs,
  triggerHitEffect: (target: HTMLElement) => void,
  onImpactHold: () => Promise<ClashImpactResult>
): Promise<ClashImpactResult> {
  const player = unitRefs.current[playerId];
  const enemy = unitRefs.current[enemyId];
  if (!player || !enemy) return { playerDead: false, enemyDead: false };

  resetCombatVisuals(player);
  resetCombatVisuals(enemy);

  const playerLayer = getLayer(player);
  const enemyLayer = getLayer(enemy);
  const pOffset = getLungeOffset(player, enemy);
  const eOffset = getLungeOffset(enemy, player);
  const pLunge = `translate3d(${pOffset.x}px, ${pOffset.y}px, 0) scale(1.08)`;
  const eLunge = `translate3d(${eOffset.x}px, ${eOffset.y}px, 0) scale(1.08)`;

  player.classList.add("unit-card--combat-anim");
  enemy.classList.add("unit-card--combat-anim");

  let impactResult: ClashImpactResult = { playerDead: false, enemyDead: false };

  try {
    await wait(TIMING.preClash);

    await Promise.all([
      animateLayer(
        playerLayer,
        [
          { transform: REST, filter: "brightness(1)" },
          { transform: pLunge, filter: "brightness(1.35)" },
        ],
        { duration: TIMING.lungeOut, easing: "cubic-bezier(0.22, 1, 0.36, 1)", fill: "forwards" }
      ),
      animateLayer(
        enemyLayer,
        [
          { transform: REST, filter: "brightness(1)" },
          { transform: eLunge, filter: "brightness(1.35)" },
        ],
        { duration: TIMING.lungeOut, easing: "cubic-bezier(0.22, 1, 0.36, 1)", fill: "forwards" }
      ),
    ]);

    triggerHitEffect(player);
    triggerHitEffect(enemy);

    impactResult = await onImpactHold();
    await wait(TIMING.impactHold);

    const exits: Promise<void>[] = [];

    if (!impactResult.playerDead) {
      exits.push(
        animateLayer(
          playerLayer,
          [
            { transform: pLunge, filter: "brightness(1.35)" },
            { transform: REST, filter: "brightness(1)" },
          ],
          { duration: TIMING.lungeBack, easing: "cubic-bezier(0.55, 0.06, 0.68, 0.19)", fill: "forwards" }
        )
      );
    } else {
      exits.push(fadeOutDefeated(playerLayer, pLunge));
    }

    if (!impactResult.enemyDead) {
      exits.push(
        animateLayer(
          enemyLayer,
          [
            { transform: eLunge, filter: "brightness(1.35)" },
            { transform: REST, filter: "brightness(1)" },
          ],
          { duration: TIMING.lungeBack, easing: "cubic-bezier(0.55, 0.06, 0.68, 0.19)", fill: "forwards" }
        )
      );
    } else {
      exits.push(fadeOutDefeated(enemyLayer, eLunge));
    }

    await Promise.all(exits);
  } finally {
    if (!impactResult.playerDead && player.isConnected) resetCombatVisuals(player);
    if (!impactResult.enemyDead && enemy.isConnected) resetCombatVisuals(enemy);
    player.classList.remove("unit-card--combat-anim");
    enemy.classList.remove("unit-card--combat-anim");
  }

  return impactResult;
}
