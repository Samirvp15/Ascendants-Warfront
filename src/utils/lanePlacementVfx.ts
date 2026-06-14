const PLACEMENT_VFX_OVERLAY_ID = "lane-placement-vfx-overlay";

const FLY_START_SCALE = 0.32;
const FLY_DURATION_MS = { player: 400, enemy: 480 } as const;
const LANDING_BURST_MS = { player: 260, enemy: 360 } as const;
const FLY_EASING = {
  player: "cubic-bezier(0.33, 0, 0.2, 1)",
  enemy: "cubic-bezier(0.25, 0.46, 0.45, 0.94)",
} as const;
/** Brief buffer after placement VFX before combat clash */
export const UNIT_PLACED_SETTLE_MS = 160;

export type LanePlacementSide = "player" | "enemy";

export type LanePlacementVfxOptions = {
  side: LanePlacementSide;
  lane: number;
  cardArtSrc: string;
  /** Fires when the fly ghost reaches the lane (before landing burst). */
  onLand?: () => void;
};

let pendingPlacements = 0;
const idleWaiters: Array<() => void> = [];

function markPlacementStart() {
  pendingPlacements++;
}

function markPlacementEnd() {
  pendingPlacements = Math.max(0, pendingPlacements - 1);
  if (pendingPlacements === 0) {
    idleWaiters.splice(0).forEach((resolve) => resolve());
  }
}

function delay(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

export function waitForPlacementVfxIdle(): Promise<void> {
  if (pendingPlacements === 0) return Promise.resolve();
  return new Promise((resolve) => idleWaiters.push(resolve));
}

/** Wait until every in-flight placement VFX finishes, then unit slam settle time. */
export async function waitForPlacementAnimationsComplete(): Promise<void> {
  await waitForPlacementVfxIdle();
  if (UNIT_PLACED_SETTLE_MS > 0) {
    await delay(UNIT_PLACED_SETTLE_MS);
  }
}

function getOverlay(): HTMLElement {
  let overlay = document.getElementById(PLACEMENT_VFX_OVERLAY_ID);
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.id = PLACEMENT_VFX_OVERLAY_ID;
    overlay.className = "lane-placement-vfx-overlay";
    overlay.setAttribute("aria-hidden", "true");
    document.body.appendChild(overlay);
  }
  return overlay;
}

function getLaneSlotCenter(side: LanePlacementSide, lane: number): { x: number; y: number } | null {
  const slot = document.querySelector<HTMLElement>(
    `[data-lane-slot="${side}"][data-lane-index="${lane}"]`
  );
  if (!slot) return null;
  const rect = slot.getBoundingClientRect();
  return {
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2,
  };
}

/** Full lane slot size — ghost scales up to this (scale 1) at destination. */
function getLaneSlotFlySize(side: LanePlacementSide, lane: number): { width: number; height: number } {
  const slot = document.querySelector<HTMLElement>(
    `[data-lane-slot="${side}"][data-lane-index="${lane}"]`
  );
  if (slot) {
    const rect = slot.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      return { width: rect.width, height: rect.height };
    }
  }
  return { width: 72, height: 96 };
}

function getPlacementSource(side: LanePlacementSide): { x: number; y: number } {
  const selector = side === "enemy" ? ".enemy-deck-zone__deck" : ".hand-deck-zone__deck";
  const deck = document.querySelector<HTMLElement>(selector);
  if (deck) {
    const rect = deck.getBoundingClientRect();
    return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
  }

  return side === "enemy"
    ? { x: window.innerWidth * 0.5, y: window.innerHeight * 0.12 }
    : { x: window.innerWidth * 0.42, y: window.innerHeight * 0.82 };
}

async function animateAndRemove(
  el: HTMLElement,
  keyframes: Keyframe[],
  duration: number,
  easing = "cubic-bezier(0.22, 1, 0.36, 1)",
  onComplete?: () => void
) {
  const anim = el.animate(keyframes, {
    duration,
    easing,
    fill: "forwards",
  });
  try {
    await anim.finished;
  } catch {
    // aborted
  } finally {
    onComplete?.();
    anim.cancel();
    el.remove();
  }
}

