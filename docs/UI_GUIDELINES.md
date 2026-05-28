# Ascendants Warfront — UI Guidelines

This document is the **primary visual and layout reference** for all UI work on the project. Every screen change should move the live game closer to the mockup below.

---

## Reference mockup (target UI)

**File:** `public/images/referenceGame.png`

![UI reference mockup — target layout and visual style](../public/images/referenceGame.png)

> Keep this image open while developing. When in doubt about placement, framing, or tone, match the mockup first — then align with the mechanics in [GAME_GUIDE.md](./GAME_GUIDE.md).

---

## Design vision

| Aspect | Direction |
|--------|-----------|
| **Genre feel** | Dark fantasy / medieval warfare |
| **Mood** | Burning castle siege — gritty, high stakes, tactile |
| **UI shell** | Ornate stone and weathered metal frames, spikes, chains, rivets |
| **Readability** | Strong contrast on stats; glow on interactive and damage states |
| **Platform** | **PC / laptop only** — fixed desktop layout (≥1280×720). No mobile optimization. |

The mockup title reads **"Lane Clash"** — that is the in-game product name shown in the header until rebranded to Ascendants Warfront.

---

## Viewport layout (no page scroll)

The game must fit entirely within the browser window **without vertical scrolling**.

### Rules

1. **Root shell:** `.game-shell.game-layout` uses `100vh × 100vw`, **no outer padding**.
2. **`html`, `body`, `#root`:** `height: 100%` and `overflow: hidden`.
3. **CSS variables** in `.game-layout` derive sizes from PNG aspect ratios (see `src/utils/layoutTokens.ts`).
4. **Background-image panels:** `<img>` + `aspect-ratio` matching the PNG + absolute % overlays.
5. **No gaps** between main sections — shop flush to right edge, arena centered in play column.

### Layout stack

```
┌─ game-shell (100vw × 100vh, zero padding) ────────────────────────┐
│  HEADER  h = var(--header-h)                                      │
│  ┌─ play column ──────────────┬─ shop  w = var(--shop-w) ──────┐│
│  │   centered arena block      │  main_deck.png (379×658 AR)     ││
│  │   w = var(--arena-w)        │  full main height               ││
│  │   enemy_strip (774×322 AR)  │                                 ││
│  │   lanes flex-1 (min 36%)    │                                 ││
│  │   hand_deck (657×380 AR)    │                                 ││
│  └─────────────────────────────┴─────────────────────────────────┘│
└───────────────────────────────────────────────────────────────────┘
```

### CSS size formulas (`.game-layout`)

| Token | Formula |
|-------|---------|
| `--header-h` | `clamp(112px, 14vh, 158px)` |
| `--main-h` | `100vh - header-h` |
| `--shop-w` | `main-h × (379÷658)` — main deck PNG width |
| `--shop-w` | `min(20vw, 260px, main-h × 379÷658)` — compact main deck |
| `--play-w` | `100vw - shop-w` |
| `--arena-w` | `min(play-w × 0.78, 860px)` — centered enemy/lanes/hand block |
| `--enemy-h` | `min(arena-w × 322÷774, main-h × 0.20)` |
| `--hand-h` | `min(arena-w × 380÷657, main-h × 0.26)` |

The arena (enemy strip, lanes, hand deck) is **horizontally centered** in the play area. Lanes fill remaining height between the strips.

---

## Screen layout

The battlefield is a **two-column grid** (battlefield + Main Deck shop). How It Works lives in the header (left).

```
┌─────────────────────────────────────────────────────────────────┐
│  HEADER — How It Works (left) | Logo (center) | controls (R)  │
├──────────────────────────────┬──────────────────────────────────┤
│  ENEMY STRIP                 │                                  │
├──────────────────────────────┤   MAIN DECK (shop)               │
│  LANE 1  │  LANE 2  │ LANE 3 │   mystery backs + Refresh        │
│  enemy   │  enemy   │ enemy  │                                  │
│  ────────┼──────────┼─────── │                                  │
│  player  │  player  │ player │                                  │
├──────────────────────────────┤                                  │
│  PLAYER HAND DECK (PNG frame)│                                  │
└──────────────────────────────┴──────────────────────────────────┘
```

### Zone responsibilities

