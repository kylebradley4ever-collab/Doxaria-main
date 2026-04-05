import { useState, useMemo } from "react";
import { useInventory, useEquip, useUnequip, useSell, useEnchant, useEquipBest } from "@/hooks/use-inventory";
import { usePlayer } from "@/hooks/use-player";
import { getRarityGradient } from "@/lib/rarityUtils";
import { ITEM_TYPE_IMAGES } from "@/lib/itemImages";
import {
  Coins, PackageOpen, Sword, Shield, Footprints,
  Hand, Gem, CircleDot, Loader2, ArrowUpDown,
  ShoppingBag, X, Check, AlertTriangle, Sparkles, FlaskConical, ChevronsUp, Info,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn, formatNumber } from "@/lib/utils";
import type { InventoryItem } from "@/lib/localApi";
import { ItemInfoSheet, type GearInfo } from "@/components/ItemInfoSheet";

// ── Constants ────────────────────────────────────────────────────────────────

const MAX_ENCHANT = 10;

const RARITY_RANK: Record<string, number> = {
  "The Absolute": 0, Genesis: 1, Sovereign: 2, Omnipotent: 3, Primordial: 4,
  Eternal: 5, Cosmic: 6, Transcendent: 7, Abyssal: 8, Divine: 9, Mythic: 10,
  Legendary: 11, Epic: 12, Rare: 13, Uncommon: 14, Common: 15,
};

const FILTER_OPTIONS = [
  { value: "all",    label: "All"    },
  { value: "weapon", label: "Weapon" },
  { value: "gloves", label: "Gloves" },
  { value: "ring",   label: "Ring"   },
  { value: "armor",  label: "Armor"  },
  { value: "boots",  label: "Boots"  },
  { value: "amulet", label: "Amulet" },
] as const;

const SORT_OPTIONS = [
  { value: "rarity", label: "Rarity" },
  { value: "newest", label: "Newest" },
  { value: "type",   label: "Type"   },
] as const;

type FilterValue = typeof FILTER_OPTIONS[number]["value"];
type SortValue   = typeof SORT_OPTIONS[number]["value"];
type ActiveMode  = "default" | "sell" | "enchant";

function getStatLabel(type: string): string {
  return ["weapon", "gloves", "ring"].includes(type) ? "ATK" : "DEF";
}

function getTypeIcon(type: string) {
  switch (type) {
    case "weapon": return <Sword      size={9} className="text-orange-400" />;
    case "armor":  return <Shield     size={9} className="text-blue-400"   />;
    case "boots":  return <Footprints size={9} className="text-teal-400"   />;
    case "gloves": return <Hand       size={9} className="text-orange-300" />;
    case "amulet": return <Gem        size={9} className="text-purple-400" />;
    case "ring":   return <CircleDot  size={9} className="text-yellow-400" />;
    default:       return <Sword      size={9} className="text-gray-400"   />;
  }
}

// ── Rarity helpers ───────────────────────────────────────────────────────────

function rarityBorder(rarity: string) {
  switch (rarity) {
    case "Common":       return "border-gray-800";
    case "Uncommon":     return "border-green-900/80";
    case "Rare":         return "border-blue-800/80";
    case "Epic":         return "border-purple-800/80";
    case "Legendary":    return "border-yellow-700/80";
    case "Mythic":       return "border-red-700 shadow-[0_0_24px_rgba(239,68,68,0.15)]";
    case "Divine":       return "border-amber-300/80 shadow-[0_0_28px_rgba(255,253,200,0.2)]";
    case "Abyssal":      return "border-cyan-500/80 shadow-[0_0_28px_rgba(34,211,238,0.2)]";
    case "Transcendent": return "border-fuchsia-500 shadow-[0_0_32px_rgba(192,132,252,0.3)]";
    case "Cosmic":       return "border-sky-300 shadow-[0_0_36px_rgba(125,211,252,0.35)]";
    case "Eternal":      return "border-rose-300 shadow-[0_0_40px_rgba(253,164,175,0.4)]";
    case "Primordial":   return "border-white shadow-[0_0_48px_rgba(255,255,255,0.5)]";
    case "Omnipotent":   return "border-amber-200 shadow-[0_0_56px_rgba(255,220,100,0.6)]";
    case "Sovereign":    return "border-fuchsia-300 shadow-[0_0_64px_rgba(232,121,249,0.7)]";
    case "Genesis":      return "border-emerald-300 shadow-[0_0_72px_rgba(52,211,153,0.7)]";
    case "The Absolute": return "border-white shadow-[0_0_90px_rgba(255,255,255,0.9)]";
    default:             return "border-gray-800";
  }
}

