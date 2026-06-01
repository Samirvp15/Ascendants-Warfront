const VFX_IMAGES = {
  burst: "/images/vfx/vfx_clash_burst_v2.png",
  slash: "/images/vfx/vfx_clash_slash_v2.png",
  sparks: "/images/vfx/vfx_attack_sparks_v2.png",
} as const;

const VFX_OVERLAY_ID = "lane-vfx-overlay";

/** Stacked layers — each effect sits above the previous within the global overlay. */
const VFX_LAYERS = {
  flash: 1,
  burst: 2,
  sparks: 3,
  slash: 4,
} as const;

export type LaneVfxVariant = "clash" | "strike";

function getLaneClashCenter(unit: HTMLElement): { x: number; y: number } {
  const lane = unit.closest(".absolute-frame-anchor");
  if (lane) {
    const divider = lane.querySelector(".lane-clash-line");
    if (divider) {
      const rect = divider.getBoundingClientRect();
      return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    }
    const rect = lane.getBoundingClientRect();
    return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
  }
  const rect = unit.getBoundingClientRect();
  return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
}

function getVfxOverlay(): HTMLElement {
  let overlay = document.getElementById(VFX_OVERLAY_ID);
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.id = VFX_OVERLAY_ID;
    overlay.className = "lane-vfx-overlay";
    overlay.setAttribute("aria-hidden", "true");
    document.body.appendChild(overlay);
  }
  return overlay;
}

function placeAtViewportPoint(el: HTMLElement, x: number, y: number, layer: number) {
  el.style.position = "fixed";
  el.style.left = `${x}px`;
  el.style.top = `${y}px`;
  el.style.zIndex = String(layer);
}

async function animateVfxElement(
  el: HTMLElement,
  keyframes: Keyframe[],
  duration: number,
  delay = 0
) {
  const anim = el.animate(keyframes, {
    duration,
    delay,
    easing: "cubic-bezier(0.22, 1, 0.28, 1)",
    fill: "both",
  });
  try {
    await anim.finished;
  } catch {
    // aborted
  } finally {
    anim.cancel();
    el.remove();
  }
}

function expandKeyframes(
  peakScale: number,
  endScale: number,
  peakOpacity: number
): Keyframe[] {
  return [
    { opacity: 0, transform: "translate(-50%, -50%) scale(0.08)" },
    {
      opacity: peakOpacity,
      transform: `translate(-50%, -50%) scale(${peakScale * 0.38})`,
      offset: 0.16,
    },
    {
      opacity: peakOpacity * 0.9,
      transform: `translate(-50%, -50%) scale(${peakScale * 0.68})`,
      offset: 0.38,
    },
    {
      opacity: peakOpacity * 0.45,
      transform: `translate(-50%, -50%) scale(${endScale})`,
      offset: 0.68,
    },
    { opacity: 0, transform: `translate(-50%, -50%) scale(${endScale * 1.04})`, offset: 1 },
  ];
}

async function spawnBurst(
  host: HTMLElement,
  x: number,
  y: number,
  baseSize: number,
  duration: number,
  expand: number,
  delayMs = 0
) {
  const img = document.createElement("img");
  img.src = VFX_IMAGES.burst;
  img.alt = "";
  img.draggable = false;
  img.className = "lane-vfx lane-vfx--burst";
  img.style.width = `${baseSize}px`;
  img.style.height = `${baseSize}px`;
  placeAtViewportPoint(img, x, y, VFX_LAYERS.burst);
  host.appendChild(img);

  await animateVfxElement(
    img,
    expandKeyframes(expand * 0.58, expand * 0.72, 0.88),
    duration,
    delayMs
  );
}

