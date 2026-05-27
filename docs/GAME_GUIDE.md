# Ascendants Warfront — Game Guide

A lane-based tactical card battler where you deploy units, cast spells, and outmaneuver an AI opponent to destroy their **Nexus** before yours falls.

---

## Table of Contents

1. [Overview](#overview)
2. [Victory & Defeat](#victory--defeat)
3. [The Battlefield](#the-battlefield)
4. [Resources](#resources)
5. [Turn Flow](#turn-flow)
6. [Combat](#combat)
7. [Cards & Decks](#cards--decks)
8. [Shop & Economy](#shop--economy)
9. [Unit Archetypes](#unit-archetypes)
10. [Unit Roster](#unit-roster)
11. [Spells](#spells)
12. [Strategy Tips](#strategy-tips)
13. [Quick Reference](#quick-reference)

**Developers:** UI layout and visual target → [UI Guidelines](./UI_GUIDELINES.md) (based on `public/images/referenceGame.png`).

---

## Overview

**Ascendants Warfront** is a single-player strategy game built around three parallel **lanes**. Each round you spend **mana** to play cards from your personal **deck**, reposition units, and prepare for automatic **combat** against the enemy.

Between rounds you earn **gold** to buy new cards from a shared **Main Deck** shop. Cards you play are **consumed permanently** — every match is a resource puzzle where you must grow your army while protecting your Nexus.

**Core loop:** Deploy → End Turn → Combat → Earn Gold → Shop → Repeat.

---

## Victory & Defeat

| Condition | Result |
|-----------|--------|
| Reduce the enemy Nexus to **0 HP** | **Victory** (+6💰 bonus) |
| Your Nexus reaches **0 HP** | **Defeat** |
| Match ends | Progress auto-resets after ~4 seconds (gold, deck, and match state return to defaults) |

Both Nexuses start at **20 HP** and cannot be healed above that maximum.

---

## The Battlefield

The board has **three lanes** (left, center, right). Each lane holds at most **one unit per side**.

```
        [ Enemy Nexus — 20 HP ]
  Lane 0    Lane 1    Lane 2
  [E]       [E]       [E]     ← Enemy units
  ───────────────────────────
  [P]       [P]       [P]     ← Your units
        [ Your Nexus — 20 HP ]
```

### What units do in lanes

- **Occupied lane (both sides have a unit):** Units trade damage equal to their Attack (⚔). Surviving units keep fighting in future rounds.
- **Uncontested lane (only your unit):** Your unit's Attack hits the **enemy Nexus** directly.
- **Empty lane with only an enemy unit:** The enemy's Attack hits **your Nexus**.

Units are deployed into **empty friendly lanes**. You can **move or swap** your units between lanes during your turn (click a unit, then click a destination lane).

---

## Resources

### Mana (◆)

Mana is spent to **play cards** during a turn.

| Rule | Value |
|------|-------|
| Starting mana (Round 1) | 1 / 1 |
| Mana growth | +1 max mana each round (both players) |
| Maximum mana cap | 10 |

Unused mana does **not** carry over — spend it or lose it.

### Gold (💰)

Gold is spent in the **shop** to buy cards into your deck.

| Source | Amount |
|--------|--------|
| Round win (combat damage leader) | 5 + 1 income = **6💰** |
| Round tie | 3 + 1 = **4💰** |
| Round loss | 2 + 1 = **3💰** |
| Match victory bonus | **+6💰** |
| Emergency rescue (empty deck + 0 gold) | **+2💰** |

Starting gold: **8💰**.

### Nexus Health (♥)

Your base health. Lane spells and uncontested enemy units chip away at it every combat phase. Protect lanes with **Defenders** and smart positioning.

---

## Turn Flow

Each **round** follows this sequence:

```
1. YOUR TURN
   ├── Play units (pick card → pick empty lane)
   ├── Cast spells (pick card → pick target lane, or tap for nexus spells)
   ├── Move/swap your units between lanes
   └── End Turn

2. ENEMY TURN (AI)
   ├── May buy from shop if low on cards
   └── Plays up to 3 cards (units, spells, nexus effects)

3. COMBAT (automatic)
   ├── Clash — damage numbers shown per lane
   ├── Deaths — units at 0 HP are removed
   ├── Nexus — uncontested damage applied
   └── Rewards — gold, mana, shop refresh

4. NEXT ROUND (unless a Nexus hit 0)
```

During combat you cannot take actions — watch the resolution, then plan your next purchases.

---

## Combat

Combat resolves **simultaneously** across all three lanes.

### Lane vs lane

When both sides have a unit in the same lane:

- Your unit takes damage equal to the **enemy unit's Attack**.
- The enemy unit takes damage equal to **your unit's Attack**.
- Units reduced to 0 HP or below are **destroyed**.

### Uncontested lanes

| Situation | Damage target |
|-----------|---------------|
| Your unit alone in a lane | Enemy Nexus takes your unit's ⚔ |
| Enemy unit alone in a lane | Your Nexus takes enemy's ⚔ |

### Round winner (gold bonus)

The side that dealt **more total damage** during combat (unit + nexus damage combined) wins the round for gold purposes. Ties award the middle payout.

---

## Cards & Decks

There are two deck concepts:

### Main Deck (shared shop pool)

- Contains **2 copies of every card** in the game (units + spells).
- Cards appear **face-down** in the shop — only the **price** is visible until purchased.
- Reshuffles each new match.
- The shop always guarantees **at least one unit** is available.

### Your Deck (personal, persistent)

- Maximum size: **6 cards**.
- Default starter deck: Scout, Acolyte, Soldier, Guardian, Mend, Fireball.
- **Playing a card removes it permanently** from your deck — it does not return after combat.
- Purchased cards are added until you hit the 6-card cap.

### Card stats

Every **unit** has:

| Stat | Symbol | Meaning |
|------|--------|---------|
| Cost | ◆ (mana) | Mana required to deploy |
| Attack | ⚔ | Damage dealt in combat |
| Health | ♥ | Hit points; unit dies at 0 |
| Price | 💰 | Shop purchase cost |

Every **spell** has a mana Cost, a Price, and an effect value (damage or healing amount).

---

## Shop & Economy

- **4 cards** visible in the shop at a time.
- **Buy:** Spend gold → card is revealed and added to your deck → a new card is drawn from the Main Deck.
- **Refresh:** **3 free refreshes per round** — returns unsold shop cards to the pool and draws 4 new ones.
- The enemy AI also buys from the same shop when its hand is low.

Plan purchases around your gold income: winning rounds funds stronger Tier 4–6 units faster.

---

## Unit Archetypes

Units are grouped by combat role based on their Attack vs Health profile:

| Archetype | Profile | Units | Best use |
|-----------|---------|-------|----------|
| **Aggressor** | High ⚔, low ♥ | Acolyte, Soldier, Raider, Assassin | Burst damage, favorable trades, pressure empty lanes |
| **Defender** | Low ⚔, high ♥ | Guardian, Tank | Block lanes, absorb hits, stall for bigger plays |
| **Balanced** | Even ⚔ and ♥ | Scout, Knight, Brute | Flexible presence; good stat efficiency |
| **Titan** | High ⚔ and ♥ | Colossus | Late-game anchor; dominates lanes and survives multiple fights |

### Role quick picks

- **Need a turn-1 play?** Scout or Acolyte (Tier 1).
- **Lane blocked?** Guardian or Tank.
- **Push damage?** Raider, Assassin, or Brute.
- **Win the late game?** Colossus.

---

## Unit Roster

Units are organized into **six tiers** by mana cost. Higher tiers are stronger but require more mana — and mana only grows one point per round.

---

### 🟢 Tier 1 — Recruits (1 mana)

Cheapest units. Ideal for Round 1.

| Card | Role | Cost | ⚔ | ♥ | Price | Description |
|------|------|:----:|:---:|:---:|:-----:|-------------|
| **Scout** | Skirmisher / Balanced | 1 | 1 | 2 | 2💰 | A fast scout in light leather armor with a short bow. Agile and quick — your bread-and-butter early unit. |
| **Acolyte** | Glass Cannon / Aggressor | 1 | 2 | 1 | 2💰 | A mystical acolyte in white and gold robes. Hits hard but extremely fragile — trade carefully. |

---

### 🔵 Tier 2 — Footmen (2 mana)

Solid early-to-mid game backbone.

| Card | Role | Cost | ⚔ | ♥ | Price | Description |
|------|------|:----:|:---:|:---:|:-----:|-------------|
| **Soldier** | Aggressor | 2 | 3 | 2 | 3💰 | A hardened soldier with sword and shield. High damage, vulnerable in extended fights. |
| **Guardian** | Defender | 2 | 1 | 4 | 3💰 | A towering knight with a tower shield. Low damage but absorbs hits — perfect lane blocker. |

---

### 🟡 Tier 3 — Veterans (3 mana)

Mid-game power spike as mana reaches 3.

| Card | Role | Cost | ⚔ | ♥ | Price | Description |
|------|------|:----:|:---:|:---:|:-----:|-------------|
| **Tank** | Wall / Defender | 3 | 2 | 5 | 4💰 | Massive armored warrior with a giant warhammer. Toughest mid-tier unit — survives multiple rounds. |
| **Raider** | Hunter / Aggressor | 3 | 4 | 3 | 4💰 | A fierce dual-axe raider with fur armor. Aggressive trade-focused stat line. |

---

### 🟠 Tier 4 — Champions (4 mana)

Elite units for mid-late game dominance.

| Card | Role | Cost | ⚔ | ♥ | Price | Description |
|------|------|:----:|:---:|:---:|:-----:|-------------|
| **Knight** | Balanced Elite | 4 | 4 | 4 | 5💰 | A noble knight on horseback with a lance. Well-rounded heavy hitter. |
| **Assassin** | Glass Striker / Aggressor | 4 | 5 | 3 | 5💰 | A shadowy assassin with dual daggers. High burst damage but slightly fragile. |

---

### 🔴 Tier 5 — Heroes (5 mana)

Late-game powerhouses that swing momentum.

| Card | Role | Cost | ⚔ | ♥ | Price | Description |
|------|------|:----:|:---:|:---:|:-----:|-------------|
| **Brute** | Powerhouse / Balanced | 5 | 5 | 5 | 7💰 | A massive muscular barbarian with a spiked club. Equal threat and durability. |

---

### 🟣 Tier 6 — Legends (6 mana)

Endgame units that can carry a match alone.

| Card | Role | Cost | ⚔ | ♥ | Price | Description |
|------|------|:----:|:---:|:---:|:-----:|-------------|
| **Colossus** | Titan | 6 | 6 | 7 | 8💰 | A colossal stone golem with glowing runes. Strongest unit in the game — nearly impossible to remove. |

---

### Stat comparison chart

```
Tier  Unit       ⚔/♥   Total   Role
────  ─────────  ─────  ──────  ──────────
 1    Scout      1/2      3    Balanced
 1    Acolyte    2/1      3    Aggressor
 2    Soldier    3/2      5    Aggressor
 2    Guardian   1/4      5    Defender
 3    Tank       2/5      7    Defender
 3    Raider     4/3      7    Aggressor
 4    Knight     4/4      8    Balanced
 4    Assassin   5/3      8    Aggressor
 5    Brute      5/5     10    Balanced
 6    Colossus   6/7     13    Titan
```

*Total = Attack + Health. Higher total stats generally mean a stronger card for its cost, but role fit matters more than raw numbers.*

---

## Spells

Spells are consumed on cast like units. They do not stay on the board.

### Lane-targeting spells

Require a valid target in the selected lane.

| Spell | Cost | Price | Effect |
|-------|:----:|:-----:|--------|
| **Mend** | 2 | 3💰 | Heal a **friendly unit** in lane for **3 HP** (cannot overheal) |
| **Fireball** | 3 | 4💰 | Deal **3 damage** to an **enemy unit** in lane |
| **Healing Wave** | 3 | 4💰 | Heal a friendly unit in lane for **5 HP** |
| **Meteor** | 5 | 6💰 | Deal **5 damage** to an enemy unit in lane |

### Nexus-targeting spells (auto-cast)

Tap the card — **no lane selection** needed.

| Spell | Cost | Price | Effect |
|-------|:----:|:-----:|--------|
| **Life Surge** | 1 | 9💰 | Heal **your Nexus** for **2 HP** (blocked if Nexus is full) |
| **Void Bolt** | 1 | 9💰 | Deal **2 damage** directly to the **enemy Nexus** |

Nexus spells are expensive in the shop but cheap in mana — strong for finishing a low Nexus or stabilizing when you are behind on board.

---

## Strategy Tips

### Early game (Rounds 1–3)

- Deploy **Scout** or **Acolyte** on turn 1 to establish lane presence.
- Use **Guardian** to hold a lane while you push damage elsewhere.
- Don't waste **Life Surge** at full Nexus HP.

### Mid game (Rounds 4–6)

- **Raider** and **Knight** are efficient stat lines for their cost.
- **Fireball** removes key enemy units before combat — target high-Attack threats.
- Reposition units before End Turn to force unfavorable trades for the AI.

### Late game (Rounds 7+)

- Save mana for **Brute** or **Colossus** when max mana allows.
- **Void Bolt** + lane pressure can close out a damaged Nexus.
- Remember: every card played is gone — don't burn your last units on a lost round.

### Economy

- Winning combat rounds accelerates your shop power — sometimes taking a lane trade that deals more total damage is worth losing a unit.
- Use shop refreshes when you see no units or nothing affordable.
- Keep at least one unit card in deck; the rescue gold helps but 2💰 buys only a Scout.

### Fighting the AI

The enemy prioritizes **Void Bolt**, then **Life Surge** (if damaged), then units (preferring lanes where you have units), then lane spells. It plays up to **3 cards per turn** and shops when its hand is nearly empty.

---

## Quick Reference

| Setting | Value |
|---------|-------|
| Lanes | 3 |
| Nexus HP | 20 |
| Max deck size | 6 |
| Shop slots | 4 |
| Shop refreshes / round | 3 |
| Max mana | 10 |
| Starting gold | 8💰 |
| Cards per play | Consumed permanently |
| Main Deck | 2× each card, shuffled |

### Default starter deck

Scout · Acolyte · Soldier · Guardian · Mend · Fireball

### Controls

| Action | How |
|--------|-----|
| Play unit | Select card in hand → click empty lane |
| Cast lane spell | Select spell → click valid target lane |
| Cast nexus spell | Tap spell (Life Surge / Void Bolt) |
| Move unit | Click your unit → click destination lane |
| End turn | **End Turn** button |
| Buy card | Click shop card back (shows price) |
| Refresh shop | **Refresh** button (3 uses per round) |
| New match | **New Match** (keeps gold & deck) |
| Full reset | **Reset All** (gold, deck, and match) |

---

*Documentation reflects the current game build in `src/App.tsx`. Balance values may change in future updates.*
