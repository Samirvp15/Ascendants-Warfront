const SHOP_VFX_OVERLAY_ID = "shop-purchase-vfx-overlay";

function getOverlay(): HTMLElement {
  let overlay = document.getElementById(SHOP_VFX_OVERLAY_ID);
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.id = SHOP_VFX_OVERLAY_ID;
    overlay.className = "shop-purchase-vfx-overlay";
    overlay.setAttribute("aria-hidden", "true");
    document.body.appendChild(overlay);
  }
  return overlay;
}

export type ShopPurchaseTarget = "player" | "enemy";

function getDeckTarget(target: ShopPurchaseTarget): { x: number; y: number } {
  const selector = target === "player" ? ".hand-deck-zone__deck" : ".enemy-deck-zone__deck";
  const deck = document.querySelector(selector);
  if (!deck) {
    return target === "player"
      ? { x: window.innerWidth * 0.42, y: window.innerHeight * 0.82 }
      : { x: window.innerWidth * 0.5, y: window.innerHeight * 0.14 };
  }
  const rect = deck.getBoundingClientRect();
  if (target === "enemy") {
    const lastCard = deck.querySelector<HTMLElement>(".enemy-mystery-card:last-child");
    if (lastCard) {
      const cardRect = lastCard.getBoundingClientRect();
      return {
        x: cardRect.left + cardRect.width / 2,
        y: cardRect.top + cardRect.height / 2,
      };
    }
  }
  return {
    x: rect.left + rect.width * 0.5,
    y: rect.top + rect.height * (target === "player" ? 0.62 : 0.5),
  };
}

function getEnemyFlyCardSize(): { width: number; height: number } {
  const card = document.querySelector<HTMLElement>(".enemy-mystery-card");
  if (card) {
    const rect = card.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      return { width: rect.width, height: rect.height };
    }
  }
  return { width: 52, height: 76 };
}

async function animateAndRemove(el: HTMLElement, keyframes: Keyframe[], duration: number) {
  const anim = el.animate(keyframes, {
    duration,
    easing: "cubic-bezier(0.22, 1, 0.36, 1)",
    fill: "forwards",
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

function spawnShopBurst(overlay: HTMLElement, x: number, y: number) {
  const burst = document.createElement("div");
  burst.className = "shop-purchase-burst";
  burst.style.left = `${x}px`;
  burst.style.top = `${y}px`;
  overlay.appendChild(burst);

  void animateAndRemove(
    burst,
    [
      { opacity: 0, transform: "translate(-50%, -50%) scale(0.25)" },
      { opacity: 1, transform: "translate(-50%, -50%) scale(1)", offset: 0.2 },
      { opacity: 0, transform: "translate(-50%, -50%) scale(1.35)", offset: 1 },
    ],
    520
  );

  const ring = document.createElement("div");
  ring.className = "shop-purchase-ring";
  ring.style.left = `${x}px`;
  ring.style.top = `${y}px`;
  overlay.appendChild(ring);

  void animateAndRemove(
    ring,
    [
      { opacity: 0.9, transform: "translate(-50%, -50%) scale(0.4)" },
      { opacity: 0, transform: "translate(-50%, -50%) scale(1.6)", offset: 1 },
    ],
    640
  );
}

async function flyCardToDeck(
  overlay: HTMLElement,
  from: { x: number; y: number },
  to: { x: number; y: number },
  cardArtSrc: string,
  target: ShopPurchaseTarget
) {
  const ghost = document.createElement("div");
  ghost.className = "shop-purchase-fly";
  if (target === "enemy") {
    const size = getEnemyFlyCardSize();
    ghost.style.width = `${size.width}px`;
    ghost.style.height = `${size.height}px`;
  }
  ghost.style.left = `${from.x}px`;
  ghost.style.top = `${from.y}px`;
  const isMystery = cardArtSrc.includes("mystery_card");
  ghost.innerHTML = `
    <img src="${cardArtSrc}" alt="" draggable="false" class="shop-purchase-fly__img${isMystery ? " shop-purchase-fly__img--mystery" : ""}" />
    <span class="shop-purchase-fly__shine" aria-hidden="true"></span>
  `;
  overlay.appendChild(ghost);

  const midX = (from.x + to.x) / 2;
  const midY =
    target === "player" ? Math.min(from.y, to.y) - 72 : Math.max(from.y, to.y) + 64;

  await animateAndRemove(
    ghost,
    [
      {
        opacity: 0,
        transform: "translate(-50%, -50%) scale(0.35) rotate(-8deg)",
        offset: 0,
      },
      {
        opacity: 1,
        transform: `translate(calc(-50% + ${midX - from.x}px), calc(-50% + ${midY - from.y}px)) scale(0.85) rotate(4deg)`,
        offset: 0.42,
      },
      {
        opacity: 1,
        transform: `translate(calc(-50% + ${to.x - from.x}px), calc(-50% + ${to.y - from.y}px)) scale(0.72) rotate(0deg)`,
        offset: 0.88,
      },
      {
        opacity: 0,
        transform: `translate(calc(-50% + ${to.x - from.x}px), calc(-50% + ${to.y - from.y}px)) scale(0.55) rotate(0deg)`,
        offset: 1,
      },
    ],
    680
  );
}

/** Purchase burst at shop slot + card flies toward the target deck. */
export async function playShopPurchaseVfx(
  sourceRect: DOMRect,
  cardArtSrc: string,
  target: ShopPurchaseTarget = "player"
): Promise<void> {
  const overlay = getOverlay();
  const from = {
    x: sourceRect.left + sourceRect.width / 2,
    y: sourceRect.top + sourceRect.height / 2,
  };
  const to = getDeckTarget(target);

  spawnShopBurst(overlay, from.x, from.y);
  await flyCardToDeck(overlay, from, to, cardArtSrc, target);
}

export function clearShopPurchaseVfx() {
  const overlay = document.getElementById(SHOP_VFX_OVERLAY_ID);
  if (overlay) overlay.innerHTML = "";
}
