import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { LanguageSync } from "./components/i18n/LanguageSync";
import { AbsoluteFrame, AbsoluteFrameAnchor } from "./components/layout/AbsoluteFrame";
import { EnemyStrip } from "./components/ui/EnemyStrip";
import type { FrameStatPulseVariant } from "./components/ui/FrameStatDisplay";
import { GameControls, GameSidebar } from "./components/ui/GameHeader";
import { HandCard } from "./components/ui/HandCard";
import { MainDeckShop } from "./components/ui/MainDeckShop";
import { PlayerHandDeck } from "./components/ui/PlayerHandDeck";
import { EmptySlot, UnitCard } from "./components/ui/UnitCard";
import { useGameTour } from "./hooks/useGameTour";
import { playLaneClash, playUnopposedAttack, resetAllCombatUnits } from "./utils/attackAnimation";
import { getCardImageSrc } from "./utils/cardAssets";
import { clearAllLaneVfx } from "./utils/laneAttackVfx";
import {
  clearLanePlacementVfx,
  playLanePlacementVfx,
  waitForPlacementAnimationsComplete,
} from "./utils/lanePlacementVfx";
import { playShopPurchaseVfx } from "./utils/shopPurchaseVfx";
import { playShopRefreshVfx } from "./utils/shopRefreshVfx";
import { cn } from "./utils/cn";

// ---------- TYPES ----------
type CardType = "unit" | "spell";

type CardDef = {
  id: string;
  name: string;
  type: CardType;
  cost: number;
  atk?: number;
  hp?: number;
  // damage/heal target a lane; damage_nexus/heal_nexus auto-target nexus (no lane needed)
  effect?: "damage" | "heal" | "damage_nexus" | "heal_nexus";
  value?: number;
  price: number;
};

// Instance of a card (unique id for tracking)
type Card = CardDef & { uid: string };

// Shop entry — face-down until bought
type ShopEntry = {
  uid: string;
  def: CardDef;
};

type ShopSlot = ShopEntry | null;

function countShopCards(slots: ShopSlot[]): number {
  return slots.filter((slot): slot is ShopEntry => slot !== null).length;
}

type Owner = "player" | "enemy";

type Unit = {
  id: string;
  cardId: string;
  name: string;
  atk: number;
  hp: number;
  maxHp: number;
  lane: number;
  owner: Owner;
};

type Phase = "playerTurn" | "enemyTurn" | "combat";
type CombatStep = "idle" | "clash" | "deaths" | "nexus" | "rewards" | "done";

// ---------- CARD LIBRARY ----------
const CARD_LIBRARY: CardDef[] = [
  { id: "scout", name: "Scout", type: "unit", cost: 1, atk: 1, hp: 2, price: 2 },
  { id: "acolyte", name: "Acolyte", type: "unit", cost: 1, atk: 2, hp: 1, price: 2 },
  { id: "soldier", name: "Soldier", type: "unit", cost: 2, atk: 3, hp: 2, price: 3 },
  { id: "guardian", name: "Guardian", type: "unit", cost: 2, atk: 1, hp: 4, price: 3 },
  { id: "tank", name: "Tank", type: "unit", cost: 3, atk: 2, hp: 5, price: 4 },
  { id: "raider", name: "Raider", type: "unit", cost: 3, atk: 4, hp: 3, price: 4 },
  { id: "knight", name: "Knight", type: "unit", cost: 4, atk: 4, hp: 4, price: 5 },
  { id: "assassin", name: "Assassin", type: "unit", cost: 4, atk: 5, hp: 3, price: 5 },
  { id: "brute", name: "Brute", type: "unit", cost: 5, atk: 5, hp: 5, price: 7 },
  { id: "colossus", name: "Colossus", type: "unit", cost: 6, atk: 6, hp: 7, price: 8 },
  { id: "mend", name: "Mend", type: "spell", cost: 2, effect: "heal", value: 3, price: 3 },
  { id: "fireball", name: "Fireball", type: "spell", cost: 3, effect: "damage", value: 3, price: 4 },
  { id: "healing_wave", name: "Healing Wave", type: "spell", cost: 3, effect: "heal", value: 5, price: 4 },
  { id: "meteor", name: "Meteor", type: "spell", cost: 5, effect: "damage", value: 5, price: 6 },
  // Nexus-targeting spells (tap to cast, no lane needed)
  { id: "life_surge", name: "Life Surge", type: "spell", cost: 1, effect: "heal_nexus", value: 2, price: 9 },
  { id: "void_bolt", name: "Void Bolt", type: "spell", cost: 1, effect: "damage_nexus", value: 2, price: 9 },
];

// Helper: does this card auto-target (no lane needed)?
const isAutoCast = (c: CardDef) => c.effect === "damage_nexus" || c.effect === "heal_nexus";

const LANES = [0, 1, 2];
const MAX_DECK = 6;
const SHOP_SIZE = 4;
const STARTING_NEXUS = 20;
const MAX_MANA = 10;
const STARTING_GOLD = 8;
const STARTER_DECK_IDS = ["scout", "acolyte", "soldier", "guardian"] as const;

// Gold economy — tuned so you're never stuck
const GOLD = {
  WIN_ROUND: 7,       // 7 + 1 income = 8💰 displayed
  TIE_ROUND: 5,       // 5 + 1 income = 6💰 displayed
  LOSE_ROUND: 3,      // 3 + 1 income = 4💰 displayed
  WIN_MATCH: 6,
  INCOME_PER_ROUND: 1, // passive income every round regardless of result
  FREE_RESCUE: 2,      // free gold when deck is empty and gold === 0 (emergency)
};

// One cheap unit always guaranteed visible if no units exist in shop
const RESCUE_UNIT: CardDef = { id: "scout", name: "Scout", type: "unit", cost: 1, atk: 1, hp: 2, price: 2 };

// Ensure shop always has at least 1 unit card so player can never be fully stuck
function guaranteeUnit(slots: ShopSlot[]): ShopSlot[] {
  const hasUnit = slots.some((slot) => slot?.def.type === "unit");
  if (hasUnit) return slots;

  const clone = [...slots];
  for (let i = clone.length - 1; i >= 0; i--) {
    if (clone[i] !== null) {
      clone[i] = { uid: uid(), def: RESCUE_UNIT };
      return clone;
    }
  }

  if (clone.length > 0) clone[0] = { uid: uid(), def: RESCUE_UNIT };
  return clone;
}

function computeShopAfterPurchase(
  shop: ShopSlot[],
  main: CardDef[],
  boughtUid: string,
  ensureUnit = false
): { nextShop: ShopSlot[]; nextMain: CardDef[] } {
  const boughtIndex = shop.findIndex((slot) => slot?.uid === boughtUid);
  if (boughtIndex === -1) {
    return { nextShop: shop, nextMain: main };
  }

  const nextShop = [...shop];
  nextShop[boughtIndex] = null;
  return {
    nextShop: ensureUnit ? guaranteeUnit(nextShop) : nextShop,
    nextMain: main,
  };
}