function rarityBadge(rarity: string) {
  switch (rarity) {
    case "Common":       return "bg-gray-900    text-gray-400    border-gray-700";
    case "Uncommon":     return "bg-green-950   text-green-400   border-green-800";
    case "Rare":         return "bg-blue-950    text-blue-400    border-blue-800";
    case "Epic":         return "bg-purple-950  text-purple-400  border-purple-800";
    case "Legendary":    return "bg-yellow-950  text-yellow-400  border-yellow-800";
    case "Mythic":       return "bg-red-950     text-red-400     border-red-800";
    case "Divine":       return "bg-amber-950   text-amber-200   border-amber-400";
    case "Abyssal":      return "bg-cyan-950    text-cyan-300    border-cyan-600";
    case "Transcendent": return "bg-fuchsia-950 text-fuchsia-300 border-fuchsia-500";
    case "Cosmic":       return "bg-sky-950     text-sky-200     border-sky-400";
    case "Eternal":      return "bg-rose-950    text-rose-200    border-rose-400";
    case "Primordial":   return "bg-zinc-900    text-white       border-white/60";
    case "Omnipotent":   return "bg-amber-950   text-amber-100   border-amber-200";
    case "Sovereign":    return "bg-fuchsia-950 text-fuchsia-100 border-fuchsia-300";
    case "Genesis":      return "bg-emerald-950 text-emerald-100 border-emerald-300";
    case "The Absolute": return "bg-black       text-white       border-white";
    default:             return "bg-gray-900    text-gray-400    border-gray-700";
  }
}

function rarityGlow(rarity: string) {
  switch (rarity) {
    case "Uncommon":     return "bg-green-500";
    case "Rare":         return "bg-blue-500";
    case "Epic":         return "bg-purple-500";
    case "Legendary":    return "bg-yellow-500";
    case "Mythic":       return "bg-red-500";
    case "Divine":       return "bg-amber-200";
    case "Abyssal":      return "bg-cyan-400";
    case "Transcendent": return "bg-fuchsia-500";
    case "Cosmic":       return "bg-sky-300";
    case "Eternal":      return "bg-rose-300";
    case "Primordial":   return "bg-white";
    case "Omnipotent":   return "bg-amber-200";
    case "Sovereign":    return "bg-fuchsia-300";
    case "Genesis":      return "bg-emerald-300";
    case "The Absolute": return "bg-white";
    default:             return "";
  }
}

// ── Main component ───────────────────────────────────────────────────────────