| Zone | Reference behavior | Implementation notes |
|------|-------------------|----------------------|
| **Header** | Logo center; round + main deck count; gold pill; New Match / Reset All | `GameHeader.tsx` — height `var(--header-h)`; How It Works uses PNG aspect ratio |
| **Enemy strip** | Demon avatar, deck count, mana/nexus over PNG orbs | `enemy_strip.png` + absolute overlays — see below |
| **Lanes (×3)** | Tall vertical frames; "Lane N" label; unit cards inside; combat `-N` overlays | Each lane uses `main_deck.png` as full background (`object-fill`); `flex-1 min-h-0` |
| **Player hand deck** | PNG frame with mana/nexus orbs, hand row, **STRIKE** bottom-right | See **Background-image panels** below |
| **How It Works** | Stone scroll panel in header left | Background: `how_it_works.png`; text overlays absolute |
| **Main Deck** | Right vertical shop; 4 face-down cards with gold price; Refresh below | Target: `main_deck.png` frame (same absolute overlay pattern) |

---

## Background-image panels (absolute overlay pattern)

Any UI panel backed by a PNG frame asset must follow this pattern:

```tsx
<div className="relative w-full" style={{ aspectRatio: "774 / 322" }}>
  <img src="/images/panel.png" className="absolute inset-0 h-full w-full object-fill" />
  <div className="absolute" style={{ left: "10%", top: "30%" }}>{/* overlay */}</div>
</div>
```

**Do not** use the PNG as a CSS `background-image` with padding to align children — percentage-based `absolute` positions scale correctly with the fixed panel size.

### Player hand deck — `hand_deck_player.png`

**File:** `public/images/hand_deck_player.png`  
**Panel width:** `var(--arena-w)`  
**Height:** auto from `aspect-ratio: 657 / 380`

| Overlay | Position | Content |
|---------|----------|---------|
| Mana text | `left: 7%`, `top: 9%` | `◆ current/max` over blue orb |
| Nexus text | `right: 7%`, `top: 9%` | `♥ current/max` over red heart |
| Status hints | `left: 50%`, `top: 8%` | Selected card, moving, deck warnings |
| Hand cards | `left: 10%`, `right: 18%`, `top: 30%`, `bottom: 14%` | Flex row, `items-end justify-center`, gap `10px` |
| STRIKE button | `right: 2.5%`, `bottom: 6%` | Compact circular fire button |

**Hand card size (compact):** `72 × 104 px` — large enough to read stats inside the stone basin.

### Enemy strip — `enemy_strip.png`

**File:** `public/images/enemy_strip.png`  
**Panel width:** `var(--arena-w)` (centered in play column)  
**Height:** auto from `aspect-ratio: 774 / 322`

| Overlay | Position | Content |
|---------|----------|---------|
| Portrait | `left: 1.2%`, centered vertically | 👹 enemy avatar |
| Label | `left: 12.5%`, `top: 22%` | "Enemy" + deck count |
| Mana text | `left: 6.5%`, `bottom: 18%` | `◆ current/max` on blue droplet |
| Nexus text | `right: 6.5%`, `bottom: 18%` | `♥ current/max` on red heart |

### How It Works — `how_it_works.png`

**File:** `public/images/how_it_works.png`  
Header-left panel; rule text positioned with absolute coordinates inside the frame.

### Main Deck — `main_deck.png`

**File:** `public/images/main_deck.png`  
Full height `var(--main-h)`, width `var(--shop-w)` = `main-h × (379÷658)`. Flush to right screen edge.

| Overlay | Position | Content |
|---------|----------|---------|
| Title | `left: 8%`, `right: 8%`, `top: 3%` | Main Deck + pool count |
| Shop slots | `left: 10%`, `right: 10%`, `top: 12%`, `bottom: 16%` | 4 compact mystery cards |
| Refresh | `left: 10%`, `right: 10%`, `bottom: 4%` | Refresh button |

---

## Color palette

Extract from the reference and use consistently:

| Token | Role | Reference | Suggested hex |
|-------|------|-----------|---------------|
| `--bg-deep` | Page backdrop | Burning castle sky | `#0a0a0f` |
| `--frame-stone` | Panel / lane borders | Dark carved stone | `#2a2520` |
| `--frame-metal` | Card frames, buttons | Iron + bronze trim | `#4a4035` / `#8b6914` |
| `--mana` | Mana bar, cost gems | Cool blue glow | `#3b82f6` → `#1d4ed8` |
| `--nexus` | Health / nexus bars | Blood red | `#dc2626` → `#7f1d1d` |
| `--gold` | Currency, highlights | Warm amber | `#f59e0b` |
| `--fire` | STRIKE button, torches | Orange flame | `#f97316` → `#ea580c` |
| `--damage` | Combat numbers | Bright red pop | `#ef4444` |
| `--text-primary` | Titles, stats | Off-white | `#f1f5f9` |
| `--text-muted` | Rules, labels | Warm gray | `#94a3b8` |

**Enemy units:** rose/red tint overlay on card art.  
**Player units:** sky/blue tint overlay — keeps sides readable at a glance.

---

## Typography

| Use | Style in reference | Guideline |
|-----|-------------------|-----------|
| Game title | Bold serif, metallic | Large, centered, slight letter-spacing |
| Lane labels | Small caps, tracked | `LANE 1`, `LANE 2`, `LANE 3` |
| Card names | Gothic / fantasy serif on nameplate | Upper third of card, on stone plaque |
| Card stats | Bold sans, high contrast | Bottom corners in colored shields (⚔ left, ♥ right) |
| Rules panel | Decorative but legible | 10–12px body; amber/gold section headers |
| Buttons | Bold caps | `STRIKE`, `REFRESH`, `NEW MATCH` |

Fonts in use: **Cinzel** (display/titles) + **Inter** (stats, buttons).

---

## Components

### 1. Card (hand & board)

Target anatomy from the reference:

```
┌─────────────────────┐
│ ◆3              TYPE│  ← mana cost (top-left), type badge (top-right)
│                     │
│    [illustration]   │  ← full-bleed art from /images/card_{id}.jpg
│                     │
│ ┌─────────────────┐ │
│ │   CARD NAME     │ │  ← stone nameplate
│ └─────────────────┘ │
│ ⚔3            ♥2   │  ← attack (amber), health (green/red)
└─────────────────────┘
   ornate metal frame
```

**Hand (compact):** 72×104 px inside player hand deck panel.  
**Board:** Full card chrome in lanes.

**Assets:** `public/images/card_{id}.jpg` for each unit id (`scout`, `acolyte`, …).

### 2. Lane frame

- Vertical rectangle; grows with available flex space (`flex-1 min-h-0`).
- Background: `main_deck.png` per lane (`object-fill`, same asset as shop panel).
- Lane label centered at top with drop shadow for readability.
- Empty slot: dashed inner frame, subtle placement hint.
- Active target: amber inset glow on frame (deploy / move / cast).

### 3. Resource bars (mana & nexus)

Player hand deck shows mana/nexus as **text over PNG orbs** (bars are optional in enemy strip).

- Flash or pulse when values change (combat, spells, round rewards).
- Icons: blue gem for mana; red heart for nexus HP.

### 4. STRIKE button (End Turn)

- Circular control, bottom-right of hand deck frame (`hand_deck_player.png`).
- Metal ring + **animated fire** on the outer edge.
- Label: **STRIKE** (maps to "End Turn" action).
- Disabled state: dim metal, no fire, no pointer.

### 5. Shop card (Main Deck)

- Face-down ornate back (purple/indigo gradient + gold emblem in reference).
- **Only price visible** before purchase (gold coin + number).
- After buy: flip/reveal animation → card joins hand with bounce.
- `Refresh` as a stone button under the four slots; show uses remaining (3 per round).

### 6. Header controls

| Control | Reference label | Behavior |
|---------|------------------|----------|
| Gold badge | 💰 count | Shows persistent gold + flash on reward |
| | `New Match` | Restarts match, keeps gold + deck |
| | `Reset All` | Full progress reset |

Style: `header_button.png` background, Cinzel white text.

### 7. Combat feedback

- Floating **`-N`** damage numbers centered on cards during clash.
- Red ring or flash on units taking damage.
- Death: fade + slight blur/scale down.
- Nexus damage: bar drains with animated tick.

### 8. How It Works panel