function computeShopRefill(
  shop: ShopSlot[],
  main: CardDef[]
): { nextShop: ShopSlot[]; nextMain: CardDef[] } {
  const combined = shuffle([
    ...main,
    ...shop.filter((slot): slot is ShopEntry => slot !== null).map((slot) => slot.def),
  ]);
  const newShop: ShopSlot[] = Array(SHOP_SIZE).fill(null);
  const remaining = [...combined];
  for (let i = 0; i < SHOP_SIZE && remaining.length > 0; i++) {
    newShop[i] = { uid: uid(), def: remaining.shift()! };
  }
  return { nextShop: guaranteeUnit(newShop), nextMain: remaining };
}

type EnemyShopContext = {
  deckSize: number;
  unitsInHand: number;
  gold: number;
  enemyNexus: number;
  playerNexus: number;
  enemyBoardUnits: number;
  playerBoardUnits: number;
  enemyMana: number;
};

function countBoardUnits(board: (Unit | null)[]): number {
  return board.filter((unit): unit is Unit => unit !== null).length;
}

function shouldEnemyShop(ctx: EnemyShopContext): boolean {
  if (ctx.deckSize >= MAX_DECK || ctx.gold < 2) return false;

  const lowHand = ctx.deckSize <= 2;
  const thinHand = ctx.deckSize <= 4;
  const noUnits = ctx.unitsInHand === 0;
  const nexusDanger = ctx.enemyNexus <= STARTING_NEXUS * 0.55;
  const behindBoard = ctx.playerBoardUnits > ctx.enemyBoardUnits;
  const playerLowNexus = ctx.playerNexus <= STARTING_NEXUS * 0.45;
  const flushGold = ctx.gold >= 10 && ctx.deckSize <= MAX_DECK - 2;

  return (
    lowHand ||
    (noUnits && ctx.gold >= 3) ||
    (nexusDanger && thinHand) ||
    (behindBoard && ctx.gold >= 5 && thinHand) ||
    (playerLowNexus && ctx.gold >= 6 && ctx.deckSize <= 5) ||
    flushGold
  );
}

function maxEnemyShopBuys(ctx: EnemyShopContext): number {
  const room = MAX_DECK - ctx.deckSize;
  if (room <= 0) return 0;

  let target = 1;
  if (ctx.deckSize <= 1 && ctx.gold >= 5) target = 3;
  else if (ctx.deckSize <= 2 && ctx.gold >= 9) target = 3;
  else if (ctx.unitsInHand === 0 && ctx.gold >= 7) target = 2;
  else if (ctx.enemyNexus <= STARTING_NEXUS * 0.45 && ctx.gold >= 8) target = 2;
  else if (ctx.playerBoardUnits >= ctx.enemyBoardUnits + 2 && ctx.gold >= 8) target = 2;
  else if (ctx.playerNexus <= 8 && ctx.gold >= 10 && ctx.deckSize <= 4) target = 2;
  else if (ctx.gold >= 12 && ctx.deckSize <= 3) target = 3;

  return Math.min(target, room, 3);
}

function scoreEnemyShopEntry(entry: ShopEntry, ctx: EnemyShopContext): number {
  const def = entry.def;
  let score = def.price;

  if (def.type === "unit") {
    score += 8;
    if (ctx.unitsInHand === 0) score += 18;
    if (ctx.playerBoardUnits > ctx.enemyBoardUnits) score += 12;
    if (ctx.enemyNexus <= STARTING_NEXUS * 0.6) score += 8;
    if (def.cost <= ctx.enemyMana) score += 5;
    else if (def.cost <= ctx.enemyMana + 2) score += 2;
    if ((def.atk ?? 0) >= 4) score += 3;
  }

  if (def.effect === "damage_nexus") {
    if (ctx.playerNexus <= 6) score += 22;
    else if (ctx.playerNexus <= 12) score += 12;
    else score += 4;
  }

  if (def.effect === "heal_nexus") {
    if (ctx.enemyNexus >= STARTING_NEXUS) score -= 40;
    else score += (STARTING_NEXUS - ctx.enemyNexus) * 1.4;
  }

  if (def.effect === "damage") {
    score += ctx.playerBoardUnits > 0 ? 8 : -6;
  }

  if (def.effect === "heal") {
    score += ctx.enemyNexus <= STARTING_NEXUS * 0.7 ? 4 : 1;
  }

  if (def.price > ctx.gold * 0.65) score -= 4;

  return score;
}

function pickEnemyShopEntry(entries: ShopEntry[], ctx: EnemyShopContext): ShopEntry | null {
  const affordable = entries.filter((entry) => ctx.gold >= entry.def.price);
  if (affordable.length === 0) return null;

  return affordable
    .map((entry) => ({ entry, score: scoreEnemyShopEntry(entry, ctx) }))
    .sort((a, b) => b.score - a.score)[0].entry;
}

type StatPulseState = { key: number; variant: FrameStatPulseVariant };

const T = {
  CLASH_LANE_GAP: 300,
  DEATHS_SHOW: 1200,
  NEXUS_SHOW: 2200,
  REWARDS_SHOW: 2200,
  ENEMY_DELAY: 1200,
};

// ---------- HELPERS ----------
const uid = () => Math.random().toString(36).slice(2, 10);
const makeCard = (def: CardDef): Card => ({ ...def, uid: `${def.id}-${uid()}` });