export default function Inventory() {
  const { data, isLoading, error } = useInventory();
  const { data: player }           = usePlayer();
  const equip      = useEquip();
  const unequip    = useUnequip();
  const sell       = useSell();
  const enchant    = useEnchant();
  const equipBest  = useEquipBest();

  const [filter,         setFilter]         = useState<FilterValue>("all");
  const [sort,           setSort]           = useState<SortValue>("rarity");
  const [mode,           setMode]           = useState<ActiveMode>("default");
  const [selectedIds,    setSelectedIds]    = useState<Set<number>>(new Set());
  const [lastSell,       setLastSell]       = useState<{ count: number; gold: number } | null>(null);
  const [lastEnchant,    setLastEnchant]    = useState<string | null>(null);
  const [lastEquipBest,  setLastEquipBest]  = useState<{ count: number } | null>(null);
  const [infoItem,       setInfoItem]       = useState<GearInfo | null>(null);

  const stones = player?.enchantingStones ?? 0;

  const items = useMemo<InventoryItem[]>(() => {
    if (!data?.items) return [];
    let list = filter === "all" ? [...data.items] : data.items.filter(i => i.type === filter);
    if (sort === "rarity")  list.sort((a, b) => RARITY_RANK[a.rarity] - RARITY_RANK[b.rarity]);
    if (sort === "newest")  list.sort((a, b) => b.id - a.id);
    if (sort === "type")    list.sort((a, b) => a.type.localeCompare(b.type) || RARITY_RANK[a.rarity] - RARITY_RANK[b.rarity]);
    return list;
  }, [data?.items, filter, sort]);

  const selectedItems = useMemo(
    () => items.filter(i => selectedIds.has(i.id) && !i.equipped),
    [items, selectedIds],
  );
  const selectedGold = selectedItems.reduce((s, i) => s + i.goldValue, 0);

  const isBusy = equip.isPending || unequip.isPending || sell.isPending || enchant.isPending || equipBest.isPending;

  function setActiveMode(m: ActiveMode) {
    setMode(prev => prev === m ? "default" : m);
    setSelectedIds(new Set());
  }

  function toggleSelect(id: number) {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function cycleSort() {
    const idx = SORT_OPTIONS.findIndex(s => s.value === sort);
    setSort(SORT_OPTIONS[(idx + 1) % SORT_OPTIONS.length].value);
  }

  function handleSellSelected() {
    if (selectedItems.length === 0) return;
    const toSell = [...selectedItems];
    const gold   = selectedGold;
    setSelectedIds(new Set());
    toSell.forEach(item => sell.mutate({ id: item.id }));
    setLastSell({ count: toSell.length, gold });
    setTimeout(() => setLastSell(null), 3000);
  }

  function handleEnchant(item: InventoryItem) {
    enchant.mutate({ id: item.id }, {
      onSuccess: () => {
        setLastEnchant(item.name);
        setTimeout(() => setLastEnchant(null), 2500);
      },
    });
  }

  function handleEquipBest() {
    equipBest.mutate(undefined, {
      onSuccess: (res) => {
        setLastEquipBest({ count: res.equipped.length });
        setTimeout(() => setLastEquipBest(null), 3000);
      },
    });
  }

  // ── Loading / Error ──────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-yellow-700/60">
          <PackageOpen size={40} className="animate-pulse" />
          <p className="font-display text-xs tracking-widest">Opening chest…</p>
        </div>
      </div>
    );
  }
  if (error || !data) {
    return (
      <div className="flex-1 flex items-center justify-center text-red-500 font-sans text-sm">
        Failed to load inventory.
      </div>
    );
  }

  // ── Render ───────────────────────────────────────────────────────
  return (
    <div className="flex-1 max-w-4xl mx-auto w-full px-4 pt-4 pb-2 flex flex-col gap-3">

      {/* ── Header ──────────────────────────────────────────────── */}
      <div className="flex flex-col gap-1.5">
        {/* Title row */}
        <div className="flex items-center gap-2">
          <PackageOpen size={18} className="text-yellow-600 shrink-0" />
          <span className="font-display text-lg text-yellow-200/80">Inventory</span>
          <span className="text-[11px] text-gray-600 font-sans tabular-nums">
            ({data.totalItems})
          </span>
        </div>

        {/* Toolbar row — scrollable so buttons never fall off-screen */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide">
          {/* Equip Best (default mode only) */}
          {mode === "default" && (
            <button
              onClick={handleEquipBest}
              disabled={isBusy}
              className={cn(
                "shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-full border text-[10px] font-bold uppercase tracking-wider transition-all duration-200",
                isBusy
                  ? "border-gray-800 text-gray-700 cursor-not-allowed"
                  : "border-green-800/60 text-green-500 hover:border-green-500 hover:bg-green-950/30"
              )}
            >
              {equipBest.isPending ? <Loader2 size={10} className="animate-spin" /> : <ChevronsUp size={10} />}
              Best
            </button>
          )}

          {/* Enchant toggle */}
          <button
            onClick={() => setActiveMode("enchant")}
            className={cn(
              "shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-full border text-[10px] font-bold uppercase tracking-wider transition-all duration-200",
              mode === "enchant"
                ? "bg-violet-600 text-white border-violet-400 shadow-[0_0_12px_rgba(139,92,246,0.4)]"
                : "bg-transparent text-gray-500 border-gray-800 hover:border-violet-700 hover:text-violet-400"
            )}
          >
            {mode === "enchant" ? <X size={10} /> : <FlaskConical size={10} />}
            {mode === "enchant" ? "Done" : "Enchant"}
            {stones > 0 && mode !== "enchant" && (
              <span className="ml-0.5 text-[9px] bg-violet-700 text-white rounded-full px-1 leading-none py-0.5">
                {stones}
              </span>
            )}
          </button>

          {/* Sell toggle */}
          <button
            onClick={() => setActiveMode("sell")}
            className={cn(
              "shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-full border text-[10px] font-bold uppercase tracking-wider transition-all duration-200",
              mode === "sell"
                ? "bg-amber-600 text-black border-amber-400 shadow-[0_0_12px_rgba(217,119,6,0.4)]"
                : "bg-transparent text-gray-500 border-gray-800 hover:border-amber-700 hover:text-amber-500"
            )}
          >
            {mode === "sell" ? <X size={10} /> : <ShoppingBag size={10} />}
            {mode === "sell" ? "Done" : "Sell"}
          </button>

          {/* Sort (default mode only) */}
          {mode === "default" && (
            <button
              onClick={cycleSort}
              className="shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-full border border-gray-800 text-[10px] font-bold uppercase tracking-wider text-gray-500 hover:text-gray-300 hover:border-gray-600 transition-all"
            >
              <ArrowUpDown size={10} />
              <AnimatePresence mode="wait">
                <motion.span
                  key={sort}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.15 }}
                >
                  {SORT_OPTIONS.find(s => s.value === sort)?.label}
                </motion.span>
              </AnimatePresence>
            </button>
          )}
        </div>
      </div>

      {/* ── Enchant mode banner ──────────────────────────────────── */}
      <AnimatePresence>
        {mode === "enchant" && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="rounded-xl border border-violet-800/50 bg-violet-950/30 px-4 py-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Sparkles size={14} className="text-violet-400 shrink-0" />
                <p className="text-[11px] text-violet-300/80 font-sans">
                  <span className="font-bold">Enchant mode</span> — each +1 costs stones equal to the next level.
                  +1 costs 1, +2 costs 2…+10 costs 10. Max: <span className="text-violet-200 font-bold">+{MAX_ENCHANT}</span>.
                </p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0 bg-violet-900/40 border border-violet-700/50 px-3 py-1.5 rounded-lg">
                <FlaskConical size={12} className="text-violet-400" />
                <span className="text-[11px] font-bold text-violet-200 tabular-nums">{stones}</span>
                <span className="text-[9px] text-violet-500 uppercase tracking-wider">stones</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Sell mode banner ─────────────────────────────────────── */}
      <AnimatePresence>
        {mode === "sell" && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="rounded-xl border border-amber-800/50 bg-amber-950/30 px-4 py-3 flex flex-col gap-2.5">
              <div className="flex items-center gap-2">
                <AlertTriangle size={14} className="text-amber-500 shrink-0" />
                {selectedItems.length === 0 ? (
                  <p className="text-[11px] text-amber-300/80 font-sans">
                    <span className="font-bold">Sell mode</span> — tap items to select them.
                    Equipped items cannot be sold.
                  </p>
                ) : (
                  <p className="text-[11px] text-amber-200 font-sans">
                    <span className="font-bold text-amber-400">{selectedItems.length}</span> item{selectedItems.length !== 1 ? "s" : ""} selected
                    {" · "}
                    <span className="font-bold text-yellow-400">{formatNumber(selectedGold)}g</span>
                  </p>
                )}
              </div>
              <button
                disabled={isBusy || selectedItems.length === 0}
                onClick={handleSellSelected}
                className={cn(
                  "w-full flex items-center justify-center gap-1.5 py-2 rounded-lg border text-[10px] font-bold uppercase tracking-wider transition-all duration-200",
                  selectedItems.length > 0
                    ? "bg-amber-600 text-black border-amber-400 hover:bg-amber-500"
                    : "border-gray-800 text-gray-700 cursor-not-allowed"
                )}
              >
                <Coins size={10} />
                Sell{selectedItems.length > 0 ? ` ${selectedItems.length} item${selectedItems.length !== 1 ? "s" : ""} for ${formatNumber(selectedGold)}g` : ""}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Toast notifications ──────────────────────────────────── */}
      <AnimatePresence>
        {lastSell && (
          <motion.div
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            className="rounded-xl border border-green-800/50 bg-green-950/40 px-4 py-2.5 flex items-center gap-2"
          >
            <Coins size={14} className="text-green-400" />
            <span className="text-[11px] text-green-300 font-sans">
              Sold <span className="font-bold">{lastSell.count}</span> item{lastSell.count !== 1 ? "s" : ""} for{" "}
              <span className="font-bold text-yellow-400">+{formatNumber(lastSell.gold)}g</span>
            </span>
          </motion.div>
        )}
        {lastEnchant && (
          <motion.div
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            className="rounded-xl border border-violet-800/50 bg-violet-950/40 px-4 py-2.5 flex items-center gap-2"
          >
            <Sparkles size={14} className="text-violet-400" />
            <span className="text-[11px] text-violet-200 font-sans">
              <span className="font-bold">{lastEnchant}</span> enchanted! Stat +1.
            </span>
          </motion.div>
        )}
        {lastEquipBest && (
          <motion.div
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            className="rounded-xl border border-green-700/50 bg-green-950/40 px-4 py-2.5 flex items-center gap-2"
          >
            <ChevronsUp size={14} className="text-green-400" />
            <span className="text-[11px] text-green-200 font-sans">
              {lastEquipBest.count > 0
                ? <><span className="font-bold">{lastEquipBest.count}</span> slot{lastEquipBest.count !== 1 ? "s" : ""} upgraded to best gear!</>
                : "Already wearing your best gear."}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Filter pills (default mode only) ────────────────────── */}
      <AnimatePresence>
        {mode === "default" && (
          <motion.div
            initial={false}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-hide"
          >
            {FILTER_OPTIONS.map(f => (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className={cn(
                  "flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full border text-[10px] font-bold uppercase tracking-wider transition-all duration-150 select-none",
                  filter === f.value
                    ? "bg-yellow-600 text-black border-yellow-400 shadow-[0_0_12px_rgba(212,175,55,0.3)]"
                    : "bg-transparent text-gray-500 border-gray-800 hover:border-gray-600 hover:text-gray-300"
                )}
              >
                {f.value !== "all" && (
                  <img
                    src={ITEM_TYPE_IMAGES[f.value]}
                    alt={f.value}
                    className="w-3.5 h-3.5 object-contain"
                  />
                )}
                {f.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Grid ────────────────────────────────────────────────── */}
      {items.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="flex-1 flex flex-col items-center justify-center py-20 border border-yellow-900/20 rounded-2xl bg-black/30"
        >
          <PackageOpen size={52} className="text-yellow-900/40 mb-4" />
          <p className="font-display text-lg text-yellow-800/40">
            {filter === "all" ? "Your bag is empty" : `No ${filter} items`}
          </p>
          <p className="text-gray-700 font-sans text-xs mt-2">
            {filter === "all" ? "Defeat monsters to find loot." : "Try a different filter."}
          </p>
        </motion.div>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2.5">
          <AnimatePresence initial={false}>
            {items.map((item, idx) => (
              <ItemCard
                key={item.id}
                item={item}
                idx={idx}
                mode={mode}
                stones={stones}
                isBusy={isBusy}
                selected={selectedIds.has(item.id)}
                onEquip={()           => equip.mutate({ id: item.id })}
                onUnequip={()         => unequip.mutate({ id: item.id })}
                onToggleSelect={()    => toggleSelect(item.id)}
                onEnchant={()         => handleEnchant(item)}
                onInfo={() => setInfoItem({ kind:"gear", name:item.name, rarity:item.rarity, type:item.type, statBonus:item.statBonus, goldValue:item.goldValue, enchantLevel:item.enchantLevel, equipped:item.equipped, emoji:item.emoji })}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      <ItemInfoSheet item={infoItem} open={!!infoItem} onClose={() => setInfoItem(null)} />
    </div>
  );
}

// ── ItemCard ─────────────────────────────────────────────────────────────────

function ItemCard({
  item, idx, mode, stones, isBusy, selected, onEquip, onUnequip, onToggleSelect, onEnchant, onInfo,
}: {
  item: InventoryItem;
  idx: number;
  mode: ActiveMode;
  stones: number;
  isBusy: boolean;
  selected: boolean;
  onEquip: () => void;
  onUnequip: () => void;
  onToggleSelect: () => void;
  onEnchant: () => void;
  onInfo: () => void;
}) {
  const glow = rarityGlow(item.rarity);
  const isMaxEnchant = item.enchantLevel >= MAX_ENCHANT;

  const stoneCost = item.enchantLevel + 1;
  const dimmed =
    (mode === "sell"    && item.equipped) ||
    (mode === "enchant" && (isMaxEnchant || stones < stoneCost));

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.85 }}
      transition={{ delay: Math.min(idx * 0.03, 0.3), duration: 0.2 }}
      className={cn(
        "relative flex flex-col items-center p-3 rounded-xl border bg-black/60 backdrop-blur-sm transition-all duration-200 group",
        rarityBorder(item.rarity),
        item.equipped && mode === "default" && "ring-2 ring-yellow-500/50 shadow-[0_0_16px_rgba(212,175,55,0.18)]",
        mode === "sell" && !item.equipped && "cursor-pointer",
        mode === "sell" && selected && "ring-2 ring-amber-400 shadow-[0_0_16px_rgba(217,119,6,0.35)] bg-amber-950/30",
        mode === "sell" && !selected && !item.equipped && "ring-1 ring-amber-800/40",
        mode === "enchant" && !isMaxEnchant && stones >= stoneCost && "ring-1 ring-violet-700/40 cursor-pointer",
        dimmed && "opacity-40",
      )}
      onClick={mode === "sell" && !item.equipped ? onToggleSelect : undefined}
    >
      {/* Rarity hover glow */}
      {glow && (
        <div className={cn(
          "absolute inset-0 opacity-0 group-hover:opacity-[0.07] transition-opacity duration-300 rounded-xl", glow
        )} />
      )}

      {/* Selected checkmark overlay */}
      <AnimatePresence>
        {mode === "sell" && selected && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="absolute top-1.5 right-1.5 z-20 w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center shadow-[0_0_8px_rgba(217,119,6,0.6)]"
          >
            <Check size={11} className="text-black" strokeWidth={3} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top-left badge row */}
      <div className="absolute top-1.5 left-1.5 z-20 flex flex-col gap-0.5">
        {item.equipped && mode === "default" && (
          <span className="text-[8px] font-bold uppercase tracking-wider bg-yellow-500 text-black px-1.5 py-0.5 rounded-full leading-none">
            Eq
          </span>
        )}
        {item.enchantLevel > 0 && (
          <span className="text-[8px] font-bold bg-violet-700/80 text-violet-100 px-1.5 py-0.5 rounded-full leading-none flex items-center gap-0.5">
            ✨+{item.enchantLevel}
          </span>
        )}
      </div>

      {/* Info button — default mode only */}
      {mode === "default" && (
        <button
          onClick={(e) => { e.stopPropagation(); onInfo(); }}
          className="absolute top-1.5 right-1.5 z-20 w-5 h-5 rounded-full bg-black/60 border border-white/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          title="Item info"
        >
          <Info size={9} className="text-gray-400" />
        </button>
      )}

      {/* Enchant max badge */}
      {isMaxEnchant && mode === "enchant" && (
        <div className="absolute top-1.5 right-1.5 z-20">
          <span className="text-[7px] font-bold bg-violet-900 text-violet-300 border border-violet-700 px-1 py-0.5 rounded leading-none">
            MAX
          </span>
        </div>
      )}

      {/* Item type image */}
      <img
        src={ITEM_TYPE_IMAGES[item.type]}
        alt={item.type}
        className="w-12 h-12 mt-1 mb-2 object-contain drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)] relative z-10 select-none"
      />

      {/* Name */}
      <p className={cn(
        "text-[10px] font-bold text-center leading-tight mb-1 relative z-10 line-clamp-2 bg-clip-text text-transparent bg-gradient-to-r w-full",
        getRarityGradient(item.rarity)
      )}>
        {item.name}
      </p>

      {/* Rarity badge */}
      <span className={cn(
        "text-[8px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded-full border mb-1.5 relative z-10 leading-none max-w-full truncate text-center",
        rarityBadge(item.rarity)
      )}>
        {item.rarity}
      </span>

      {/* Stat + gold row */}
      <div className="flex items-center justify-between w-full min-w-0 relative z-10 mb-2 gap-0.5">
        <span className="text-[9px] text-gray-400 font-sans flex items-center gap-0.5 min-w-0 shrink truncate">
          {getTypeIcon(item.type)}
          <span className="truncate">+{item.statBonus} {getStatLabel(item.type)}</span>
        </span>
        <span className={cn(
          "text-[9px] flex items-center gap-0.5 font-sans font-bold shrink-0",
          mode === "sell" && !item.equipped ? "text-amber-400" : "text-yellow-600"
        )}>
          <Coins size={8} />{formatNumber(item.goldValue)}
        </span>
      </div>

      {/* Action button */}
      <div className="w-full relative z-10">

        {/* ── ENCHANT MODE ── */}
        {mode === "enchant" && (
          isMaxEnchant ? (
            <div className="w-full text-[9px] font-bold uppercase tracking-wider h-6 rounded-lg border border-violet-900/40 text-violet-800 flex items-center justify-center">
              Max ✨
            </div>
          ) : stones < stoneCost ? (
            <div className="w-full text-[9px] font-bold uppercase tracking-wider h-6 rounded-lg border border-gray-800 text-gray-700 flex items-center justify-center gap-0.5">
              <FlaskConical size={8} />{stones}/{stoneCost} stones
            </div>
          ) : (
            <button
              disabled={isBusy}
              onClick={onEnchant}
              className="w-full text-[9px] font-bold uppercase tracking-wider h-6 rounded-lg border border-violet-700/60 text-violet-300 hover:bg-violet-950/50 hover:text-violet-100 transition-all disabled:opacity-40 flex items-center justify-center gap-0.5"
            >
              {isBusy
                ? <Loader2 size={9} className="animate-spin" />
                : <><Sparkles size={9} /> +1 ({stoneCost} <FlaskConical size={7} />)</>}
            </button>
          )
        )}

        {/* ── SELL MODE ── */}
        {mode === "sell" && (
          item.equipped ? (
            <div className="w-full text-[9px] font-bold uppercase tracking-wider h-6 rounded-lg border border-gray-800 text-gray-700 flex items-center justify-center">
              Equipped
            </div>
          ) : (
            <div className={cn(
              "w-full text-[9px] font-bold h-6 rounded-lg border flex items-center justify-center gap-0.5 transition-all",
              selected
                ? "border-amber-400/60 text-amber-300 bg-amber-950/30"
                : "border-amber-800/40 text-amber-600"
            )}>
              <Coins size={8} />{formatNumber(item.goldValue)}g
            </div>
          )
        )}

        {/* ── DEFAULT MODE ── */}
        {mode === "default" && (
          item.equipped ? (
            <button
              disabled={isBusy}
              onClick={onUnequip}
              className="w-full text-[9px] font-bold uppercase tracking-wider h-6 rounded-lg border border-red-900/60 text-red-500 hover:bg-red-950/40 hover:text-red-300 transition-all disabled:opacity-40 flex items-center justify-center"
            >
              {isBusy ? <Loader2 size={9} className="animate-spin" /> : "Unequip"}
            </button>
          ) : (
            <button
              disabled={isBusy}
              onClick={onEquip}
              className="w-full text-[9px] font-bold uppercase tracking-wider h-6 rounded-lg bg-yellow-700/30 border border-yellow-700/40 text-yellow-300 hover:bg-yellow-700/50 hover:text-yellow-200 transition-all disabled:opacity-40 flex items-center justify-center"
            >
              {isBusy ? <Loader2 size={9} className="animate-spin" /> : "Equip"}
            </button>
          )
        )}

      </div>
    </motion.div>
  );
}
