import { useInventory, useUnequip } from "@/hooks/use-inventory";
import { usePlayer } from "@/hooks/use-player";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sword, Shield, Footprints, Hand, Gem, CircleDot,
  Loader2, X, TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getRarityGradient } from "@/lib/rarityUtils";
import { ITEM_TYPE_IMAGES } from "@/lib/itemImages";
import type { InventoryItem } from "@/lib/localApi";

type SlotType = "weapon" | "armor" | "boots" | "gloves" | "amulet" | "ring";

const ATK_SLOTS = [
  { type: "weapon" as SlotType, label: "Weapon", Icon: Sword     },
  { type: "gloves" as SlotType, label: "Gloves", Icon: Hand      },
  { type: "ring"   as SlotType, label: "Ring",   Icon: CircleDot },
];

const DEF_SLOTS = [
  { type: "armor"  as SlotType, label: "Armor",  Icon: Shield    },
  { type: "boots"  as SlotType, label: "Boots",  Icon: Footprints},
  { type: "amulet" as SlotType, label: "Amulet", Icon: Gem       },
];

const ALL_SLOTS = [...ATK_SLOTS, ...DEF_SLOTS];

export default function Equipment() {
  const { data: inventory, isLoading } = useInventory();
  const { data: player } = usePlayer();
  const unequip = useUnequip();

  const equipped = Object.fromEntries(
    ALL_SLOTS.map(s => [s.type, inventory?.items.find(i => i.type === s.type && i.equipped)])
  ) as Record<SlotType, InventoryItem | undefined>;

  const totalAtkBonus = ATK_SLOTS.reduce((sum, s) => {
    const item = equipped[s.type];
    return sum + (item ? Math.floor(item.statBonus * (1 + (item.enchantLevel ?? 0) * 0.1)) : 0);
  }, 0);
  const totalDefBonus = DEF_SLOTS.reduce((sum, s) => {
    const item = equipped[s.type];
    return sum + (item ? Math.floor(item.statBonus * (1 + (item.enchantLevel ?? 0) * 0.1)) : 0);
  }, 0);
  const baseAtk = player ? player.attack  - totalAtkBonus : 0;
  const baseDef = player ? player.defense - totalDefBonus : 0;

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="animate-spin text-yellow-500" size={36} />
      </div>
    );
  }

  return (
    <div className="flex-1 max-w-2xl mx-auto w-full px-4 pt-4 pb-2 flex flex-col gap-4">

      {/* ── Stat summary ──────────────────────────────────────────────── */}
      {player && (
        <div className="grid grid-cols-2 gap-3">
          <motion.div
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            className="bg-orange-950/25 border border-orange-800/30 rounded-2xl p-4 flex items-center gap-3"
          >
            <div className="w-10 h-10 rounded-xl bg-orange-950/60 border border-orange-700/40 flex items-center justify-center shrink-0">
              <Sword size={18} className="text-orange-400" />
            </div>
            <div>
              <p className="text-xs text-orange-400 uppercase tracking-widest font-sans mb-0.5">Attack</p>
              <p className="text-2xl font-bold font-sans text-white leading-none tabular-nums">{player.attack}</p>
              {totalAtkBonus > 0 && (
                <p className="text-[10px] text-green-400 font-sans mt-0.5 flex items-center gap-0.5">
                  <TrendingUp size={9} /> {baseAtk} + {totalAtkBonus} gear
                </p>
              )}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
            className="bg-blue-950/25 border border-blue-800/30 rounded-2xl p-4 flex items-center gap-3"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-950/60 border border-blue-700/40 flex items-center justify-center shrink-0">
              <Shield size={18} className="text-blue-400" />
            </div>
            <div>
              <p className="text-xs text-blue-400 uppercase tracking-widest font-sans mb-0.5">Defense</p>
              <p className="text-2xl font-bold font-sans text-white leading-none tabular-nums">{player.defense}</p>
              {totalDefBonus > 0 && (
                <p className="text-[10px] text-green-400 font-sans mt-0.5 flex items-center gap-0.5">
                  <TrendingUp size={9} /> {baseDef} + {totalDefBonus} gear
                </p>
              )}
            </div>
          </motion.div>
        </div>
      )}

      {/* ── Slot columns ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3">

        {/* ATK column */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between px-0.5 mb-1">
            <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-orange-400">
              <Sword size={10} /> Offense
            </span>
            {totalAtkBonus > 0 && (
              <span className="text-[10px] font-bold text-orange-400 font-sans">+{totalAtkBonus}</span>
            )}
          </div>
          {ATK_SLOTS.map((slot, i) => (
            <motion.div
              key={slot.type}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06 }}
            >
              <SlotCard
                slot={slot}
                item={equipped[slot.type]}
                accent="orange"
                onUnequip={() => equipped[slot.type] && unequip.mutate({ id: equipped[slot.type]!.id })}
                isPending={unequip.isPending}
                statLabel="ATK"
              />
            </motion.div>
          ))}
        </div>

        {/* DEF column */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between px-0.5 mb-1">
            <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-blue-400">
              <Shield size={10} /> Defense
            </span>
            {totalDefBonus > 0 && (
              <span className="text-[10px] font-bold text-blue-400 font-sans">+{totalDefBonus}</span>
            )}
          </div>
          {DEF_SLOTS.map((slot, i) => (
            <motion.div
              key={slot.type}
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06 }}
            >
              <SlotCard
                slot={slot}
                item={equipped[slot.type]}
                accent="blue"
                onUnequip={() => equipped[slot.type] && unequip.mutate({ id: equipped[slot.type]!.id })}
                isPending={unequip.isPending}
                statLabel="DEF"
              />
            </motion.div>
          ))}
        </div>

      </div>

      <p className="text-center text-xs text-gray-500 font-sans pb-2">
        Equip items from the Inventory tab
      </p>

    </div>
  );
}