function buildStarterDeck(): Card[] {
  return STARTER_DECK_IDS.map(id => CARD_LIBRARY.find(c => c.id === id)!).map(makeCard);
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Build the main deck (shared pool) with 2 copies of each card.
function buildMainDeck(): CardDef[] {
  const deck: CardDef[] = [];
  CARD_LIBRARY.forEach(c => { deck.push(c); deck.push(c); });
  return shuffle(deck);
}

// ---------- PERSISTENT STATE ----------
function usePersistent<T>(key: string, initial: T): [T, (v: T | ((p: T) => T)) => void] {
  const [state, setState] = useState<T>(() => {
    try { const r = localStorage.getItem(key); return r ? JSON.parse(r) : initial; } catch { return initial; }
  });
  const set = (v: T | ((p: T) => T)) => {
    setState((prev) => {
      const next = typeof v === "function" ? (v as (p: T) => T)(prev) : v;
      try { localStorage.setItem(key, JSON.stringify(next)); } catch {}
      return next;
    });
  };
  return [state, set];
}

// ---------- MAIN APP ----------
export default function App() {
  const { t } = useTranslation();
  // === PERSISTENT: gold + personal deck ===
  const [gold, setGold] = usePersistent<number>("lc_gold", STARTING_GOLD);
  const [deckCards, setDeckCards] = usePersistent<Card[]>("lc_deck_v2", buildStarterDeck());

  // === MAIN DECK (shared pool) — resets each match ===
  const [mainDeck, setMainDeck] = useState<CardDef[]>(() => buildMainDeck());
  const [shopEntries, setShopEntries] = useState<ShopSlot[]>(() => Array(SHOP_SIZE).fill(null));

  // === GAME STATE ===
  const [playerBoard, setPlayerBoard] = useState<(Unit | null)[]>([null, null, null]);
  const [enemyBoard, setEnemyBoard] = useState<(Unit | null)[]>([null, null, null]);
  const [, setCurrentTurn] = useState<Owner>("player");
  const [phase, setPhase] = useState<Phase>("playerTurn");
  const [combatStep, setCombatStep] = useState<CombatStep>("idle");
  const [, setRound] = useState(1);

  const [playerMana, setPlayerMana] = useState(1);
  const [playerMaxMana, setPlayerMaxMana] = useState(1);
  const [enemyMana, setEnemyMana] = useState(1);
  const [enemyMaxMana, setEnemyMaxMana] = useState(1);

  const [playerNexus, setPlayerNexus] = useState(STARTING_NEXUS);
  const [enemyNexus, setEnemyNexus] = useState(STARTING_NEXUS);

  const [selectedCardUid, setSelectedCardUid] = useState<string | null>(null);
  const [movingUnitId, setMovingUnitId] = useState<string | null>(null);
  const [winner, setWinner] = useState<Owner | null>(null);
  const [busy, setBusy] = useState(false);

  // === ENEMY DECK & GOLD ===
  const [enemyDeck, setEnemyDeck] = useState<Card[]>([]);
  const [enemyGold, setEnemyGold] = useState<number>(STARTING_GOLD);

  // === COMBAT DISPLAY ===
  const [combatData, setCombatData] = useState<{
    pDmg: (number | null)[]; eDmg: (number | null)[];
    pNexusDmg: number; eNexusDmg: number;
    totalPlayerDamage: number; totalEnemyDamage: number;
  } | null>(null);
  const [unitDamageBursts, setUnitDamageBursts] = useState<
    Record<string, { key: number; amount: number }>
  >({});

  const unitRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const combatRunningRef = useRef(false);

  const [displayPlayerNexus, setDisplayPlayerNexus] = useState(STARTING_NEXUS);
  const [displayEnemyNexus, setDisplayEnemyNexus] = useState(STARTING_NEXUS);
  const [displayGold, setDisplayGold] = useState(gold);
  const [flashGold, setFlashGold] = useState<number | null>(null);
  const [playerNexusPulse, setPlayerNexusPulse] = useState<StatPulseState>({ key: 0, variant: "damage" });
  const [enemyNexusPulse, setEnemyNexusPulse] = useState<StatPulseState>({ key: 0, variant: "damage" });
  const [playerManaPulse, setPlayerManaPulse] = useState<StatPulseState>({ key: 0, variant: "spend" });
  const [enemyManaPulse, setEnemyManaPulse] = useState<StatPulseState>({ key: 0, variant: "gain" });
  const [roundResult, setRoundResult] = useState<Owner | "tie" | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [newlyBoughtUid, setNewlyBoughtUid] = useState<string | null>(null);
  const [enemyNewlyBoughtUid, setEnemyNewlyBoughtUid] = useState<string | null>(null);
  const [deployingUnitIds, setDeployingUnitIds] = useState<Set<string>>(() => new Set());
  const [placedUnitIds, setPlacedUnitIds] = useState<Set<string>>(() => new Set());
  const toastTimer = useRef<number | null>(null);
  const shopRefreshingRef = useRef(false);
  const shopEntriesRef = useRef(shopEntries);
  const mainDeckRef = useRef(mainDeck);
  shopEntriesRef.current = shopEntries;
  mainDeckRef.current = mainDeck;

  const pulseUnitDamage = useCallback((unitId: string, amount: number) => {
    setUnitDamageBursts((prev) => ({
      ...prev,
      [unitId]: { key: (prev[unitId]?.key ?? 0) + 1, amount },
    }));
  }, []);

  const bumpNexusPulse = useCallback((side: "player" | "enemy", variant: "damage" | "heal") => {
    const setter = side === "player" ? setPlayerNexusPulse : setEnemyNexusPulse;
    setter((prev) => ({ key: prev.key + 1, variant }));
  }, []);

  const bumpManaPulse = useCallback((side: "player" | "enemy", variant: "spend" | "gain") => {
    const setter = side === "player" ? setPlayerManaPulse : setEnemyManaPulse;
    setter((prev) => ({ key: prev.key + 1, variant }));
  }, []);

  const { Tour, startTour } = useGameTour();

  const startUnitDeploy = useCallback((unitId: string) => {
    setDeployingUnitIds((prev) => new Set(prev).add(unitId));
  }, []);

  const finishUnitDeploy = useCallback((unitId: string, withRevealFx = true) => {
    setDeployingUnitIds((prev) => {
      const next = new Set(prev);
      next.delete(unitId);
      return next;
    });
    if (!withRevealFx) return;
    setPlacedUnitIds((prev) => new Set(prev).add(unitId));
    setTimeout(() => {
      setPlacedUnitIds((prev) => {
        const next = new Set(prev);
        next.delete(unitId);
        return next;
      });
    }, 400);
  }, []);

  function applyShopPurchase(boughtUid: string, ensureUnit = false) {
    const { nextShop, nextMain } = computeShopAfterPurchase(
      shopEntriesRef.current,
      mainDeckRef.current,
      boughtUid,
      ensureUnit
    );
    shopEntriesRef.current = nextShop;
    mainDeckRef.current = nextMain;
    setShopEntries(nextShop);
    setMainDeck(nextMain);
  }

  function applyShopRefill() {
    const { nextShop, nextMain } = computeShopRefill(shopEntriesRef.current, mainDeckRef.current);
    shopEntriesRef.current = nextShop;
    mainDeckRef.current = nextMain;
    setShopEntries(nextShop);
    setMainDeck(nextMain);
  }

  const showToast = (msg: string) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 1800);
  };

  // ========== INIT MATCH ==========
  function initMatch() {
    // Reset main deck
    const md = buildMainDeck();
    setMainDeck(md);
    // Draw initial shop — guarantee at least 1 unit
    const initialShop: ShopSlot[] = Array(SHOP_SIZE).fill(null);
    const remaining = [...md];
    for (let i = 0; i < SHOP_SIZE && remaining.length > 0; i++) {
      initialShop[i] = { uid: uid(), def: remaining.shift()! };
    }
    const nextShop = guaranteeUnit(initialShop);
    setShopEntries(nextShop);
    setMainDeck(remaining);
    shopEntriesRef.current = nextShop;
    mainDeckRef.current = remaining;

    // Reset enemy deck
    const pool = CARD_LIBRARY.slice(0, Math.min(CARD_LIBRARY.length, 6));
    const ed: Card[] = [];
    pool.forEach(c => ed.push(makeCard(c)));
    setEnemyDeck(shuffle(ed));
    setEnemyGold(STARTING_GOLD);

    // Reset boards etc.
    setPlayerBoard([null, null, null]);
    setEnemyBoard([null, null, null]);
    setCurrentTurn("player");
    setPhase("playerTurn");
    setCombatStep("idle");
    setCombatData(null);
    setUnitDamageBursts({});
    unitRefs.current = {};
    combatRunningRef.current = false;
    setRound(1);
    setPlayerMana(1); setPlayerMaxMana(1);
    setEnemyMana(1); setEnemyMaxMana(1);
    setPlayerNexus(STARTING_NEXUS); setEnemyNexus(STARTING_NEXUS);
    setDisplayPlayerNexus(STARTING_NEXUS); setDisplayEnemyNexus(STARTING_NEXUS);
    setDisplayGold(gold);
    setSelectedCardUid(null); setWinner(null); setRoundResult(null); setBusy(false);
    setEnemyNewlyBoughtUid(null);
    setDeployingUnitIds(new Set());
    setPlacedUnitIds(new Set());
    clearLanePlacementVfx();
  }

  useEffect(() => { initMatch(); }, []); // eslint-disable-line

  // Sync display values
  useEffect(() => {
    if (combatStep === "idle") {
      setDisplayPlayerNexus(playerNexus);
      setDisplayEnemyNexus(enemyNexus);
      setDisplayGold(gold);
    }
  }, [playerNexus, enemyNexus, gold, combatStep]);

  useEffect(() => {
    if (roundResult === null) return;
    const t = setTimeout(() => setRoundResult(null), 2500);
    return () => clearTimeout(t);
  }, [roundResult]);

  const selectedCard = useMemo(() => deckCards.find(c => c.uid === selectedCardUid) ?? null, [deckCards, selectedCardUid]);

  const canPlay = (c: Card) => phase === "playerTurn" && !busy && !winner && c.cost <= playerMana;

  // ========== PLAY CARD ==========
  // Playing a card CONSUMES it permanently from your deck.
  // For nexus-targeting spells, `lane` is ignored.
  function playCard(card: Card, lane: number) {
    if (phase !== "playerTurn" || busy || winner) return;
    if (card.cost > playerMana) return;
    if (!deckCards.some(c => c.uid === card.uid)) return; // Already consumed

    let success = true;
    if (card.type === "unit") {
      if (playerBoard[lane] !== null) { success = false; }
      else {
        const newUnitId = `u-${uid()}`;
        const cardArtSrc = getCardImageSrc(card.id);
        startUnitDeploy(newUnitId);
        setPlayerBoard((b) => {
          const nb = [...b];
          nb[lane] = {
            id: newUnitId,
            cardId: card.id,
            name: card.name,
            atk: card.atk ?? 0,
            hp: card.hp ?? 1,
            maxHp: card.hp ?? 1,
            lane,
            owner: "player",
          };
          return nb;
        });
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            void playLanePlacementVfx({
              side: "player",
              lane,
              cardArtSrc,
              onLand: () => finishUnitDeploy(newUnitId, false),
            });
          });
        });
      }
    } else if (card.effect === "damage") {
      const val = card.value ?? 0;
      const target = enemyBoard[lane];
      if (!target) {
        showToast(t("game.toasts.noEnemyUnit"));
        return;
      }
      setEnemyBoard(b => {
        const nb = [...b];
        const t = nb[lane];
        if (t) { nb[lane] = t.hp - val > 0 ? { ...t, hp: t.hp - val } : null; }
        return nb;
      });
    } else if (card.effect === "heal") {
      const val = card.value ?? 0;
      const target = playerBoard[lane];
      if (!target || target.hp >= target.maxHp) {
        showToast(t("game.toasts.noWoundedAlly"));
        return;
      }
      setPlayerBoard(b => {
        const nb = [...b];
        const t = nb[lane];
        if (t) { nb[lane] = { ...t, hp: Math.min(t.maxHp, t.hp + val) }; }
        return nb;
      });
    } else if (card.effect === "damage_nexus") {
      const val = card.value ?? 0;
      setEnemyNexus(n => Math.max(0, n - val));
      bumpNexusPulse("enemy", "damage");
    } else if (card.effect === "heal_nexus") {
      if (playerNexus >= STARTING_NEXUS) {
        showToast(t("game.toasts.nexusFull"));
        return;
      }
      const val = card.value ?? 0;
      setPlayerNexus(n => Math.min(STARTING_NEXUS, n + val));
      bumpNexusPulse("player", "heal");
    }

    if (!success) return;

    setPlayerMana(m => m - card.cost);
    bumpManaPulse("player", "spend");
    // Permanently remove the card from the deck
    setDeckCards(d => d.filter(c => c.uid !== card.uid));
    setSelectedCardUid(null);
  }

  // Tap-to-cast wrapper for nexus spells (no lane required)
  function autoCast(card: Card) {
    if (!isAutoCast(card)) return;
    playCard(card, -1);
  }

  // ========== MOVE UNIT ==========
  // Click a player unit → select it. Click another lane → move or swap.
  function selectUnitForMove(unitId: string) {
    if (phase !== "playerTurn" || busy || winner) return;
    setSelectedCardUid(null); // cancel card selection
    setMovingUnitId(prev => prev === unitId ? null : unitId);
  }

  function moveUnitToLane(targetLane: number) {
    if (phase !== "playerTurn" || busy || winner || !movingUnitId) return;

    const fromLane = playerBoard.findIndex(u => u?.id === movingUnitId);
    if (fromLane === -1 || fromLane === targetLane) {
      setMovingUnitId(null);
      return;
    }

    const unit = playerBoard[fromLane];
    const target = playerBoard[targetLane];

    setPlayerBoard(b => {
      const nb = [...b];
      nb[targetLane] = unit;
      nb[fromLane] = target; // swap if occupied, null if empty
      // Update lane numbers
      if (nb[targetLane]) nb[targetLane] = { ...nb[targetLane]!, lane: targetLane };
      if (nb[fromLane]) nb[fromLane] = { ...nb[fromLane]!, lane: fromLane };
      return nb;
    });

    setMovingUnitId(null);
  }

  // ========== SHOP: BUY CARD ==========
  function buyFromShop(entry: ShopEntry, sourceEl: HTMLButtonElement) {
    if (gold < entry.def.price) { showToast(t("game.toasts.needGold", { price: entry.def.price })); return; }
    if (deckCards.length >= MAX_DECK) { showToast(t("game.toasts.deckFull", { max: MAX_DECK })); return; }

    const sourceRect = sourceEl.getBoundingClientRect();
    const cardArtSrc = getCardImageSrc(entry.def.id);

    setGold(g => g - entry.def.price);
    const newCard = makeCard(entry.def);
    setDeckCards(d => [...d, newCard]);
    applyShopPurchase(entry.uid);
    setNewlyBoughtUid(newCard.uid);
    setTimeout(() => setNewlyBoughtUid(null), 1800);

    void playShopPurchaseVfx(sourceRect, cardArtSrc, "player");
  }

  // ========== SHOP: REFRESH ==========
  const [refreshes, setRefreshes] = useState(3);
  async function refreshShop() {
    if (shopRefreshingRef.current) return;
    if (refreshes <= 0) { showToast(t("game.toasts.noRefreshes")); return; }
    shopRefreshingRef.current = true;
    setRefreshes(r => r - 1);
    try {
      await playShopRefreshVfx(() => applyShopRefill());
    } finally {
      shopRefreshingRef.current = false;
    }
  }

  // ========== END TURN ==========
  function endTurn() {
    if (phase !== "playerTurn" || busy || winner) return;
    setSelectedCardUid(null);
    setBusy(true);
    setPhase("enemyTurn");
    setCurrentTurn("enemy");
  }

  // ========== AUTO RESET AFTER MATCH ==========
  useEffect(() => {
    if (!winner) return;
    const t = setTimeout(() => {
      resetProgress(true); // Automatically reset all progress at end of game
    }, 4000); // 4 seconds to view the victory/defeat banner before auto-advancing
    return () => clearTimeout(t);
    // eslint-disable-next-line
  }, [winner]);

  // ========== ENEMY AI ==========
  useEffect(() => {
    if (phase !== "enemyTurn" || winner) return;
    let cancelled = false;
    const t = setTimeout(() => {
      void (async () => {
        await runEnemyAI();
        await waitForPlacementAnimationsComplete();
        if (cancelled) return;
        setPhase("combat");
        setCombatStep("clash");
      })();
    }, T.ENEMY_DELAY);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
    // eslint-disable-next-line
  }, [phase]);

  function runEnemyAI(): Promise<void> {
    const board = [...enemyBoard];
    let mana = enemyMana;
    let pBoard = [...playerBoard];
    let pNexus = playerNexus;
    let eDeck = [...enemyDeck];
    let eGold = enemyGold;
    const startPlayerNexus = pNexus;
    const startEnemyNexus = enemyNexus;
    const startEnemyMana = enemyMana;
    const consumed: string[] = [];
    const enemyPlacements: { lane: number; unitId: string }[] = [];
    const pendingEnemyPurchases: { rect: DOMRect; art: string; uid: string }[] = [];
    const boughtThisTurnUids = new Set<string>();

    // --- ENEMY SHOPPING LOGIC ---
    const shopCtx: EnemyShopContext = {
      deckSize: eDeck.length,
      unitsInHand: eDeck.filter((c) => c.type === "unit").length,
      gold: eGold,
      enemyNexus,
      playerNexus: pNexus,
      enemyBoardUnits: countBoardUnits(board),
      playerBoardUnits: countBoardUnits(pBoard),
      enemyMana: mana,
    };

    if (shouldEnemyShop(shopCtx)) {
      const buyLimit = maxEnemyShopBuys(shopCtx);

      for (let buyIndex = 0; buyIndex < buyLimit; buyIndex++) {
        if (eDeck.length >= MAX_DECK) break;

        shopCtx.deckSize = eDeck.length;
        shopCtx.unitsInHand = eDeck.filter((c) => c.type === "unit").length;
        shopCtx.gold = eGold;

        const available = shopEntriesRef.current.filter(
          (entry): entry is ShopEntry => entry !== null
        );
        const picked = pickEnemyShopEntry(available, shopCtx);
        if (!picked) break;

        eGold -= picked.def.price;
        const newCard = makeCard(picked.def);
        eDeck.push(newCard);
        boughtThisTurnUids.add(newCard.uid);

        const shopBtn = document.querySelector<HTMLElement>(`[data-shop-entry="${picked.uid}"]`);
        if (shopBtn) {
          pendingEnemyPurchases.push({
            rect: shopBtn.getBoundingClientRect(),
            art: "/images/mystery_card.png",
            uid: newCard.uid,
          });
        }

        applyShopPurchase(
          picked.uid,
          shopCtx.unitsInHand === 0 && picked.def.type !== "unit"
        );
      }
    }

    // --- ENEMY PLAY LOGIC ---
    // Local copies so we can apply multiple nexus changes correctly within one turn
    let localEnemyNexus = enemyNexus;
    let localPlayerNexus = pNexus;

    // Priority: nexus damage spells always fire first (always cast if affordable)
    // Then nexus heal (only if damaged), then units, then lane spells
    const sortedHand = [...eDeck].sort((a, b) => {
      const prio = (c: Card) => {
        if (c.effect === "damage_nexus") return 0;            // always cast
        if (c.effect === "heal_nexus") return 1;              // conditional
        if (c.type === "unit") return 2;
        return 3;
      };
      return prio(a) - prio(b) || b.cost - a.cost;
    });

    for (const card of sortedHand) {
      if (card.cost > mana) continue;
      if (consumed.includes(card.uid)) continue;
      if (boughtThisTurnUids.has(card.uid)) continue;

      if (card.type === "unit") {
        const empty = LANES.filter(l => board[l] === null);
        if (empty.length === 0) continue;
        const withPlayer = empty.filter(l => pBoard[l] !== null);
        const targets = withPlayer.length > 0 ? withPlayer : empty;
        const lane = targets[Math.floor(Math.random() * targets.length)];
        const unitId = `u-${uid()}`;
        board[lane] = {
          id: unitId,
          cardId: card.id,
          name: card.name,
          atk: card.atk ?? 0,
          hp: card.hp ?? 1,
          maxHp: card.hp ?? 1,
          lane,
          owner: "enemy",
        };
        enemyPlacements.push({ lane, unitId });
        startUnitDeploy(unitId);
        mana -= card.cost;
        consumed.push(card.uid);
      } else if (card.effect === "damage_nexus") {
        // 💥 Void Bolt — ALWAYS cast if affordable
        const val = card.value ?? 0;
        localPlayerNexus = Math.max(0, localPlayerNexus - val);
        pNexus = localPlayerNexus;
        mana -= card.cost;
        consumed.push(card.uid);
        showToast(t("game.toasts.enemyVoidBolt", { val }));
      } else if (card.effect === "heal_nexus") {
        // ♥ Life Surge — only cast if nexus is actually damaged
        if (localEnemyNexus >= STARTING_NEXUS) continue;
        const val = card.value ?? 0;
        localEnemyNexus = Math.min(STARTING_NEXUS, localEnemyNexus + val);
        mana -= card.cost;
        consumed.push(card.uid);
        showToast(t("game.toasts.enemyLifeSurge", { val }));
      } else if (card.effect === "damage") {
        const val = card.value ?? 0;
        let best = -1, bestA = -1;
        LANES.forEach(l => { const u = pBoard[l]; if (u && u.atk > bestA) { bestA = u.atk; best = l; } });
        if (best === -1) {
          // No units to target — skip this spell
          continue;
        } else {
          const t = pBoard[best]!;
          pBoard[best] = t.hp - val > 0 ? { ...t, hp: t.hp - val } : null;
          mana -= card.cost;
          consumed.push(card.uid);
        }
      } else if (card.effect === "heal") {
        const val = card.value ?? 0;
        const injured = board.findIndex(u => u && u.hp < u.maxHp);
        if (injured === -1) {
          // No wounded units — skip this spell
          continue;
        } else {
          const t = board[injured]!;
          board[injured] = { ...t, hp: Math.min(t.maxHp, t.hp + val) };
          mana -= card.cost;
          consumed.push(card.uid);
        }
      }

      // Limit to 3 actions per turn so the AI doesn't dump its whole hand
      if (consumed.length >= 3) break;
    }

    setEnemyBoard(board);
    setEnemyMana(mana);
    setPlayerBoard(pBoard);
    setPlayerNexus(localPlayerNexus);
    setEnemyNexus(localEnemyNexus);
    setEnemyGold(eGold);
    setEnemyDeck(eDeck.filter(c => !consumed.includes(c.uid)));

    if (localPlayerNexus < startPlayerNexus) bumpNexusPulse("player", "damage");
    if (localEnemyNexus > startEnemyNexus) bumpNexusPulse("enemy", "heal");
    if (localEnemyNexus < startEnemyNexus) bumpNexusPulse("enemy", "damage");
    if (mana < startEnemyMana) bumpManaPulse("enemy", "spend");

    if (pendingEnemyPurchases.length > 0) {
      const lastPurchase = pendingEnemyPurchases[pendingEnemyPurchases.length - 1];
      setEnemyNewlyBoughtUid(lastPurchase.uid);
      setTimeout(() => setEnemyNewlyBoughtUid(null), 1800 + pendingEnemyPurchases.length * 350);

      pendingEnemyPurchases.forEach((purchase, index) => {
        setTimeout(() => {
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              void playShopPurchaseVfx(purchase.rect, purchase.art, "enemy");
            });
          });
        }, index * 350);
      });
    }

    const placementTasks = enemyPlacements.map(
      (placement, index) =>
        new Promise<void>((resolve) => {
          setTimeout(() => {
            requestAnimationFrame(() => {
              void playLanePlacementVfx({
                side: "enemy",
                lane: placement.lane,
                cardArtSrc: "/images/mystery_card.png",
              }).then(() => {
                finishUnitDeploy(placement.unitId);
                resolve();
              });
            });
          }, index * 220);
        })
    );

    return placementTasks.length > 0
      ? Promise.all(placementTasks).then(() => undefined)
      : Promise.resolve();
  }

  // ========== COMBAT ==========
  useEffect(() => {
    if (phase !== "combat" || combatStep !== "clash" || winner || combatRunningRef.current) return;

    combatRunningRef.current = true;
    setUnitDamageBursts({});

    let cancelled = false;

    (async () => {
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
      if (cancelled) return;

      const pDmg: (number | null)[] = [null, null, null];
      const eDmg: (number | null)[] = [null, null, null];
      let pN = 0;
      let eN = 0;
      let tP = 0;
      let tE = 0;

      for (const l of LANES) {
        const p = playerBoard[l];
        const e = enemyBoard[l];
        if (p && !e) {
          eN += p.atk;
          tP += p.atk;
        } else if (!p && e) {
          pN += e.atk;
          tE += e.atk;
        }
      }

      let pb = [...playerBoard];
      let eb = [...enemyBoard];

      // Resolve lanes left → right (clash or unopposed attack)
      for (const l of LANES) {
        const pSnap = pb[l];
        const eSnap = eb[l];

        if (pSnap && eSnap) {
          const clashResult = await playLaneClash(
            pSnap.id,
            eSnap.id,
            unitRefs,
            async () => {
              const nextEnemyHp = Math.max(0, eSnap.hp - pSnap.atk);
              const nextPlayerHp = Math.max(0, pSnap.hp - eSnap.atk);

              eb[l] = nextEnemyHp === 0 ? { ...eSnap, hp: 0 } : { ...eSnap, hp: nextEnemyHp };
              pb[l] = nextPlayerHp === 0 ? { ...pSnap, hp: 0 } : { ...pSnap, hp: nextPlayerHp };
              eDmg[l] = pSnap.atk;
              pDmg[l] = eSnap.atk;
              tP += pSnap.atk;
              tE += eSnap.atk;

              setEnemyBoard([...eb]);
              setPlayerBoard([...pb]);
              pulseUnitDamage(eSnap.id, pSnap.atk);
              pulseUnitDamage(pSnap.id, eSnap.atk);

              await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
              return { playerHp: nextPlayerHp, enemyHp: nextEnemyHp };
            }
          );
          if (cancelled) return;

          if (clashResult.enemyHp === 0) eb[l] = null;
          if (clashResult.playerHp === 0) pb[l] = null;
          setEnemyBoard([...eb]);
          setPlayerBoard([...pb]);
        } else if (pSnap) {
          await playUnopposedAttack(pSnap.id, unitRefs, async () => {
            await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
          });
          if (cancelled) return;
        } else if (eSnap) {
          await playUnopposedAttack(eSnap.id, unitRefs, async () => {
            await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
          });
          if (cancelled) return;
        } else {
          continue;
        }

        await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
        await new Promise((r) => setTimeout(r, T.CLASH_LANE_GAP));
      }

      if (cancelled) return;

      resetAllCombatUnits(unitRefs);
      clearAllLaneVfx();
      setCombatData({
        pDmg,
        eDmg,
        pNexusDmg: pN,
        eNexusDmg: eN,
        totalPlayerDamage: tP,
        totalEnemyDamage: tE,
      });
      setCombatStep("deaths");
    })().finally(() => {
      combatRunningRef.current = false;
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line
  }, [phase, combatStep, pulseUnitDamage]);

  useEffect(() => {
    if (combatStep !== "deaths" || !combatData) return;
    const t = setTimeout(() => {
      setPlayerBoard((prev) => prev.map((u) => (u && u.hp <= 0 ? null : u)));
      setEnemyBoard((prev) => prev.map((u) => (u && u.hp <= 0 ? null : u)));
      setPlayerNexus((prev) => Math.max(0, prev - combatData.pNexusDmg));
      setEnemyNexus((prev) => Math.max(0, prev - combatData.eNexusDmg));
      setCombatStep("nexus");
    }, T.DEATHS_SHOW);
    return () => clearTimeout(t);
  }, [combatStep, combatData]);

  useEffect(() => {
    if (combatStep !== "nexus" || !combatData) return;

    const i1 = setInterval(() => {
      setDisplayPlayerNexus(prev => {
        const tgt = playerNexus;
        if (prev === tgt) { clearInterval(i1); return prev; }
        const s = Math.max(1, Math.ceil(Math.abs(tgt - prev) / 4));
        const next = prev > tgt ? Math.max(tgt, prev - s) : Math.min(tgt, prev + s);
        if (next < prev) queueMicrotask(() => bumpNexusPulse("player", "damage"));
        return next;
      });
    }, 80);

    const i2 = setInterval(() => {
      setDisplayEnemyNexus(prev => {
        const tgt = enemyNexus;
        if (prev === tgt) { clearInterval(i2); return prev; }
        const s = Math.max(1, Math.ceil(Math.abs(tgt - prev) / 4));
        const next = prev > tgt ? Math.max(tgt, prev - s) : Math.min(tgt, prev + s);
        if (next < prev) queueMicrotask(() => bumpNexusPulse("enemy", "damage"));
        return next;
      });
    }, 80);

    const t = setTimeout(() => {
      clearInterval(i1); clearInterval(i2);
      setDisplayPlayerNexus(playerNexus);
      setDisplayEnemyNexus(enemyNexus);

      const { totalPlayerDamage: tP, totalEnemyDamage: tE } = combatData;
      const rw: Owner | "tie" = tP > tE ? "player" : tE > tP ? "enemy" : "tie";
      
      const pRoundGold = rw === "player" ? GOLD.WIN_ROUND : rw === "tie" ? GOLD.TIE_ROUND : GOLD.LOSE_ROUND;
      const pEarned = pRoundGold + GOLD.INCOME_PER_ROUND;
      const newPGold = gold + pEarned;
      setGold(newPGold);
      setDisplayGold(newPGold);
      if (pEarned > 0) { setFlashGold(pEarned); setTimeout(() => setFlashGold(null), 1400); }

      const eRoundGold = rw === "enemy" ? GOLD.WIN_ROUND : rw === "tie" ? GOLD.TIE_ROUND : GOLD.LOSE_ROUND;
      const eEarned = eRoundGold + GOLD.INCOME_PER_ROUND;
      setEnemyGold(prev => prev + eEarned);

      const nextMax = Math.min(MAX_MANA, playerMaxMana + 1);
      setPlayerMaxMana(nextMax); setPlayerMana(nextMax);
      setEnemyMaxMana(nextMax); setEnemyMana(nextMax);
      bumpManaPulse("player", "gain");
      setTimeout(() => bumpManaPulse("enemy", "gain"), 450);

      setRoundResult(rw);
      setCombatStep("rewards");
    }, T.NEXUS_SHOW);

    return () => { clearInterval(i1); clearInterval(i2); clearTimeout(t); };
    // eslint-disable-next-line
  }, [combatStep]);

  useEffect(() => {
    if (combatStep !== "rewards" || !combatData) return;
    if (playerNexus <= 0 || enemyNexus <= 0) {
      setWinner(enemyNexus <= 0 ? "player" : "enemy");
      setCombatStep("done"); setBusy(false);
      if (enemyNexus <= 0) setGold(g => g + GOLD.WIN_MATCH);
      return;
    }
    const rewardsTimer = setTimeout(() => {
      // New round: cards DON'T return (they were consumed when played)
      const nPM = Math.min(MAX_MANA, playerMaxMana + 1);
      setPlayerMaxMana(nPM); setPlayerMana(nPM);

      // Emergency rescue: if player has no cards left AND no gold, give them a lifeline
      // We check inside setGold so it sees the current persisted value
      setGold(currentGold => {
        const emptyDeck = deckCards.length === 0;
        if (emptyDeck && currentGold === 0) {
          showToast(t("game.toasts.rescue", { gold: GOLD.FREE_RESCUE }));
          return currentGold + GOLD.FREE_RESCUE;
        }
        return currentGold;
      });

      // Refresh shop for the new turn
      applyShopRefill();
      setRefreshes(3);
      setRound(r => r + 1);
      setCurrentTurn("player");
      setPhase("playerTurn");
      setCombatStep("idle");
      setCombatData(null);
      setUnitDamageBursts({});
      setBusy(false);
    }, T.REWARDS_SHOW);
    return () => clearTimeout(rewardsTimer);
    // eslint-disable-next-line
  }, [combatStep]);

  function resetProgress(silent = false) {
    if (!silent && !confirm(t("game.confirmReset"))) return;

    if (toastTimer.current) {
      clearTimeout(toastTimer.current);
      toastTimer.current = null;
    }

    const starterDeck = buildStarterDeck();
    setGold(STARTING_GOLD);
    setDeckCards(starterDeck);
    setDisplayGold(STARTING_GOLD);
    setWinner(null);
    setBusy(false);
    setSelectedCardUid(null);
    setMovingUnitId(null);
    setFlashGold(null);
    setPlayerNexusPulse({ key: 0, variant: "damage" });
    setEnemyNexusPulse({ key: 0, variant: "damage" });
    setPlayerManaPulse({ key: 0, variant: "spend" });
    setEnemyManaPulse({ key: 0, variant: "gain" });
    setToast(null);
    setNewlyBoughtUid(null);
    setEnemyNewlyBoughtUid(null);
    setRoundResult(null);
    setCombatData(null);
    setUnitDamageBursts({});
    unitRefs.current = {};
    combatRunningRef.current = false;
    setCombatStep("idle");
    setRefreshes(3);
    initMatch();
  }

  return (
    <div
      className="game-shell game-layout font-display w-full"
      style={{
        backgroundImage: `url('/images/bg_battlefield.png')`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
      }}
    >
      <LanguageSync />
      <div
        className="game-columns grid h-full w-full min-h-0 overflow-visible"
        style={{ gridTemplateColumns: "var(--sidebar-w) 1fr var(--shop-w)" }}
      >
        <GameSidebar
          maxDeck={MAX_DECK}
          goldWin={GOLD.WIN_ROUND + GOLD.INCOME_PER_ROUND}
          goldTie={GOLD.TIE_ROUND + GOLD.INCOME_PER_ROUND}
          goldLose={GOLD.LOSE_ROUND + GOLD.INCOME_PER_ROUND}
        />

        {/* Center column — enemy top, lanes middle, hand deck bottom */}
        <main className="flex h-full min-h-0 flex-col items-center overflow-hidden pt-[var(--arena-gap)] pb-0">
          <div
            className="relative shrink-0 overflow-visible"
            style={{ width: "var(--enemy-w)", height: "var(--enemy-h)" }}
          >
            <EnemyStrip
              embedded
              enemyMana={enemyMana}
              enemyMaxMana={enemyMaxMana}
              displayEnemyNexus={displayEnemyNexus}
              nexusMax={STARTING_NEXUS}
              enemyDeckCount={enemyDeck.length}
              manaPulseKey={enemyManaPulse.key}
              manaPulseVariant={enemyManaPulse.variant}
              nexusPulseKey={enemyNexusPulse.key}
              nexusPulseVariant={enemyNexusPulse.variant}
              deckCardUids={enemyDeck.map((c) => c.uid)}
              newlyBoughtUid={enemyNewlyBoughtUid}
            />
          </div>

          <div className="flex min-h-0 w-full flex-1 items-center justify-center overflow-visible">
            <div
              className="relative grid min-h-0 shrink-0 grid-cols-3 gap-[0.3%] overflow-visible"
              style={{ width: "var(--arena-w)", height: "var(--lanes-h)" }}
            >
              {LANES.map((lane) => {
                const e = enemyBoard[lane],
                  p = playerBoard[lane];
                const canTarget = selectedCard !== null && phase === "playerTurn" && !busy;
                const validTarget =
                  canTarget &&
                  ((selectedCard?.type === "unit" && p === null) || selectedCard?.type === "spell");
                const isMoveSource = p && movingUnitId === p.id;
                const isMoveTarget = movingUnitId !== null && !isMoveSource && phase === "playerTurn" && !busy;
                const enemyBurst = e ? unitDamageBursts[e.id] : undefined;
                const playerBurst = p ? unitDamageBursts[p.id] : undefined;

                const handleLaneClick = () => {
                  if (validTarget && selectedCard) {
                    playCard(selectedCard, lane);
                  } else if (isMoveTarget) {
                    moveUnitToLane(lane);
                  }
                };

                return (
                  <AbsoluteFrameAnchor
                    key={lane}
                    {...(lane === 1 ? { "data-tour": "lanes" } : {})}
                    className={cn(
                      "h-full min-h-0 transition-all duration-500",
                      (validTarget || isMoveTarget) && "lane-frame-target cursor-pointer"
                    )}
                    onClick={handleLaneClick}
                  >
                    <AbsoluteFrame image="/images/main_deck.png" className="inset-0" />

                    <div
                      className="absolute inset-0 z-20 flex min-h-0 flex-col"
                      style={{
                        paddingLeft: "var(--lane-inset-x)",
                        paddingRight: "var(--lane-inset-x)",
                        paddingTop: "var(--lane-inset-y)",
                        paddingBottom: "var(--lane-inset-y)",
                      }}
                    >
                      <div
                        data-lane-slot="enemy"
                        data-lane-index={lane}
                        className="@container flex min-h-0 flex-1 items-center justify-center overflow-visible"
                      >
                        {e ? (
                          <UnitCard
                            ref={(el) => {
                              if (el) unitRefs.current[e.id] = el;
                              else delete unitRefs.current[e.id];
                            }}
                            unitId={e.id}
                            cardId={e.cardId}
                            name={e.name}
                            atk={e.atk}
                            hp={e.hp}
                            side="enemy"
                            lane
                            deploying={deployingUnitIds.has(e.id)}
                            placed={placedUnitIds.has(e.id)}
                            damageBurstKey={enemyBurst?.key ?? 0}
                            damageAmount={enemyBurst?.amount ?? 0}
                          />
                        ) : (
                          <EmptySlot
                            lane
                            label={
                              validTarget && selectedCard?.type === "spell"
                                ? t("lanes.castHere")
                                : isMoveTarget
                                  ? t("lanes.moveHere")
                                  : t("common.dash")
                            }
                            active={Boolean(
                              (validTarget && selectedCard?.type === "spell") || isMoveTarget
                            )}
                          />
                        )}
                      </div>

                      <div className="lane-clash-line relative flex shrink-0 items-center py-[0.15%]">
                        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-amber-500/40 to-transparent" />
                        {p && e && (
                          <span className="absolute inset-0 flex items-center justify-center text-[1em] font-bold text-amber-400">
                            ⚔
                          </span>
                        )}
                      </div>

                      <div
                        data-lane-slot="player"
                        data-lane-index={lane}
                        className="@container flex min-h-0 flex-1 items-center justify-center overflow-visible"
                      >
                        {p ? (
                          <UnitCard
                            ref={(el) => {
                              if (el) unitRefs.current[p.id] = el;
                              else delete unitRefs.current[p.id];
                            }}
                            unitId={p.id}
                            cardId={p.cardId}
                            name={p.name}
                            atk={p.atk}
                            hp={p.hp}
                            side="player"
                            lane
                            deploying={deployingUnitIds.has(p.id)}
                            placed={placedUnitIds.has(p.id)}
                            damageBurstKey={playerBurst?.key ?? 0}
                            damageAmount={playerBurst?.amount ?? 0}
                            selected={Boolean(isMoveSource)}
                            moving={Boolean(isMoveSource)}
                            onClick={(ev) => {
                              ev.stopPropagation();
                              selectUnitForMove(p.id);
                            }}
                          />
                        ) : (
                          <EmptySlot
                            lane
                            label={
                              validTarget && selectedCard?.type === "unit"
                                ? t("lanes.deployHere")
                                : isMoveTarget
                                  ? t("lanes.moveHere")
                                  : t("common.dash")
                            }
                            active={Boolean(
                              (validTarget && selectedCard?.type === "unit") || isMoveTarget
                            )}
                          />
                        )}
                      </div>
                    </div>
                  </AbsoluteFrameAnchor>
                );
              })}
            </div>
          </div>

          <div className="hand-deck-zone">
            <div className="hand-deck-zone__deck">
              <PlayerHandDeck
                embedded
                playerMana={playerMana}
                playerMaxMana={playerMaxMana}
                displayPlayerNexus={displayPlayerNexus}
                nexusMax={STARTING_NEXUS}
                manaPulseKey={playerManaPulse.key}
                manaPulseVariant={playerManaPulse.variant}
                nexusPulseKey={playerNexusPulse.key}
                nexusPulseVariant={playerNexusPulse.variant}
                deckCount={deckCards.length}
                deckEmpty={deckCards.length === 0}
                selectedCardName={selectedCard ? t(`cards.${selectedCard.id}`) : null}
                isMoving={movingUnitId !== null && !selectedCard}
                strikeDisabled={phase !== "playerTurn" || busy || !!winner}
                onStrike={endTurn}
              >
                {deckCards.length === 0 && (
                  <div className="font-display flex w-full items-center justify-center px-2 py-1 text-center text-[9px] text-rose-200 drop-shadow-md">
                    {t("hand.deckEmptyBanner")}
                  </div>
                )}
                {deckCards.map((c) => {
                  const autoCastable = isAutoCast(c);
                  const isHealNexus = c.effect === "heal_nexus";
                  const healWouldWaste = isHealNexus && playerNexus >= STARTING_NEXUS;
                  const clickable = canPlay(c) && !healWouldWaste;

                  const handleClick = () => {
                    if (!clickable) return;
                    if (autoCastable) autoCast(c);
                    else setSelectedCardUid((s) => (s === c.uid ? null : c.uid));
                  };

                  return (
                    <HandCard
                      key={c.uid}
                      card={c}
                      compact
                      selected={selectedCardUid === c.uid}
                      clickable={clickable}
                      newlyBought={newlyBoughtUid === c.uid}
                      healWouldWaste={healWouldWaste}
                      onClick={handleClick}
                    />
                  );
                })}
              </PlayerHandDeck>
            </div>
          </div>
        </main>

        {/* Right column — controls + main deck shop */}
        <div className="shop-column flex h-full min-h-0 flex-col items-center overflow-visible">
          <GameControls
            displayGold={displayGold}
            flashGold={flashGold}
            onReset={() => resetProgress()}
            onStartTour={startTour}
          />
          <AbsoluteFrameAnchor className="main-deck-panel">
            <MainDeckShop
              shopEntries={shopEntries}
              mainDeckRemaining={mainDeck.length + countShopCards(shopEntries)}
              gold={gold}
              deckFull={deckCards.length >= MAX_DECK}
              refreshes={refreshes}
              winner={!!winner}
              onRefresh={refreshShop}
              onBuy={buyFromShop}
              className="h-full w-full"
            />
          </AbsoluteFrameAnchor>
        </div>
      </div>

        {toast && (
          <div className="pointer-events-none fixed bottom-6 left-1/2 z-40 -translate-x-1/2 rounded-full border border-amber-400/50 bg-amber-500/90 px-4 py-2 text-sm font-semibold text-slate-900 shadow-lg animate-bounce">
            {toast}
          </div>
        )}
        {Tour}
        {winner && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm">
            <div className="stone-panel w-[90%] max-w-sm p-6 text-center shadow-2xl">
              <div className="mb-2 text-5xl animate-bounce">{winner === "player" ? "🏆" : "💀"}</div>
              <h2 className="font-display mb-1 text-2xl font-bold">
                {winner === "player" ? t("game.victoryTitle") : t("game.defeatTitle")}
              </h2>
              <p className="mb-2 text-sm text-slate-300">
                {winner === "player"
                  ? t("game.victoryBody", { gold: GOLD.WIN_MATCH })
                  : t("game.defeatBody")}
              </p>
              <p className="mb-4 animate-pulse text-xs text-amber-400/80">
                {t("game.autoReset")}
              </p>
              <button
                type="button"
                onClick={() => resetProgress(true)}
                className="stone-btn w-full py-2.5 text-xs text-amber-100"
              >
                {t("game.resetPlayNow")}
              </button>
            </div>
          </div>
        )}
    </div>
  );
}

