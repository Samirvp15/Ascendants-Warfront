const SHOP_REFRESH_OVERLAY_ID = "shop-refresh-vfx-overlay";

function getOverlay(): HTMLElement {
  let overlay = document.getElementById(SHOP_REFRESH_OVERLAY_ID);
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.id = SHOP_REFRESH_OVERLAY_ID;
    overlay.className = "shop-refresh-vfx-overlay";
    overlay.setAttribute("aria-hidden", "true");
    document.body.appendChild(overlay);
  }
  return overlay;
}

function getGrid(): HTMLElement | null {
  return document.querySelector(".main-deck-grid");
}

function getRefreshButton(): HTMLElement | null {
  return document.querySelector(".shop-refresh-btn");
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

function spawnRefreshBurst(overlay: HTMLElement, x: number, y: number) {
  const burst = document.createElement("div");
  burst.className = "shop-refresh-burst";
  burst.style.left = `${x}px`;
  burst.style.top = `${y}px`;
  overlay.appendChild(burst);

  void animateAndRemove(
    burst,
    [
      { opacity: 0, transform: "translate(-50%, -50%) scale(0.2)" },
      { opacity: 1, transform: "translate(-50%, -50%) scale(1)", offset: 0.25 },
      { opacity: 0, transform: "translate(-50%, -50%) scale(1.45)", offset: 1 },
    ],
    560
  );

  const ring = document.createElement("div");
  ring.className = "shop-refresh-ring";
  ring.style.left = `${x}px`;
  ring.style.top = `${y}px`;
  overlay.appendChild(ring);

  void animateAndRemove(
    ring,
    [
      { opacity: 0.85, transform: "translate(-50%, -50%) scale(0.35)" },
      { opacity: 0, transform: "translate(-50%, -50%) scale(1.75)", offset: 1 },
    ],
    680
  );
}

function waitFrames(count = 2): Promise<void> {
  return new Promise((resolve) => {
    let remaining = count;
    const step = () => {
      remaining -= 1;
      if (remaining <= 0) resolve();
      else requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  });
}

async function animateCardsIn(cards: HTMLElement[]) {
  if (cards.length === 0) return;

  cards.forEach((card) => {
    card.style.opacity = "0";
    card.style.transform = "scale(0.45) rotateY(-72deg)";
  });

  await Promise.all(
    cards.map(
      (card, index) =>
        new Promise<void>((resolve) => {
          const anim = card.animate(
            [
              { opacity: 0, transform: "scale(0.45) rotateY(-72deg)" },
              { opacity: 1, transform: "scale(1.06) rotateY(8deg)", offset: 0.72 },
              { opacity: 1, transform: "scale(1) rotateY(0deg)" },
            ],
            {
              duration: 460,
              delay: index * 65,
              easing: "cubic-bezier(0.22, 1, 0.36, 1)",
              fill: "forwards",
            }
          );
          anim.onfinish = () => {
            card.style.opacity = "";
            card.style.transform = "";
            anim.cancel();
            resolve();
          };
          anim.oncancel = () => {
            card.style.opacity = "";
            card.style.transform = "";
            resolve();
          };
        })
    )
  );
}

export function clearShopCardInlineStyles() {
  document.querySelectorAll<HTMLElement>("[data-shop-entry]").forEach((el) => {
    el.getAnimations().forEach((anim) => anim.cancel());
    el.style.opacity = "";
    el.style.transform = "";
  });
}

/** Refill shop, then deal new cards in with a golden burst. */
export async function playShopRefreshVfx(onRefill: () => void): Promise<void> {
  const grid = getGrid();
  if (!grid) {
    onRefill();
    return;
  }

  clearShopCardInlineStyles();

  const overlay = getOverlay();
  const gridRect = grid.getBoundingClientRect();
  const center = {
    x: gridRect.left + gridRect.width * 0.5,
    y: gridRect.top + gridRect.height * 0.5,
  };

  const refreshBtn = getRefreshButton();
  refreshBtn?.classList.add("shop-refresh-btn--spinning");
  grid.classList.add("main-deck-grid--refreshing");

  spawnRefreshBurst(overlay, center.x, center.y);
  onRefill();
  await waitFrames(2);

  const newCards = Array.from(grid.querySelectorAll<HTMLElement>("[data-shop-entry]"));
  await animateCardsIn(newCards);

  grid.classList.remove("main-deck-grid--refreshing");
  refreshBtn?.classList.remove("shop-refresh-btn--spinning");
}

export function clearShopRefreshVfx() {
  const overlay = document.getElementById(SHOP_REFRESH_OVERLAY_ID);
  if (overlay) overlay.innerHTML = "";

  clearShopCardInlineStyles();
  document.querySelector(".main-deck-grid")?.classList.remove("main-deck-grid--refreshing");
  document.querySelector(".shop-refresh-btn")?.classList.remove("shop-refresh-btn--spinning");
}