// ── SlotCard ────────────────────────────────────────────────────────────────

interface SlotCardProps {
  slot: { type: SlotType; label: string; Icon: React.FC<{ size?: number; className?: string }> };
  item?: InventoryItem;
  accent: "orange" | "blue";
  statLabel: "ATK" | "DEF";
  onUnequip: () => void;
  isPending: boolean;
}

function SlotCard({ slot, item, accent, statLabel, onUnequip, isPending }: SlotCardProps) {
  const accentBorder  = accent === "orange" ? "border-orange-700/50"      : "border-blue-700/50";
  const accentGlow    = accent === "orange" ? "shadow-[0_0_20px_rgba(251,146,60,0.08)]" : "shadow-[0_0_20px_rgba(96,165,250,0.08)]";
  const accentStatClr = accent === "orange" ? "text-orange-400"            : "text-blue-400";
  const accentLabelClr= accent === "orange" ? "text-orange-400"            : "text-blue-400";

  return (
    <div className={cn(
      "relative rounded-xl border bg-black/50 backdrop-blur transition-all duration-300 overflow-hidden",
      item ? `${accentBorder} ${accentGlow}` : "border-gray-800/50"
    )}>
      {/* Slot label strip */}
      <div className={cn(
        "flex items-center gap-1 px-3 pt-2.5 pb-1 text-[10px] font-bold uppercase tracking-widest",
        accentLabelClr
      )}>
        <slot.Icon size={9} />
        {slot.label}
      </div>

      <AnimatePresence mode="wait">
        {item ? (
          <motion.div
            key="filled"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-2.5 px-3 pb-3"
          >
            {/* Item image */}
            <img
              src={ITEM_TYPE_IMAGES[item.type]}
              alt={item.type}
              className="w-11 h-11 object-contain drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)] shrink-0"
            />

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className={cn(
                "font-bold text-[11px] leading-tight truncate bg-clip-text text-transparent bg-gradient-to-r",
                getRarityGradient(item.rarity)
              )}>
                {item.name}
              </p>
              <p className="text-[10px] text-gray-400 font-sans capitalize">{item.rarity}</p>
              <p className={cn("text-[11px] font-bold font-sans mt-0.5", accentStatClr)}>
                +{item.statBonus} {statLabel}
              </p>
            </div>

            {/* Unequip */}
            <button
              onClick={onUnequip}
              disabled={isPending}
              className="shrink-0 w-6 h-6 flex items-center justify-center rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-950/40 transition-all disabled:opacity-40"
            >
              {isPending
                ? <Loader2 size={10} className="animate-spin" />
                : <X size={10} />}
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-2.5 px-3 pb-3 opacity-25"
          >
            <img
              src={ITEM_TYPE_IMAGES[slot.type]}
              alt={slot.type}
              className="w-9 h-9 object-contain opacity-30 grayscale"
            />
            <span className="text-[10px] text-gray-500 font-sans italic">Empty</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
