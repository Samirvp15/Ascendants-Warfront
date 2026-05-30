import { useEffect, useMemo, useRef, useState } from "react";
import { AbsoluteFrame, AbsoluteFrameAnchor } from "./components/layout/AbsoluteFrame";
import { EnemyStrip } from "./components/ui/EnemyStrip";
import { GameControls, GameSidebar } from "./components/ui/GameHeader";
import { HandCard } from "./components/ui/HandCard";
import { MainDeckShop } from "./components/ui/MainDeckShop";
import { PlayerHandDeck } from "./components/ui/PlayerHandDeck";
import { EmptySlot, UnitCard } from "./components/ui/UnitCard";
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
  WIN_ROUND: 5,       // 5 + 1 income = 6💰 displayed
  TIE_ROUND: 3,       // 3 + 1 income = 4💰 displayed
  LOSE_ROUND: 2,      // 2 + 1 income = 3💰 displayed
  WIN_MATCH: 6,
  INCOME_PER_ROUND: 1, // passive income every round regardless of result
  FREE_RESCUE: 2,      // free gold when deck is empty and gold === 0 (emergency)
};

// One cheap unit always guaranteed visible if no units exist in shop
const RESCUE_UNIT: CardDef = { id: "scout", name: "Scout", type: "unit", cost: 1, atk: 1, hp: 2, price: 2 };

// Ensure shop always has at least 1 unit card so player can never be fully stuck
function guaranteeUnit(entries: ShopEntry[]): ShopEntry[] {
  const hasUnit = entries.some(e => e.def.type === "unit");
  if (hasUnit) return entries;
  // Replace last entry with the rescue unit if no units present
  const clone = [...entries];
  if (clone.length > 0) clone[clone.length - 1] = { uid: uid(), def: RESCUE_UNIT };
  else clone.push({ uid: uid(), def: RESCUE_UNIT });
  return clone;
}

function computeShopAfterPurchase(
  shop: ShopEntry[],
  main: CardDef[],
  boughtUid: string,
  ensureUnit = false
): { nextShop: ShopEntry[]; nextMain: CardDef[] } {
  const filtered = shop.filter(e => e.uid !== boughtUid);
  if (main.length === 0) {
    return { nextShop: filtered, nextMain: main };
  }
  const [drawn, ...nextMain] = main;
  let nextShop: ShopEntry[] = [...filtered, { uid: uid(), def: drawn }];
  if (ensureUnit) nextShop = guaranteeUnit(nextShop);
  return { nextShop, nextMain };
}

function computeShopRefill(
  shop: ShopEntry[],
  main: CardDef[]
): { nextShop: ShopEntry[]; nextMain: CardDef[] } {
  const combined = shuffle([...main, ...shop.map(e => e.def)]);
  const newShop: ShopEntry[] = [];
  const remaining = [...combined];
  for (let i = 0; i < SHOP_SIZE && remaining.length > 0; i++) {
    newShop.push({ uid: uid(), def: remaining.shift()! });
  }
  return { nextShop: guaranteeUnit(newShop), nextMain: remaining };
}