async function spawnSlashHalf(
  host: HTMLElement,
  x: number,
  y: number,
  baseSize: number,
  duration: number,
  sideTravel: number,
  peakScale: number,
  flip: boolean
) {
  const wrap = document.createElement("div");
  wrap.className = "lane-vfx-slash-wrap";
  wrap.style.width = `${baseSize}px`;
  wrap.style.height = `${baseSize}px`;
  placeAtViewportPoint(wrap, x, y, VFX_LAYERS.slash);

  const img = document.createElement("img");
  img.src = VFX_IMAGES.slash;
  img.alt = "";
  img.draggable = false;
  img.className = cnSlashClass(flip);
  wrap.appendChild(img);
  host.appendChild(wrap);

  const fadeDelay = Math.round(duration * 0.48);
  wrap.style.setProperty("--slash-fade-ms", `${Math.round(duration * 0.52)}ms`);
  wrap.style.animationDelay = `${fadeDelay}ms`;

  await animateVfxElement(
    wrap,
    [
      {
        opacity: 0,
        transform: `translate(calc(-50% + 0px), -50%) scale(0.12) rotate(${flip ? 14 : -14}deg)`,
      },
      {
        opacity: 0.95,
        transform: `translate(calc(-50% + ${sideTravel * 0.06}px), -50%) scale(${peakScale * 0.42}) rotate(${flip ? 6 : -6}deg)`,
        offset: 0.14,
      },
      {
        opacity: 0.82,
        transform: `translate(calc(-50% + ${sideTravel * 0.52}px), -50%) scale(${peakScale * 0.72}) rotate(${flip ? 2 : -2}deg)`,
        offset: 0.48,
      },
      {
        opacity: 0.55,
        transform: `translate(calc(-50% + ${sideTravel * 0.88}px), -50%) scale(${peakScale * 0.92}) rotate(0deg)`,
        offset: 0.72,
      },
      {
        opacity: 0,
        transform: `translate(calc(-50% + ${sideTravel}px), -50%) scale(${peakScale}) rotate(0deg)`,
        offset: 1,
      },
    ],
    duration
  );
}

function cnSlashClass(flip: boolean) {
  return flip ? "lane-vfx lane-vfx--slash lane-vfx--slash-flip" : "lane-vfx lane-vfx--slash";
}

async function spawnSlash(
  host: HTMLElement,
  x: number,
  y: number,
  baseSize: number,
  duration: number,
  expand: number
) {
  const sideTravel = baseSize * expand * 0.27;
  const peakScale = expand * 0.24;

  await Promise.all([
    spawnSlashHalf(host, x, y, baseSize, duration, -sideTravel, peakScale, false),
    spawnSlashHalf(host, x, y, baseSize, duration, sideTravel, peakScale, true),
  ]);
}

async function spawnSparks(
  host: HTMLElement,
  x: number,
  y: number,
  baseSize: number,
  duration: number,
  expand: number
) {
  const img = document.createElement("img");
  img.src = VFX_IMAGES.sparks;
  img.alt = "";
  img.draggable = false;
  img.className = "lane-vfx lane-vfx--sparks";
  img.style.width = `${baseSize}px`;
  img.style.height = `${baseSize}px`;
  placeAtViewportPoint(img, x, y, VFX_LAYERS.sparks);
  host.appendChild(img);

  await animateVfxElement(img, expandKeyframes(expand * 0.78, expand * 0.95, 0.82), duration + 60);
}

async function spawnFlash(host: HTMLElement, x: number, y: number, baseSize: number, expand: number) {
  const flash = document.createElement("div");
  flash.className = "lane-vfx-flash";
  flash.style.width = `${baseSize}px`;
  flash.style.height = `${baseSize}px`;
  placeAtViewportPoint(flash, x, y, VFX_LAYERS.flash);
  host.appendChild(flash);

  await animateVfxElement(flash, expandKeyframes(expand * 0.55, expand * 0.72, 0.75), 560);
}

function getViewportExpandFactor(originX: number, originY: number, variant: LaneVfxVariant): number {
  const corners = [
    { x: 0, y: 0 },
    { x: window.innerWidth, y: 0 },
    { x: 0, y: window.innerHeight },
    { x: window.innerWidth, y: window.innerHeight },
  ];
  const maxDist = Math.max(...corners.map((c) => Math.hypot(c.x - originX, c.y - originY)));
  const base = 96;
  const multiplier = variant === "clash" ? 0.95 : 0.78;
  return (maxDist * multiplier) / base;
}

/** Full-screen overlay VFX: starts at clash point, expands over the page, fades out. */
export async function playLaneImpactVfx(
  unit: HTMLElement,
  variant: LaneVfxVariant = "clash"
): Promise<void> {
  const host = getVfxOverlay();
  const point = getLaneClashCenter(unit);
  const expand = getViewportExpandFactor(point.x, point.y, variant);
  const baseSize = variant === "clash" ? 56 : 48;
  const duration = variant === "clash" ? 680 : 600;
  const burstDelay = variant === "clash" ? 40 : 30;

  await Promise.all([
    spawnFlash(host, point.x, point.y, baseSize, expand),
    spawnBurst(host, point.x, point.y, baseSize * 0.82, duration, expand, burstDelay),
    spawnSlash(host, point.x, point.y, baseSize * 0.76, duration - 40, expand),
    spawnSparks(host, point.x, point.y, baseSize * 0.98, duration, expand),
  ]);
}

export function clearAllLaneVfx() {
  const overlay = document.getElementById(VFX_OVERLAY_ID);
  if (overlay) overlay.innerHTML = "";

  document.querySelectorAll(".lane-vfx-layer").forEach((layer) => {
    layer.innerHTML = "";
  });
}