async function spawnLandingBurst(
  overlay: HTMLElement,
  x: number,
  y: number,
  side: LanePlacementSide
): Promise<void> {
  const burstMs = LANDING_BURST_MS[side];
  const burst = document.createElement("div");
  burst.className = `lane-placement-burst lane-placement-burst--${side}`;
  burst.style.left = `${x}px`;
  burst.style.top = `${y}px`;
  overlay.appendChild(burst);

  const ring = document.createElement("div");
  ring.className = `lane-placement-ring lane-placement-ring--${side}`;
  ring.style.left = `${x}px`;
  ring.style.top = `${y}px`;
  overlay.appendChild(ring);

  const flash = document.createElement("div");
  flash.className = `lane-placement-flash lane-placement-flash--${side}`;
  flash.style.left = `${x}px`;
  flash.style.top = `${y}px`;
  overlay.appendChild(flash);

  await Promise.all([
    animateAndRemove(
      burst,
      [
        { opacity: 0, transform: "translate(-50%, -50%) scale(0.2)" },
        { opacity: 1, transform: "translate(-50%, -50%) scale(1)", offset: 0.22 },
        { opacity: 0, transform: "translate(-50%, -50%) scale(1.25)", offset: 1 },
      ],
      burstMs
    ),
    animateAndRemove(
      ring,
      [
        { opacity: 0.95, transform: "translate(-50%, -50%) scale(0.35)" },
        { opacity: 0, transform: "translate(-50%, -50%) scale(1.35)", offset: 1 },
      ],
      burstMs + 30
    ),
    animateAndRemove(
      flash,
      [
        { opacity: 0.85, transform: "translate(-50%, -50%) scale(0.5)" },
        { opacity: 0, transform: "translate(-50%, -50%) scale(1.05)", offset: 1 },
      ],
      Math.min(220, burstMs)
    ),
  ]);
}

async function flyCardToLane(
  overlay: HTMLElement,
  from: { x: number; y: number },
  to: { x: number; y: number },
  cardArtSrc: string,
  side: LanePlacementSide,
  lane: number,
  onReach?: () => void
) {
  const size = getLaneSlotFlySize(side, lane);
  const isMystery = cardArtSrc.includes("mystery_card");
  const imgClass = isMystery
    ? "lane-placement-fly__img lane-placement-fly__img--mystery"
    : "lane-placement-fly__img lane-placement-fly__img--front";

  const ghost = document.createElement("div");
  ghost.className = `lane-placement-fly lane-placement-fly--${side}`;
  ghost.style.width = `${size.width}px`;
  ghost.style.height = `${size.height}px`;
  ghost.style.left = `${from.x}px`;
  ghost.style.top = `${from.y}px`;
  ghost.innerHTML = `
    <img src="${cardArtSrc}" alt="" draggable="false" class="${imgClass}" />
    <span class="lane-placement-fly__trail" aria-hidden="true"></span>
  `;
  overlay.appendChild(ghost);

  const midX = (from.x + to.x) / 2;
  const arcLift = side === "player" ? -32 : 40;
  const midY = (from.y + to.y) / 2 + arcLift;
  const midScale = FLY_START_SCALE + (1 - FLY_START_SCALE) * 0.58;
  const atDestination = `translate(calc(-50% + ${to.x - from.x}px), calc(-50% + ${to.y - from.y}px)) scale(1)`;
  const midTransform = `translate(calc(-50% + ${midX - from.x}px), calc(-50% + ${midY - from.y}px)) scale(${midScale})`;

  const keyframes: Keyframe[] =
    side === "player"
      ? [
          {
            opacity: 0.92,
            transform: `translate(-50%, -50%) scale(${FLY_START_SCALE})`,
            offset: 0,
          },
          {
            opacity: 1,
            transform: midTransform,
            offset: 0.58,
          },
          {
            opacity: 1,
            transform: atDestination,
            offset: 1,
          },
        ]
      : [
          {
            opacity: 0.8,
            transform: `translate(-50%, -50%) scale(${FLY_START_SCALE})`,
            offset: 0,
          },
          {
            opacity: 1,
            transform: midTransform,
            offset: 0.52,
          },
          {
            opacity: 1,
            transform: atDestination,
            offset: 0.88,
          },
          {
            opacity: 0,
            transform: atDestination,
            offset: 1,
          },
        ];

  await animateAndRemove(
    ghost,
    keyframes,
    FLY_DURATION_MS[side],
    FLY_EASING[side],
    onReach
  );
}

/** Card flies from hand/deck into a lane slot, then a landing burst plays. */
export async function playLanePlacementVfx(options: LanePlacementVfxOptions): Promise<void> {
  const { side, lane, cardArtSrc, onLand } = options;
  const to = getLaneSlotCenter(side, lane);
  if (!to) return;

  const from = getPlacementSource(side);
  const overlay = getOverlay();

  markPlacementStart();
  try {
    await flyCardToLane(overlay, from, to, cardArtSrc, side, lane, onLand);
    if (side === "player") {
      void spawnLandingBurst(overlay, to.x, to.y, side);
    } else {
      await spawnLandingBurst(overlay, to.x, to.y, side);
    }
  } finally {
    markPlacementEnd();
  }
}

export function clearLanePlacementVfx() {
  const overlay = document.getElementById(PLACEMENT_VFX_OVERLAY_ID);
  if (overlay) overlay.innerHTML = "";
  pendingPlacements = 0;
  idleWaiters.splice(0).forEach((resolve) => resolve());
}