const T = {
  CLASH_SHOW: 1400,
  DEATHS_SHOW: 1000,
  NEXUS_SHOW: 1600,
  REWARDS_SHOW: 1800,
  ENEMY_DELAY: 1000,
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
  // === PERSISTENT: gold + personal deck ===
  const [gold, setGold] = usePersistent<number>("lc_gold", STARTING_GOLD);
  const [deckCards, setDeckCards] = usePersistent<Card[]>("lc_deck_v2", buildStarterDeck());

  // === MAIN DECK (shared pool) — resets each match ===
  const [mainDeck, setMainDeck] = useState<CardDef[]>(() => buildMainDeck());
  const [shopEntries, setShopEntries] = useState<ShopEntry[]>([]);

  // === GAME STATE ===
  const [playerBoard, setPlayerBoard] = useState<(Unit | null)[]>([null, null, null]);
  const [enemyBoard, setEnemyBoard] = useState<(Unit | null)[]>([null, null, null]);
  const [currentTurn, setCurrentTurn] = useState<Owner>("player");
  const [phase, setPhase] = useState<Phase>("playerTurn");
  const [combatStep, setCombatStep] = useState<CombatStep>("idle");
  const [round, setRound] = useState(1);

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

  const [displayPlayerNexus, setDisplayPlayerNexus] = useState(STARTING_NEXUS);
  const [displayEnemyNexus, setDisplayEnemyNexus] = useState(STARTING_NEXUS);
  const [displayGold, setDisplayGold] = useState(gold);
  const [flashNexus, setFlashNexus] = useState<"player" | "enemy" | null>(null);
  const [flashGold, setFlashGold] = useState<number | null>(null);
  const [flashMana, setFlashMana] = useState<"player" | "enemy" | null>(null);
  const [roundResult, setRoundResult] = useState<Owner | "tie" | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [newlyBoughtUid, setNewlyBoughtUid] = useState<string | null>(null); // for reveal animation
  const toastTimer = useRef<number | null>(null);
  const shopEntriesRef = useRef(shopEntries);
  const mainDeckRef = useRef(mainDeck);
  shopEntriesRef.current = shopEntries;
  mainDeckRef.current = mainDeck;

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
    const initialShop: ShopEntry[] = [];
    const remaining = [...md];
    for (let i = 0; i < SHOP_SIZE && remaining.length > 0; i++) {
      const def = remaining.shift()!;
      initialShop.push({ uid: uid(), def });
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
    setRound(1);
    setPlayerMana(1); setPlayerMaxMana(1);
    setEnemyMana(1); setEnemyMaxMana(1);
    setPlayerNexus(STARTING_NEXUS); setEnemyNexus(STARTING_NEXUS);
    setDisplayPlayerNexus(STARTING_NEXUS); setDisplayEnemyNexus(STARTING_NEXUS);
    setDisplayGold(gold);
    setSelectedCardUid(null); setWinner(null); setRoundResult(null); setBusy(false);
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
        setPlayerBoard(b => { const nb = [...b]; nb[lane] = { id: `u-${uid()}`, cardId: card.id, name: card.name, atk: card.atk ?? 0, hp: card.hp ?? 1, maxHp: card.hp ?? 1, lane, owner: "player" }; return nb; });
      }
    } else if (card.effect === "damage") {
      const val = card.value ?? 0;
      const target = enemyBoard[lane];
      if (!target) {
        showToast("No enemy unit in this lane to damage!");
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
        showToast("No wounded friendly unit in this lane!");
        return;
      }
      setPlayerBoard(b => {
        const nb = [...b];
        const t = nb[lane];
        if (t) { nb[lane] = { ...t, hp: Math.min(t.maxHp, t.hp + val) }; }
        return nb;
      });
    } else if (card.effect === "damage_nexus") {
      // Void Bolt — auto-cast, directly damages enemy nexus
      const val = card.value ?? 0;
      setEnemyNexus(n => Math.max(0, n - val));
      setFlashNexus("enemy");
      setTimeout(() => setFlashNexus(null), 1200);
    } else if (card.effect === "heal_nexus") {
      // Life Surge — auto-cast, directly heals own nexus
      // Guard: don't waste if nexus is at full
      if (playerNexus >= STARTING_NEXUS) {
        showToast("Nexus already at full HP!");
        return;
      }
      const val = card.value ?? 0;
      setPlayerNexus(n => Math.min(STARTING_NEXUS, n + val));
      setFlashNexus("player");
      setTimeout(() => setFlashNexus(null), 1200);
    }

    if (!success) return;

    setPlayerMana(m => m - card.cost);
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
  function buyFromShop(entry: ShopEntry) {
    if (gold < entry.def.price) { showToast(`Need ${entry.def.price}💰`); return; }
    if (deckCards.length >= MAX_DECK) { showToast(`Deck full! (${MAX_DECK})`); return; }

    setGold(g => g - entry.def.price);
    const newCard = makeCard(entry.def);
    setDeckCards(d => [...d, newCard]);
    applyShopPurchase(entry.uid);
    setNewlyBoughtUid(newCard.uid);
    setTimeout(() => setNewlyBoughtUid(null), 1500);
    showToast(`Bought ${entry.def.name}!`);
  }

  // ========== SHOP: REFRESH ==========
  const [refreshes, setRefreshes] = useState(3);
  function refreshShop() {
    if (refreshes <= 0) { showToast("No refreshes left"); return; }
    setRefreshes(r => r - 1);
    applyShopRefill();
    showToast("Shop refreshed");
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
    const t = setTimeout(() => {
      runEnemyAI();
      setPhase("combat");
      setCombatStep("clash");
    }, T.ENEMY_DELAY);
    return () => clearTimeout(t);
    // eslint-disable-next-line
  }, [phase]);

  function runEnemyAI() {
    const board = [...enemyBoard];
    let mana = enemyMana;
    let pBoard = [...playerBoard];
    let pNexus = playerNexus;
    let eDeck = [...enemyDeck];
    let eGold = enemyGold;
    const consumed: string[] = [];

    // --- ENEMY SHOPPING LOGIC ---
    // Enemy shops if deck is low (<= 2 cards) or if they have no units and plenty of gold
    const enemyUnitsInHand = eDeck.filter(c => c.type === "unit").length;
    if (eDeck.length <= 2 || (enemyUnitsInHand === 0 && eGold >= 4)) {
      // Look at current shop entries (Main Deck)
      const affordable = shopEntriesRef.current.filter(entry => eGold >= entry.def.price);
      if (affordable.length > 0) {
        // Prefer units if they have none, otherwise pick highest price (best card)
        let picked = affordable[0];
        const units = affordable.filter(e => e.def.type === "unit");
        if (enemyUnitsInHand === 0 && units.length > 0) {
          picked = units.sort((a, b) => b.def.price - a.def.price)[0];
        } else {
          picked = affordable.sort((a, b) => b.def.price - a.def.price)[0];
        }

        eGold -= picked.def.price;
        const newCard = makeCard(picked.def);
        eDeck.push(newCard);

        applyShopPurchase(picked.uid, true);
        
        // Visual feedback for enemy buying (just a toast for now)
        showToast("👹 Enemy bought a mystery card!");
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

      if (card.type === "unit") {
        const empty = LANES.filter(l => board[l] === null);
        if (empty.length === 0) continue;
        const withPlayer = empty.filter(l => pBoard[l] !== null);
        const targets = withPlayer.length > 0 ? withPlayer : empty;
        const lane = targets[Math.floor(Math.random() * targets.length)];
        board[lane] = { id: `u-${uid()}`, cardId: card.id, name: card.name, atk: card.atk ?? 0, hp: card.hp ?? 1, maxHp: card.hp ?? 1, lane, owner: "enemy" };
        mana -= card.cost;
        consumed.push(card.uid);
      } else if (card.effect === "damage_nexus") {
        // 💥 Void Bolt — ALWAYS cast if affordable
        const val = card.value ?? 0;
        localPlayerNexus = Math.max(0, localPlayerNexus - val);
        pNexus = localPlayerNexus;
        mana -= card.cost;
        consumed.push(card.uid);
        showToast(`👹 Enemy cast Void Bolt → -${val} to your Nexus!`);
      } else if (card.effect === "heal_nexus") {
        // ♥ Life Surge — only cast if nexus is actually damaged
        if (localEnemyNexus >= STARTING_NEXUS) continue;
        const val = card.value ?? 0;
        localEnemyNexus = Math.min(STARTING_NEXUS, localEnemyNexus + val);
        mana -= card.cost;
        consumed.push(card.uid);
        showToast(`👹 Enemy cast Life Surge → +${val} to their Nexus`);
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
  }

  // ========== COMBAT ==========
  useEffect(() => {
    if (phase !== "combat" || combatStep !== "clash" || winner || combatData) return;
    const pDmg: (number | null)[] = [null, null, null];
    const eDmg: (number | null)[] = [null, null, null];
    let pN = 0, eN = 0, tP = 0, tE = 0;
    for (const l of LANES) {
      const p = playerBoard[l], e = enemyBoard[l];
      if (p && e) { pDmg[l] = e.atk; eDmg[l] = p.atk; tP += p.atk; tE += e.atk; }
      else if (p && !e) { eN += p.atk; tP += p.atk; }
      else if (!p && e) { pN += e.atk; tE += e.atk; }
    }
    setCombatData({ pDmg, eDmg, pNexusDmg: pN, eNexusDmg: eN, totalPlayerDamage: tP, totalEnemyDamage: tE });
    const t = setTimeout(() => setCombatStep("deaths"), T.CLASH_SHOW);
    return () => clearTimeout(t);
    // eslint-disable-next-line
  }, [phase, combatStep]);

  useEffect(() => {
    if (combatStep !== "deaths" || !combatData) return;
    const { pDmg, eDmg } = combatData;
    const pb = [...playerBoard], eb = [...enemyBoard];
    for (const l of LANES) {
      const p = pb[l], e = eb[l];
      if (p && e) {
        pb[l] = p.hp - (pDmg[l] ?? 0) > 0 ? { ...p, hp: p.hp - (pDmg[l] ?? 0) } : null;
        eb[l] = e.hp - (eDmg[l] ?? 0) > 0 ? { ...e, hp: e.hp - (eDmg[l] ?? 0) } : null;
      }
    }
    setPlayerBoard(pb); setEnemyBoard(eb);
    setPlayerNexus(Math.max(0, playerNexus - combatData.pNexusDmg));
    setEnemyNexus(Math.max(0, enemyNexus - combatData.eNexusDmg));
    const t = setTimeout(() => setCombatStep("nexus"), T.DEATHS_SHOW);
    return () => clearTimeout(t);
    // eslint-disable-next-line
  }, [combatStep]);

  useEffect(() => {
    if (combatStep !== "nexus" || !combatData) return;
    setFlashNexus("player");
    const i1 = setInterval(() => {
      setDisplayPlayerNexus(prev => {
        const tgt = playerNexus;
        if (prev === tgt) { clearInterval(i1); return prev; }
        const s = Math.max(1, Math.ceil(Math.abs(tgt - prev) / 4));
        return prev > tgt ? Math.max(tgt, prev - s) : Math.min(tgt, prev + s);
      });
    }, 80);
    setTimeout(() => { clearInterval(i1); setDisplayPlayerNexus(playerNexus); setFlashNexus("enemy"); }, 800);

    const i2 = setInterval(() => {
      setDisplayEnemyNexus(prev => {
        const tgt = enemyNexus;
        if (prev === tgt) { clearInterval(i2); return prev; }
        const s = Math.max(1, Math.ceil(Math.abs(tgt - prev) / 4));
        return prev > tgt ? Math.max(tgt, prev - s) : Math.min(tgt, prev + s);
      });
    }, 80);

    const t = setTimeout(() => {
      clearInterval(i1); clearInterval(i2);
      setDisplayPlayerNexus(playerNexus);
      setDisplayEnemyNexus(enemyNexus);
      setFlashNexus(null);

      const { totalPlayerDamage: tP, totalEnemyDamage: tE } = combatData;
      const rw: Owner | "tie" = tP > tE ? "player" : tE > tP ? "enemy" : "tie";
      
      // Everyone earns gold
      const pRoundGold = rw === "player" ? GOLD.WIN_ROUND : rw === "tie" ? GOLD.TIE_ROUND : GOLD.LOSE_ROUND;
      const pEarned = pRoundGold + GOLD.INCOME_PER_ROUND;
      const newPGold = gold + pEarned;
      setGold(newPGold);
      setDisplayGold(newPGold);
      if (pEarned > 0) { setFlashGold(pEarned); setTimeout(() => setFlashGold(null), 1400); }

      const eRoundGold = rw === "enemy" ? GOLD.WIN_ROUND : rw === "tie" ? GOLD.TIE_ROUND : GOLD.LOSE_ROUND;
      const eEarned = eRoundGold + GOLD.INCOME_PER_ROUND;
      setEnemyGold(prev => prev + eEarned);

      // Both sides get the same mana progression — +1 max mana each round
      const nextMax = Math.min(MAX_MANA, playerMaxMana + 1);
      setPlayerMaxMana(nextMax); setPlayerMana(nextMax);
      setEnemyMaxMana(nextMax); setEnemyMana(nextMax);

      setFlashMana("player"); setTimeout(() => setFlashMana("enemy"), 600); setTimeout(() => setFlashMana(null), 1200);
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
    const t = setTimeout(() => {
      // New round: cards DON'T return (they were consumed when played)
      const nPM = Math.min(MAX_MANA, playerMaxMana + 1);
      setPlayerMaxMana(nPM); setPlayerMana(nPM);

      // Emergency rescue: if player has no cards left AND no gold, give them a lifeline
      // We check inside setGold so it sees the current persisted value
      setGold(currentGold => {
        const emptyDeck = deckCards.length === 0;
        if (emptyDeck && currentGold === 0) {
          showToast(`☀️ Rescue! +${GOLD.FREE_RESCUE}💰 — buy a unit to stay in the fight!`);
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
      setBusy(false);
    }, T.REWARDS_SHOW);
    return () => clearTimeout(t);
    // eslint-disable-next-line
  }, [combatStep]);

  function resetProgress(silent = false) {
    if (!silent && !confirm("Reset everything? Gold, deck, and match progress will restart from zero.")) return;

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
    setFlashNexus(null);
    setFlashGold(null);
    setFlashMana(null);
    setToast(null);
    setNewlyBoughtUid(null);
    setRoundResult(null);
    setCombatData(null);
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
      <div
        className="game-columns grid h-full w-full min-h-0 overflow-visible"
        style={{ gridTemplateColumns: "var(--sidebar-w) 1fr var(--shop-w)" }}
      >
        <GameSidebar
          round={round}
          mainDeckRemaining={mainDeck.length + shopEntries.length}
          maxDeck={MAX_DECK}
          goldWin={GOLD.WIN_ROUND + GOLD.INCOME_PER_ROUND}
          goldTie={GOLD.TIE_ROUND + GOLD.INCOME_PER_ROUND}
          goldLose={GOLD.LOSE_ROUND + GOLD.INCOME_PER_ROUND}
          freeRescue={GOLD.FREE_RESCUE}
        />

        {/* Center column — enemy top, lanes middle, hand deck bottom */}
        <main className="flex h-full min-h-0 flex-col items-center overflow-hidden pt-[var(--arena-gap)] pb-0">
          <div
            className="relative shrink-0"
            style={{ width: "var(--enemy-w)", height: "var(--enemy-h)" }}
          >
            <EnemyStrip
              embedded
              enemyMana={enemyMana}
              enemyMaxMana={enemyMaxMana}
              displayEnemyNexus={displayEnemyNexus}
              nexusMax={STARTING_NEXUS}
              enemyDeckCount={enemyDeck.length}
              flashMana={flashMana === "enemy"}
              flashNexus={flashNexus === "enemy"}
              activeTurn={currentTurn === "enemy"}
            />
          </div>

          <div className="flex min-h-0 w-full flex-1 items-center justify-center">
            <div
              className="relative grid min-h-0 shrink-0 grid-cols-3 gap-[0.3%]"
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
                const pDmg = combatData?.pDmg[lane] ?? null,
                  eDmg = combatData?.eDmg[lane] ?? null;
                const showDmg = combatStep === "clash" || combatStep === "deaths";

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
                      <div className="@container flex min-h-0 flex-1 items-stretch justify-center">
                        {e ? (
                          <UnitCard
                            cardId={e.cardId}
                            name={e.name}
                            atk={e.atk}
                            hp={e.hp}
                            side="enemy"
                            lane
                            showDmg={showDmg}
                            dmg={eDmg}
                            dying={combatStep === "deaths" && e.hp <= 0}
                          />
                        ) : (
                          <EmptySlot
                            lane
                            label={
                              validTarget && selectedCard?.type === "spell"
                                ? "Cast here"
                                : isMoveTarget
                                  ? "Move here"
                                  : "—"
                            }
                            active={Boolean(
                              (validTarget && selectedCard?.type === "spell") || isMoveTarget
                            )}
                          />
                        )}
                      </div>

                      <div className="relative flex shrink-0 items-center py-[0.15%]">
                        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-amber-500/40 to-transparent" />
                        {p && e && (
                          <span className="absolute inset-0 flex items-center justify-center text-[1em] font-bold text-amber-400">
                            ⚔
                          </span>
                        )}
                      </div>

                      <div className="@container flex min-h-0 flex-1 items-stretch justify-center">
                        {p ? (
                          <UnitCard
                            cardId={p.cardId}
                            name={p.name}
                            atk={p.atk}
                            hp={p.hp}
                            side="player"
                            lane
                            showDmg={showDmg}
                            dmg={pDmg}
                            dying={combatStep === "deaths" && p.hp <= 0}
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
                                ? "Deploy here"
                                : isMoveTarget
                                  ? "Move here"
                                  : "—"
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
                flashMana={flashMana === "player"}
                flashNexus={flashNexus === "player"}
                deckCount={deckCards.length}
                deckEmpty={deckCards.length === 0}
                selectedCardName={selectedCard?.name ?? null}
                isMoving={movingUnitId !== null && !selectedCard}
                strikeDisabled={phase !== "playerTurn" || busy || !!winner}
                onStrike={endTurn}
              >
                {deckCards.length === 0 && (
                  <div className="font-display flex w-full items-center justify-center px-2 py-1 text-center text-[9px] text-rose-200 drop-shadow-md">
                    Deck empty! Buy from Main Deck →
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
            onNewMatch={initMatch}
            onReset={() => resetProgress()}
          />
          <AbsoluteFrameAnchor className="main-deck-panel">
            <MainDeckShop<ShopEntry>
              shopEntries={shopEntries}
              mainDeckRemaining={mainDeck.length + shopEntries.length}
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
        {winner && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm">
            <div className="stone-panel w-[90%] max-w-sm p-6 text-center shadow-2xl">
              <div className="mb-2 text-5xl animate-bounce">{winner === "player" ? "🏆" : "💀"}</div>
              <h2 className="font-display mb-1 text-2xl font-bold">
                {winner === "player" ? "Victory!" : "Defeat"}
              </h2>
              <p className="mb-2 text-sm text-slate-300">
                {winner === "player"
                  ? `The enemy nexus has fallen. +${GOLD.WIN_MATCH}💰`
                  : "Your nexus was shattered."}
              </p>
              <p className="mb-4 animate-pulse text-xs text-amber-400/80">
                Auto-resetting and starting new match...
              </p>
              <button
                type="button"
                onClick={() => resetProgress(true)}
                className="stone-btn w-full py-2.5 text-xs text-amber-100"
              >
                Reset &amp; Play Now
              </button>
            </div>
          </div>
        )}
    </div>
  );
}