- Fixed in header left on all desktop screens.
- Background: `how_it_works.png`.
- Bullet list of core rules — keep in sync with [GAME_GUIDE.md](./GAME_GUIDE.md).

---

## Background & assets

| Asset | Path | Usage |
|-------|------|--------|
| Battlefield | `public/images/bg_battlefield.png` | Full-page backdrop |
| Reference mockup | `public/images/referenceGame.png` | **UI target — do not ship in-game** |
| Game logo | `public/images/game_logo.png` | Header center |
| Header button | `public/images/header_button.png` | New Match, Reset All, gold badge |
| How It Works | `public/images/how_it_works.png` | Header-left rules panel |
| Player hand deck | `public/images/hand_deck_player.png` | Bottom player strip frame |
| Enemy strip | `public/images/enemy_strip.png` | Top enemy status frame |
| Main Deck | `public/images/main_deck.png` | Right shop panel + **each lane background** |
| Unit art | `public/images/card_{id}.jpg` | Cards and lane units |

When adding a new unit, add matching `card_{id}.jpg` before merging UI work.

---

## Desktop-only layout

This game targets **PC and laptop screens only**.

| Rule | Detail |
|------|--------|
| Minimum viewport | 1280×720 recommended |
| Layout | Always 2-column grid: battlefield + shop |
| Scrolling | **No page scroll** — only internal overflow (e.g. hand cards if >5) |
| Mobile | Not supported — do not add responsive breakpoints for phones/tablets |

Hand row may scroll horizontally inside its absolute zone if the player holds more cards than fit — mana/STRIKE stay fixed on the PNG frame.

---

## Motion & interaction

| Event | Motion |
|-------|--------|
| Card select | Lift + scale (`-translate-y`, ring) |
| Lane target | Amber border pulse |
| Buy card | Bounce on new hand card |
| Combat clash | Damage numbers bounce |
| Nexus hit | Bar flash + numeric drain animation |
| STRIKE hover | Fire intensifies, slight scale |
| Toast | Bottom-center pill (already implemented) |

Keep durations **300–700ms** for UI; combat showcase **1–1.6s** (see `T` constants in `src/App.tsx`).

---

## Implementation checklist

Use this when reviewing UI PRs. Goal: close gaps between live app and reference.

- [x] Viewport: `100vh` shell, no page scroll
- [x] Player hand deck: `hand_deck_player.png` + absolute overlays
- [x] Hand cards: 72×104 px, centered in stone basin
- [x] Header: absolute zones (How It Works | Logo | Buttons)
- [x] Main Deck: `main_deck.png` frame with absolute shop overlays
- [x] Enemy strip: `enemy_strip.png` frame with absolute overlays
- [x] Lane frames: `main_deck.png` background per lane
- [ ] In-lane cards use full card chrome from reference
- [ ] Shop backs: ornamental mystery design + prominent gold price
- [ ] Global dark-fantasy palette tokens (reduce flat Tailwind slate defaults)

**Current baseline:** Layout zones and game flow are correct. Background PNG panels use absolute positioning; visual polish continues toward `referenceGame.png`.

---

## Do's and don'ts

### Do

- Match spacing and hierarchy from `referenceGame.png` before adding new widgets.
- Use **fixed panel dimensions + absolute % overlays** for all PNG frame components.
- Keep the entire game within **100vh** — test at 1280×720 and 1920×1080.
- Reuse existing image assets under `public/images/`.
- Keep mana (blue), nexus (red), and gold (amber) color meanings consistent.

### Don't

- Allow the page body to scroll vertically during normal gameplay.
- Use padding/margin inside PNG-backed panels to align UI — use absolute coordinates.
- Optimize for mobile breakpoints — this is a desktop-only game.
- Introduce bright flat Material-style cards that break the medieval frame language.
- Hide gold price on shop cards — price is the main purchase cue in the mockup.
- Move STRIKE / End Turn to a low-contrast text link.
- Use the reference PNG as an in-game background — it is documentation only.

---

## Related docs

- [GAME_GUIDE.md](./GAME_GUIDE.md) — mechanics, units, spells (content for How It Works)
- [../README.md](../README.md) — setup and project overview

---

*Last updated: viewport layout, absolute PNG overlays, `hand_deck_player.png` anchor map, desktop-only policy.*
