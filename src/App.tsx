import { useEffect, useMemo, useRef, useState } from "react";

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
  // Player's deck: Card instances (with uids so we can remove on play)
  const defaultDeck: Card[] = ["scout", "acolyte", "soldier", "guardian", "mend", "fireball"]
    .map(id => CARD_LIBRARY.find(c => c.id === id)!)
    .map(makeCard);
  const [deckCards, setDeckCards] = usePersistent<Card[]>("lc_deck_v2", defaultDeck);

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
    setShopEntries(guaranteeUnit(initialShop));
    setMainDeck(remaining);

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
    // Remove this entry from shop and draw a replacement from main deck
    setShopEntries(s => {
      const filtered = s.filter(e => e.uid !== entry.uid);
      return filtered;
    });
    // Draw replacement from main deck
    setMainDeck(md => {
      if (md.length === 0) return md;
      const [drawn, ...rest] = md;
      setShopEntries(s => [...s, { uid: uid(), def: drawn }]);
      return rest;
    });
    setNewlyBoughtUid(newCard.uid);
    setTimeout(() => setNewlyBoughtUid(null), 1500);
    showToast(`Bought ${entry.def.name}!`);
  }

  // ========== SHOP: REFRESH ==========
  const [refreshes, setRefreshes] = useState(3);
  function refreshShop() {
    if (refreshes <= 0) { showToast("No refreshes left"); return; }
    setRefreshes(r => r - 1);
    // Put current shop cards back into main deck, draw new ones
    setShopEntries(current => {
      const returned = current.map(e => e.def);
      setMainDeck(md => {
        const combined = shuffle([...md, ...returned]);
        const newShop: ShopEntry[] = [];
        const remaining = [...combined];
        for (let i = 0; i < SHOP_SIZE && remaining.length > 0; i++) {
          newShop.push({ uid: uid(), def: remaining.shift()! });
        }
        setShopEntries(guaranteeUnit(newShop));
        return remaining;
      });
      return [];
    });
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
      const affordable = shopEntries.filter(entry => eGold >= entry.def.price);
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
        
        // Remove from shop and draw replacement (same as player)
        setShopEntries(s => s.filter(e => e.uid !== picked.uid));
        setMainDeck(md => {
          if (md.length === 0) return md;
          const [drawn, ...rest] = md;
          setShopEntries(s => guaranteeUnit([...s, { uid: uid(), def: drawn }]));
          return rest;
        });
        
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
      setShopEntries(current => {
        // Return any unsold entries and draw new ones
        setMainDeck(md => {
          const returned = current.map(e => e.def);
          const combined = shuffle([...md, ...returned]);
          const newShop: ShopEntry[] = [];
          const remaining = [...combined];
          for (let i = 0; i < SHOP_SIZE && remaining.length > 0; i++) {
            newShop.push({ uid: uid(), def: remaining.shift()! });
          }
          setShopEntries(guaranteeUnit(newShop));
          return remaining;
        });
        return [];
      });
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
    if (!silent && !confirm("Reset everything?")) return;
    setGold(STARTING_GOLD);
    setDeckCards(["scout", "acolyte", "soldier", "guardian", "mend", "fireball"]
      .map(id => CARD_LIBRARY.find(c => c.id === id)!)
      .map(makeCard));
    setTimeout(() => initMatch(), 50);
  }

  return (
    <div className="min-h-screen w-full text-slate-100" style={{
      backgroundImage: `url('/images/bg_battlefield.png')`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundAttachment: 'fixed'
    }}>
      <div className="mx-auto max-w-7xl px-4 py-5">
        <header
          className="relative mb-4 flex flex-wrap items-center justify-between gap-3 overflow-hidden rounded-2xl border border-slate-700/50 px-4 py-3"
          style={{
            backgroundImage: `linear-gradient(90deg, rgba(15,23,42,0.92), rgba(30,41,59,0.84)), url('/images/card_soldier.jpg')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center 40%'
          }}
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-rose-500 text-xl shadow-lg shadow-amber-500/20">⚔️</div>
            <div>
              <h1 className="text-lg font-bold leading-tight">Lane Clash</h1>
              <p className="text-xs text-slate-400">Round {round} · Main deck: {mainDeck.length + shopEntries.length} cards left</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-bold transition-all duration-500 ${flashGold !== null ? "border-emerald-400/60 bg-emerald-500/25 text-emerald-200 scale-110" : "border-amber-400/40 bg-amber-500/15 text-amber-300"}`}>
              <span className={flashGold !== null ? "animate-bounce" : ""}>💰</span>
              <span className="tabular-nums">{displayGold}</span>
              {flashGold !== null && <span className="text-emerald-200 animate-pulse">+{flashGold}</span>}
            </span>
            <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold transition-all duration-500 ${
              phase === "playerTurn" ? "bg-sky-500/15 text-sky-300 border-sky-500/40"
              : phase === "enemyTurn" ? "bg-rose-500/15 text-rose-300 border-rose-500/40"
              : "bg-amber-500/15 text-amber-300 border-amber-500/40 animate-pulse"
            }`}>
              {phase === "playerTurn" ? "Your Turn" : phase === "enemyTurn" ? "Enemy Turn..." : "Combat"}
            </span>
            <button onClick={initMatch} className="rounded-lg border border-slate-700 bg-slate-800/70 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-700">New Match</button>
            <button onClick={() => resetProgress()} className="rounded-lg border border-rose-700/40 bg-rose-900/30 px-3 py-1.5 text-xs font-medium text-rose-200 hover:bg-rose-900/50">Reset All</button>
          </div>
        </header>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_340px]">
          {/* BATTLE */}
          <div className="flex flex-col">
            {/* Enemy strip — compact */}
            <div
              className={`relative flex items-center justify-between gap-2 overflow-hidden rounded-lg border px-2 py-1.5 transition-all duration-700 border-rose-500/30 ${currentTurn === "enemy" ? "ring-1 ring-rose-400/40" : ""}`}
              style={{
                backgroundImage: `linear-gradient(90deg, rgba(76,5,25,0.92), rgba(15,23,42,0.86)), url('/images/card_raider.jpg')`,
                backgroundSize: 'cover',
                backgroundPosition: 'center 38%'
              }}
            >
              <div className="flex items-center gap-2">
                <span className="text-lg">👹</span>
                <span className="text-xs font-semibold">Enemy</span>
                <span className="text-[10px] text-slate-500">· {enemyDeck.length} cards</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center gap-1 rounded border px-2 py-0.5 text-[10px] font-bold tabular-nums transition-all duration-700 ${flashMana === "enemy" ? "border-indigo-400/50 bg-indigo-500/25 text-indigo-200 scale-110" : "border-indigo-500/30 bg-indigo-500/10 text-indigo-300"}`}>◆ {enemyMana}/{enemyMaxMana}</span>
                <span className={`inline-flex items-center gap-1 rounded border px-2 py-0.5 text-[10px] font-bold tabular-nums transition-all duration-700 ${flashNexus === "enemy" ? "border-rose-400/50 bg-rose-500/25 text-rose-200 scale-110" : "border-amber-500/30 bg-amber-500/10 text-amber-300"}`}>♥ {displayEnemyNexus}</span>
              </div>
            </div>

            {/* Lanes */}
            <div className="my-2">
              <div className="grid grid-cols-3 gap-3">
                {LANES.map(lane => {
                  const e = enemyBoard[lane], p = playerBoard[lane];
                  const canTarget = selectedCard !== null && phase === "playerTurn" && !busy;
                  const validTarget = canTarget && ((selectedCard?.type === "unit" && p === null) || selectedCard?.type === "spell");
                  const isMoveSource = p && movingUnitId === p.id;
                  const isMoveTarget = movingUnitId !== null && !isMoveSource && phase === "playerTurn" && !busy;
                  const pDmg = combatData?.pDmg[lane] ?? null, eDmg = combatData?.eDmg[lane] ?? null;
                  const showDmg = combatStep === "clash" || combatStep === "deaths";

                  const handleLaneClick = () => {
                    if (validTarget && selectedCard) {
                      playCard(selectedCard, lane);
                    } else if (isMoveTarget) {
                      moveUnitToLane(lane);
                    }
                  };

                  return (
                    <div
                      key={lane}
                      onClick={handleLaneClick}
                      className={`relative flex flex-col gap-2 overflow-hidden rounded-2xl border-2 p-2 transition-all duration-500 ${validTarget || isMoveTarget ? "cursor-pointer border-amber-400/70 hover:border-amber-300" : "border-slate-700/60"}`}
                      style={{
                        backgroundImage: `linear-gradient(180deg, rgba(15,23,42,0.78), rgba(2,6,23,0.92)), url('/images/card_guardian.jpg')`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center'
                      }}
                    >
                      <div className="text-center text-[10px] font-bold uppercase tracking-widest text-slate-500">Lane {lane + 1}</div>
                      <div className="flex min-h-[170px] items-center justify-center">
                        {e ? (
                          <div className={`relative flex h-[164px] w-full flex-col justify-between overflow-hidden rounded-xl border-2 p-2.5 transition-all duration-700 border-rose-400/70 bg-gradient-to-b from-rose-800/80 to-rose-950/80 ${showDmg && eDmg !== null ? "ring-2 ring-rose-400/60" : ""} ${combatStep === "deaths" && e.hp <= 0 ? "opacity-30 scale-95 blur-[1px]" : ""}`}>
                            <div className="absolute inset-0 z-0">
                              <img src={`/images/card_${e.cardId}.jpg`} alt={e.name} className="h-full w-full object-cover opacity-70" onError={(ev) => { (ev.target as HTMLImageElement).style.display = 'none'; }} />
                              <div className="absolute inset-0 bg-gradient-to-t from-rose-950/90 via-rose-900/50 to-transparent" />
                            </div>
                            <div className="relative z-10">
                              <div className="text-sm font-extrabold text-white drop-shadow-lg tracking-wide">{e.name}</div>
                            </div>
                            <div className="relative z-10 mt-auto flex items-center justify-between">
                              <span className="rounded-lg bg-amber-500 px-3 py-1 text-xs font-extrabold text-slate-900 shadow-md">⚔ {e.atk}</span>
                              <span className="rounded-lg bg-emerald-500 px-3 py-1 text-xs font-extrabold text-slate-900 shadow-md">♥ {e.hp}</span>
                            </div>
                            {showDmg && eDmg !== null && <div className="pointer-events-none absolute inset-0 flex items-center justify-center"><span className="rounded-full bg-rose-600/90 px-2.5 py-1 text-sm font-bold text-white shadow-lg animate-bounce">-{eDmg}</span></div>}
                          </div>
                        ) : (
                          <div className={`flex h-20 w-full items-center justify-center rounded-lg border border-dashed text-[11px] ${validTarget && selectedCard?.type === "spell" ? "border-amber-400/70 bg-amber-400/5 text-amber-300" : isMoveTarget ? "border-amber-400/70 bg-amber-400/5 text-amber-300" : "border-slate-700/50 text-slate-600"}`}>
                            {validTarget && selectedCard?.type === "spell" ? "Cast here" : isMoveTarget ? "Move here" : "—"}
                          </div>
                        )}
                      </div>
                      <div className="relative flex items-center">
                        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-amber-400/30 to-transparent" />
                        {p && e && <span className="absolute inset-0 flex items-center justify-center bg-[#0a0e1f] px-1.5 text-xs font-bold text-amber-400">⚔</span>}
                      </div>
                       <div className="flex min-h-[170px] items-center justify-center">
                         {p ? (
                           <div
                             onClick={(ev) => { ev.stopPropagation(); selectUnitForMove(p.id); }}
                             className={`relative flex h-[164px] w-full flex-col justify-between overflow-hidden rounded-xl border-2 p-2.5 transition-all duration-700 border-sky-400/70 bg-gradient-to-b from-sky-800/80 to-sky-950/80 cursor-pointer ${isMoveSource ? "ring-2 ring-amber-400 scale-105 shadow-lg shadow-amber-400/30" : ""} ${showDmg && pDmg !== null ? "ring-2 ring-rose-400/60" : ""} ${combatStep === "deaths" && p.hp <= 0 ? "opacity-30 scale-95 blur-[1px]" : ""}`}
                           >
                            <div className="absolute inset-0 z-0">
                              <img src={`/images/card_${p.cardId}.jpg`} alt={p.name} className="h-full w-full object-cover opacity-70" onError={(ev) => { (ev.target as HTMLImageElement).style.display = 'none'; }} />
                              <div className="absolute inset-0 bg-gradient-to-t from-sky-950/90 via-sky-900/50 to-transparent" />
                            </div>
                            <div className="relative z-10">
                              <div className="text-sm font-extrabold text-white drop-shadow-lg tracking-wide">{p.name}</div>
                            </div>
                            <div className="relative z-10 mt-auto flex items-center justify-between">
                              <span className="rounded-lg bg-amber-500 px-3 py-1 text-xs font-extrabold text-slate-900 shadow-md">⚔ {p.atk}</span>
                              <span className="rounded-lg bg-emerald-500 px-3 py-1 text-xs font-extrabold text-slate-900 shadow-md">♥ {p.hp}</span>
                            </div>
                            {isMoveSource && (
                              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                                <span className="rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-black text-slate-900 shadow-lg animate-pulse">MOVING</span>
                              </div>
                            )}
                            {showDmg && pDmg !== null && !isMoveSource && (
                              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                                <span className="rounded-full bg-rose-600/90 px-2.5 py-1 text-sm font-bold text-white shadow-lg animate-bounce">-{pDmg}</span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className={`flex h-20 w-full items-center justify-center rounded-lg border border-dashed text-[11px] ${validTarget && selectedCard?.type === "unit" ? "border-amber-400/70 bg-amber-400/5 text-amber-300" : isMoveTarget ? "border-amber-400/70 bg-amber-400/5 text-amber-300" : "border-slate-700/50 text-slate-600"}`}>
                            {validTarget && selectedCard?.type === "unit" ? "Deploy here" : isMoveTarget ? "Move here" : "—"}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Integrated Command Console: Player Stats + Hand */}
            <div
              className={`relative mt-2 flex flex-col gap-2 overflow-hidden rounded-xl border-2 p-2 transition-all duration-700 ${currentTurn === "player" ? "border-sky-500/50 ring-1 ring-sky-400/30" : "border-slate-700/60"}`}
              style={{
                backgroundImage: `linear-gradient(180deg, rgba(8,47,73,0.88), rgba(15,23,42,0.94)), url('/images/card_knight.jpg')`,
                backgroundSize: 'cover',
                backgroundPosition: 'center 42%'
              }}
            >
              {/* Top stats header — compact single row */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🛡️</span>
                  <span className="text-xs font-bold text-white">You</span>
                  <span className={`text-[10px] ${deckCards.length <= 2 ? "text-amber-400 font-semibold" : "text-slate-500"}`}>
                    · {deckCards.length === 0 ? "⚠ empty" : `${deckCards.length} cards`}
                  </span>
                  {selectedCard && <span className="rounded-full bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 text-[10px] font-bold text-amber-300 animate-pulse">{selectedCard.name} → lane</span>}
                  {movingUnitId && !selectedCard && <span className="rounded-full bg-sky-500/10 border border-sky-500/30 px-2 py-0.5 text-[10px] font-bold text-sky-300 animate-pulse">Moving → lane</span>}
                </div>
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center gap-1 rounded border px-2 py-0.5 text-[10px] font-bold tabular-nums transition-all duration-700 ${flashMana === "player" ? "border-indigo-400/60 bg-indigo-500/25 text-indigo-100 scale-110" : "border-indigo-500/30 bg-indigo-950/40 text-indigo-300"}`}>◆ {playerMana}/{playerMaxMana}</span>
                  <span className={`inline-flex items-center gap-1 rounded border px-2 py-0.5 text-[10px] font-bold tabular-nums transition-all duration-700 ${flashNexus === "player" ? "border-rose-400/60 bg-rose-500/25 text-rose-100 scale-110" : "border-amber-500/30 bg-amber-950/40 text-amber-300"}`}>♥ {displayPlayerNexus}</span>
                </div>
              </div>
              <div className="flex items-end gap-2">
                <div className="flex flex-1 flex-wrap gap-1.5 min-h-[100px]">
                  {deckCards.length === 0 && (
                    <div className="w-full rounded border border-rose-500/40 bg-rose-500/10 px-2 py-1 text-center text-[10px] text-rose-300">
                      ⚠️ Deck empty! Buy cards →
                    </div>
                  )}
                  {deckCards.map(c => {
                    const autoCastable = isAutoCast(c);
                    const isHealNexus = c.effect === "heal_nexus";
                    const isDamageNexus = c.effect === "damage_nexus";
                    const healWouldWaste = isHealNexus && playerNexus >= STARTING_NEXUS;
                    const clickable = canPlay(c) && !healWouldWaste;

                    const handleClick = () => {
                      if (!clickable) return;
                      if (autoCastable) { autoCast(c); }
                      else { setSelectedCardUid(s => s === c.uid ? null : c.uid); }
                    };

                    const isUnit = c.type === "unit";
                    const borderColor = selectedCardUid === c.uid ? "border-amber-400 shadow-lg shadow-amber-400/40" : "border-slate-600/80";

                    return (
                      <button
                        key={c.uid}
                        onClick={handleClick}
                        disabled={!clickable}
                        title={healWouldWaste ? "Nexus already at full HP" : autoCastable ? "Tap to cast" : "Tap to select, then click a lane"}
                        className={`group relative flex h-24 w-20 flex-col overflow-hidden rounded-lg border-2 transition-all duration-300 ${selectedCardUid === c.uid ? "-translate-y-2 scale-105" : "hover:-translate-y-1 hover:scale-[1.02]"} ${clickable ? "cursor-pointer" : "cursor-not-allowed opacity-50"} ${borderColor} ${newlyBoughtUid === c.uid ? "animate-bounce" : ""}`}
                        style={{ background: '#0f172a' }}
                      >
                        {/* Full-bleed card art background */}
                        <div className="absolute inset-0">
                          <img
                            src={`/images/card_${c.id}.jpg`}
                            alt={c.name}
                            className="h-full w-full object-cover opacity-70 group-hover:opacity-90 transition-opacity duration-300"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                          />
                          {/* Dark gradient overlay for text readability */}
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent" />
                        </div>

                        {/* Cost badge */}
                        <div className="absolute top-1 left-1 z-10 flex h-5 w-5 items-center justify-center rounded-full border border-indigo-400/60 bg-indigo-600/90 text-[10px] font-black text-white shadow">{c.cost}</div>

                        {/* Type badge */}
                        <div className="absolute top-1 right-1 z-10 rounded border border-white/20 bg-black/60 px-1 py-0.5 text-[7px] font-bold uppercase tracking-wider text-white/90">
                          {isDamageNexus ? "💥nex" : isHealNexus ? "♥nex" : isUnit ? "unit" : "spell"}
                        </div>

                        {/* Card info at bottom */}
                        <div className="relative z-10 mt-auto flex flex-col gap-0.5 p-1.5">
                          <div className="text-center text-[10px] font-bold leading-tight text-white drop-shadow">{c.name}</div>
                          {isUnit ? (
                            <div className="flex justify-center gap-1.5 text-xs font-bold">
                              <span className="rounded bg-amber-500/90 px-1.5 py-0.5 text-slate-900 shadow text-[9px]">⚔{c.atk}</span>
                              <span className="rounded bg-emerald-500/90 px-1.5 py-0.5 text-slate-900 shadow text-[9px]">♥{c.hp}</span>
                            </div>
                          ) : (
                            <div className="rounded bg-black/50 px-1.5 py-0.5 text-center text-[8px] font-semibold text-white/90">
                              {isDamageNexus ? `💥-${c.value}` : isHealNexus ? `♥+${c.value}` : c.effect === "damage" ? `⚔${c.value}` : `💚${c.value}`}
                            </div>
                          )}
                        </div>

                        {/* Selected ring */}
                        {selectedCardUid === c.uid && (
                          <div className="absolute inset-0 z-20 rounded-xl ring-2 ring-amber-400 ring-offset-2 ring-offset-slate-900" />
                        )}

                        {/* Tap to Cast badge */}
                        {autoCastable && clickable && (
                          <div className="absolute -bottom-2 left-1/2 z-20 -translate-x-1/2 rounded-full bg-amber-400 px-2.5 py-0.5 text-[8px] font-black uppercase tracking-wider text-slate-900 shadow">
                            Tap to Cast
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
                <button onClick={endTurn} disabled={phase !== "playerTurn" || busy || !!winner}
                  className={`shrink-0 rounded-lg bg-gradient-to-b px-4 py-2 text-xs font-bold shadow transition ${phase === "playerTurn" && !busy && !winner ? "from-amber-400 to-amber-600 text-slate-900 shadow-amber-500/20 hover:brightness-110" : "cursor-not-allowed from-slate-700 to-slate-800 text-slate-500 shadow-none"}`}>
                  End Turn ▶
                </button>
              </div>
            </div>
          </div>

          {/* SIDEBAR */}
          <aside className="flex flex-col gap-3">
            {/* MAIN DECK (shared pool) - Face down */}
            <div
              className="relative overflow-hidden rounded-2xl border border-amber-500/30 p-3"
              style={{
                backgroundImage: `linear-gradient(180deg, rgba(30,27,75,0.9), rgba(15,23,42,0.94)), url('/images/card_assassin.jpg')`,
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}
            >
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm">🏪</span>
                  <span className="text-sm font-bold">Main Deck</span>
                  <span className="rounded-full bg-amber-500/15 px-1.5 py-0.5 text-[9px] font-semibold text-amber-300">{mainDeck.length + shopEntries.length} total</span>
                </div>
                <button onClick={refreshShop} disabled={refreshes <= 0 || !!winner}
                  className="rounded-md border border-indigo-500/40 bg-indigo-500/15 px-2 py-1 text-[10px] font-semibold text-indigo-200 hover:bg-indigo-500/25 disabled:cursor-not-allowed disabled:opacity-40">
                  ↻ Refresh ({refreshes})
                </button>
              </div>
              <div className="mb-2 text-[10px] text-slate-400">Buy to add to your deck. Cards shown face-down until bought.</div>
              <div className="grid grid-cols-2 gap-2">
                {shopEntries.map(entry => (
                  <ShopBackCard key={entry.uid} entry={entry} canAfford={gold >= entry.def.price} canBuy={deckCards.length < MAX_DECK} onBuy={() => buyFromShop(entry)} />
                ))}
                {shopEntries.length === 0 && <div className="col-span-2 py-4 text-center text-xs text-slate-500">Main deck exhausted!</div>}
              </div>
            </div>



            {/* HOW IT WORKS */}
            <div
              className="relative overflow-hidden rounded-2xl border border-slate-700/60 p-3"
              style={{
                backgroundImage: `linear-gradient(180deg, rgba(15,23,42,0.9), rgba(2,6,23,0.96)), url('/images/card_acolyte.jpg')`,
                backgroundSize: 'cover',
                backgroundPosition: 'center 35%'
              }}
            >
              <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">How It Works</h3>
              <ul className="space-y-1 text-[10px] leading-snug text-slate-400">
                <li>• <b className="text-amber-300">Main Deck</b>: shared pool, shown face-down until bought.</li>
                <li>• <b>Buy</b> a card → revealed and added to your deck.</li>
                <li>• <b className="text-sky-300">Your Deck</b>: your personal cards. Max {MAX_DECK}.</li>
                <li>• <b className="text-rose-300">Playing a card consumes it permanently.</b></li>
                <li>• <b className="text-emerald-300">Gold earned every round:</b></li>
                <li className="pl-2">– Win: <b className="text-emerald-300">+{GOLD.WIN_ROUND + GOLD.INCOME_PER_ROUND}💰</b> · Tie: +{GOLD.TIE_ROUND + GOLD.INCOME_PER_ROUND}💰 · Lose: +{GOLD.LOSE_ROUND + GOLD.INCOME_PER_ROUND}💰</li>
                <li>• Shop always has ≥1 unit. Refreshes 3× free/round.</li>
                <li>• If deck empty &amp; broke: receive {GOLD.FREE_RESCUE}💰 rescue gold.</li>
              </ul>
            </div>
          </aside>
        </div>

        {toast && <div className="pointer-events-none fixed bottom-6 left-1/2 z-40 -translate-x-1/2 rounded-full border border-amber-400/50 bg-amber-500/90 px-4 py-2 text-sm font-semibold text-slate-900 shadow-lg animate-bounce">{toast}</div>}
        {winner && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm animate-in fade-in duration-500">
            <div className="w-[90%] max-w-sm rounded-2xl border border-slate-700 bg-gradient-to-b from-slate-900 to-slate-950 p-6 text-center shadow-2xl animate-in zoom-in-110 duration-700">
              <div className="mb-2 text-5xl animate-bounce">{winner === "player" ? "🏆" : "💀"}</div>
              <h2 className="mb-1 text-2xl font-bold">{winner === "player" ? "Victory!" : "Defeat"}</h2>
              <p className="mb-2 text-sm text-slate-300">
                {winner === "player" ? `The enemy nexus has fallen. +${GOLD.WIN_MATCH}💰` : "Your nexus was shattered."}
              </p>
              <p className="mb-4 text-xs text-amber-400/80 animate-pulse">
                Auto-resetting and starting new match...
              </p>
              <button onClick={() => resetProgress(true)} className="w-full rounded-lg bg-gradient-to-b from-amber-400 to-amber-600 px-4 py-2 font-bold text-slate-900 hover:brightness-110">
                Reset & Play Now
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ========== SHOP CARD BACK ==========
function ShopBackCard({ entry, canAfford, canBuy, onBuy }: {
  entry: ShopEntry; canAfford: boolean; canBuy: boolean; onBuy: () => void;
}) {
  return (
    <button
      onClick={onBuy}
      disabled={!canAfford || !canBuy}
      className={`group relative flex h-36 flex-col justify-between rounded-lg border-2 p-2 text-left transition-all duration-300 ${
        canAfford && canBuy
          ? "border-amber-500/50 hover:-translate-y-1 hover:border-amber-400 cursor-pointer"
          : "border-slate-700 cursor-not-allowed opacity-60"
      }`}
    >
      {/* Card back design */}
      <div className="relative flex h-full w-full flex-col items-center justify-center overflow-hidden rounded-md"
        style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 30%, #1e1b4b 60%, #0f172a 100%)' }}
      >
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 6px, rgba(251,191,36,0.1) 6px, rgba(251,191,36,0.1) 7px), repeating-linear-gradient(90deg, transparent, transparent 6px, rgba(251,191,36,0.1) 6px, rgba(251,191,36,0.1) 7px)`
        }} />
        {/* Ornamental border */}
        <div className="absolute inset-1 rounded border border-amber-500/30" />
        <div className="absolute inset-2 rounded border border-amber-500/15" />
        {/* Center emblem */}
        <div className="relative flex h-14 w-14 items-center justify-center rounded-full border-2 border-amber-400/50 bg-gradient-to-br from-amber-600/30 to-rose-600/30 shadow-lg shadow-amber-500/20">
          <span className="text-2xl">🎴</span>
        </div>
        <div className="relative mt-2 text-[9px] font-bold uppercase tracking-[0.2em] text-amber-400/50">
          Mystery
        </div>
      </div>
      {/* Price tag - the only thing visible */}
      <div className={`absolute -top-2 -right-2 flex h-7 w-7 items-center justify-center rounded-full border-2 border-amber-300 text-xs font-black shadow-lg ${
        canAfford ? "bg-amber-400 text-slate-900" : "bg-slate-700 text-slate-400"
      }`}>
        {entry.def.price}💰
      </div>
      {/* Type hint */}
      <div className="absolute top-1 left-1 rounded bg-black/40 px-1.5 py-0.5 text-[8px] font-semibold text-slate-300">
        {entry.def.type === "unit" ? "🗡️" : "✨"}
      </div>
    </button>
  );
}
