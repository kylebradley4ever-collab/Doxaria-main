import { useState } from "react";
import * as Engine from "@/lib/engine";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart, Sparkles, Zap, Coins, Clover,
  Loader2, TrendingUp, ArrowUp, BarChart3,
  Sword, Shield, Skull, Crown, Package, ShoppingBag, Calendar,
  Star, Trophy, Fish, Flame, RefreshCw, CheckCircle, Circle,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useStats } from "@/hooks/use-stats";
import { formatNumber } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────────────────────

interface UpgradeData { level: number; cost: number; }
interface UpgradesResponse {
  vit: UpgradeData; regen: UpgradeData; xp: UpgradeData;
  gold: UpgradeData; luck: UpgradeData; currentGold: number;
}
interface PrestigeResponse {
  prestigeLevel: number; currentLevel: number; requiredLevel: number;
  canPrestige: boolean; xpMultiplier: number; goldMultiplier: number;
  hpBonus: number;
  tier: { name: string; color: string } | null;
  nextTier: { name: string; color: string; minPrestige: number } | null;
}

// ── Upgrade config ─────────────────────────────────────────────────────────

const UPGRADE_CONFIG = [
  {
    key: "vit", label: "Vitality", icon: Heart,
    color: "text-red-400", border: "border-red-900/60",
    glow: "shadow-red-950/80", bg: "bg-red-950/20",
    description: "Increases max HP by 50 per level.",
    effectLabel: (lv: number) => `+${lv * 50} Max HP`,
    nextLabel: () => "+50 Max HP",
  },
  {
    key: "regen", label: "Regeneration", icon: Sparkles,
    color: "text-green-400", border: "border-green-900/60",
    glow: "shadow-green-950/80", bg: "bg-green-950/20",
    description: "Increases HP recovered per kill by 1% of max HP per level.",
    effectLabel: (lv: number) => `${4 + lv}% regen/kill`,
    nextLabel: () => "+1% regen",
  },
  {
    key: "xp", label: "Wisdom", icon: Zap,
    color: "text-blue-400", border: "border-blue-900/60",
    glow: "shadow-blue-950/80", bg: "bg-blue-950/20",
    description: "Increases XP earned from kills by 5% per level.",
    effectLabel: (lv: number) => `+${lv * 5}% XP`,
    nextLabel: () => "+5% XP",
  },
  {
    key: "gold", label: "Fortune", icon: Coins,
    color: "text-yellow-400", border: "border-yellow-900/60",
    glow: "shadow-yellow-950/80", bg: "bg-yellow-950/20",
    description: "Increases gold earned from kills by 10% per level.",
    effectLabel: (lv: number) => `+${lv * 10}% Gold`,
    nextLabel: () => "+10% Gold",
  },
  {
    key: "luck", label: "Luck", icon: Clover,
    color: "text-purple-400", border: "border-purple-900/60",
    glow: "shadow-purple-950/80", bg: "bg-purple-950/20",
    description: "Shifts loot drops toward rarer tiers by 2% per level.",
    effectLabel: (lv: number) => `${Math.min(40, lv * 2)}% better rolls`,
    nextLabel: () => "+2% rarity shift",
  },
] as const;

// ── Achievements ────────────────────────────────────────────────────────────

interface StatsData {
  monstersDefeated: number; bossesDefeated: number;
  totalDamageDealt: number; totalDamageTaken: number;
  gearLooted: number; itemsSold: number;
  goldEarned: number; currentGold: number;
  level: number; ascensionLevel: number;
  meleeSkillLevel: number; defenseSkillLevel: number;
  totalFishCaught?: number; fishingLevel?: number;
  prestigeLevel?: number;
  createdAt: string; daysSinceCreation: number;
}

interface Achievement {
  id: string; name: string; description: string;
  icon: React.ElementType; color: string; category: string;
  progress: (s: StatsData) => number;
  max: number; earned: (s: StatsData) => boolean;
}

const ACHIEVEMENTS: Achievement[] = [
  // ── Combat ──
  { id: "kill10",    name: "First Blood",      description: "Kill 10 monsters.",         icon: Skull,  color: "text-red-400",    category: "Combat",  max: 10,     progress: s => s.monstersDefeated,  earned: s => s.monstersDefeated >= 10 },
  { id: "kill100",   name: "Slaughterer",      description: "Kill 100 monsters.",        icon: Skull,  color: "text-red-400",    category: "Combat",  max: 100,    progress: s => s.monstersDefeated,  earned: s => s.monstersDefeated >= 100 },
  { id: "kill1k",    name: "Massacre",         description: "Kill 1,000 monsters.",      icon: Skull,  color: "text-red-500",    category: "Combat",  max: 1000,   progress: s => s.monstersDefeated,  earned: s => s.monstersDefeated >= 1000 },
  { id: "kill10k",   name: "Eternal Reaper",   description: "Kill 10,000 monsters.",     icon: Skull,  color: "text-red-600",    category: "Combat",  max: 10000,  progress: s => s.monstersDefeated,  earned: s => s.monstersDefeated >= 10000 },
  { id: "boss10",    name: "Boss Slayer",      description: "Defeat 10 bosses.",         icon: Crown,  color: "text-orange-400", category: "Combat",  max: 10,     progress: s => s.bossesDefeated,    earned: s => s.bossesDefeated >= 10 },
  { id: "boss100",   name: "God Killer",       description: "Defeat 100 bosses.",        icon: Crown,  color: "text-orange-500", category: "Combat",  max: 100,    progress: s => s.bossesDefeated,    earned: s => s.bossesDefeated >= 100 },
  { id: "lv25",      name: "Warrior",          description: "Reach level 25.",           icon: Sword,  color: "text-yellow-400", category: "Combat",  max: 25,     progress: s => s.level,             earned: s => s.level >= 25 },
  { id: "lv50",      name: "Champion",         description: "Reach level 50.",           icon: Sword,  color: "text-yellow-500", category: "Combat",  max: 50,     progress: s => s.level,             earned: s => s.level >= 50 },
  { id: "lv100",     name: "Legend",           description: "Reach level 100.",          icon: Star,   color: "text-yellow-400", category: "Combat",  max: 100,    progress: s => s.level,             earned: s => s.level >= 100 },
  { id: "lv500",     name: "Transcendent",     description: "Reach level 500.",          icon: Star,   color: "text-violet-400", category: "Combat",  max: 500,    progress: s => s.level,             earned: s => s.level >= 500 },
  { id: "lv1000",    name: "Void Walker",      description: "Reach level 1,000.",        icon: Star,   color: "text-violet-500", category: "Combat",  max: 1000,   progress: s => s.level,             earned: s => s.level >= 1000 },
  { id: "dmg1m",     name: "Devastator",       description: "Deal 1,000,000 total damage.", icon: Flame, color: "text-orange-400", category: "Combat", max: 1000000, progress: s => s.totalDamageDealt, earned: s => s.totalDamageDealt >= 1000000 },
  // ── Fishing ──
  { id: "fish10",    name: "Nibble",           description: "Catch 10 fish.",            icon: Fish,   color: "text-cyan-400",   category: "Fishing", max: 10,     progress: s => s.totalFishCaught ?? 0, earned: s => (s.totalFishCaught ?? 0) >= 10 },
  { id: "fish100",   name: "Hooked",           description: "Catch 100 fish.",           icon: Fish,   color: "text-cyan-500",   category: "Fishing", max: 100,    progress: s => s.totalFishCaught ?? 0, earned: s => (s.totalFishCaught ?? 0) >= 100 },
  { id: "fish1k",    name: "Angler",           description: "Catch 1,000 fish.",         icon: Fish,   color: "text-teal-400",   category: "Fishing", max: 1000,   progress: s => s.totalFishCaught ?? 0, earned: s => (s.totalFishCaught ?? 0) >= 1000 },
  { id: "fish10k",   name: "Master Angler",    description: "Catch 10,000 fish.",        icon: Fish,   color: "text-teal-500",   category: "Fishing", max: 10000,  progress: s => s.totalFishCaught ?? 0, earned: s => (s.totalFishCaught ?? 0) >= 10000 },
  { id: "fishLv10",  name: "Expert Fisher",    description: "Reach fishing level 10.",   icon: Fish,   color: "text-blue-400",   category: "Fishing", max: 10,     progress: s => s.fishingLevel ?? 0,    earned: s => (s.fishingLevel ?? 0) >= 10 },
  { id: "fishLv50",  name: "Void Fisher",      description: "Reach fishing level 50.",   icon: Fish,   color: "text-blue-500",   category: "Fishing", max: 50,     progress: s => s.fishingLevel ?? 0,    earned: s => (s.fishingLevel ?? 0) >= 50 },
  // ── Economy ──
  { id: "gold10k",   name: "Penny Pincher",    description: "Earn 10,000 gold.",         icon: Coins,  color: "text-yellow-400", category: "Economy", max: 10000,  progress: s => s.goldEarned,        earned: s => s.goldEarned >= 10000 },
  { id: "gold100k",  name: "Merchant",         description: "Earn 100,000 gold.",        icon: Coins,  color: "text-yellow-500", category: "Economy", max: 100000, progress: s => s.goldEarned,        earned: s => s.goldEarned >= 100000 },
  { id: "gold1m",    name: "Millionaire",      description: "Earn 1,000,000 gold.",      icon: Coins,  color: "text-amber-400",  category: "Economy", max: 1000000,progress: s => s.goldEarned,        earned: s => s.goldEarned >= 1000000 },
  { id: "sold100",   name: "Merchant Prince",  description: "Sell 100 items.",           icon: ShoppingBag, color: "text-amber-400", category: "Economy", max: 100, progress: s => s.itemsSold,       earned: s => s.itemsSold >= 100 },
  { id: "sold1k",    name: "Trading Empire",   description: "Sell 1,000 items.",         icon: ShoppingBag, color: "text-amber-500", category: "Economy", max: 1000, progress: s => s.itemsSold,      earned: s => s.itemsSold >= 1000 },
  // ── Combat (extended) ──
  { id: "kill100k",  name: "Obliterator",       description: "Kill 100,000 monsters.",         icon: Skull,  color: "text-red-700",    category: "Combat",  max: 100000,    progress: s => s.monstersDefeated,  earned: s => s.monstersDefeated >= 100000 },
  { id: "kill1m",    name: "World Ender",        description: "Kill 1,000,000 monsters.",       icon: Skull,  color: "text-red-900",    category: "Combat",  max: 1000000,   progress: s => s.monstersDefeated,  earned: s => s.monstersDefeated >= 1000000 },
  { id: "boss500",   name: "Titan Killer",       description: "Defeat 500 bosses.",             icon: Crown,  color: "text-orange-600", category: "Combat",  max: 500,       progress: s => s.bossesDefeated,    earned: s => s.bossesDefeated >= 500 },
  { id: "boss1k",    name: "Slayer of Gods",     description: "Defeat 1,000 bosses.",           icon: Crown,  color: "text-rose-400",   category: "Combat",  max: 1000,      progress: s => s.bossesDefeated,    earned: s => s.bossesDefeated >= 1000 },
  { id: "lv2000",    name: "Godwalker",          description: "Reach level 2,000.",             icon: Star,   color: "text-orange-300", category: "Combat",  max: 2000,      progress: s => s.level,             earned: s => s.level >= 2000 },
  { id: "lv5000",    name: "Reality Shaper",     description: "Reach level 5,000.",             icon: Star,   color: "text-orange-400", category: "Combat",  max: 5000,      progress: s => s.level,             earned: s => s.level >= 5000 },
  { id: "lv10000",   name: "The Absolute",       description: "Reach level 10,000.",            icon: Star,   color: "text-amber-200",  category: "Combat",  max: 10000,     progress: s => s.level,             earned: s => s.level >= 10000 },
  { id: "dmg1b",     name: "Annihilator",        description: "Deal 1 billion total damage.",   icon: Flame,  color: "text-red-500",    category: "Combat",  max: 1000000000,progress: s => s.totalDamageDealt,  earned: s => s.totalDamageDealt >= 1000000000 },
  // ── Fishing (extended) ──
  { id: "fish100k",  name: "Void Angler",        description: "Catch 100,000 fish.",            icon: Fish,   color: "text-teal-600",   category: "Fishing", max: 100000,    progress: s => s.totalFishCaught ?? 0, earned: s => (s.totalFishCaught ?? 0) >= 100000 },
  { id: "fishLv100", name: "Cosmic Fisher",      description: "Reach fishing level 100.",       icon: Fish,   color: "text-blue-600",   category: "Fishing", max: 100,       progress: s => s.fishingLevel ?? 0,    earned: s => (s.fishingLevel ?? 0) >= 100 },
  { id: "fishLv500", name: "Infinite Fisher",    description: "Reach fishing level 500.",       icon: Fish,   color: "text-blue-300",   category: "Fishing", max: 500,       progress: s => s.fishingLevel ?? 0,    earned: s => (s.fishingLevel ?? 0) >= 500 },
  // ── Economy (extended) ──
  { id: "gold1b",    name: "Billionaire",        description: "Earn 1,000,000,000 gold.",       icon: Coins,  color: "text-yellow-300", category: "Economy", max: 1000000000,progress: s => s.goldEarned,            earned: s => s.goldEarned >= 1000000000 },
  { id: "sold10k",   name: "Trade Overlord",     description: "Sell 10,000 items.",             icon: ShoppingBag, color: "text-amber-600", category: "Economy", max: 10000,progress: s => s.itemsSold,           earned: s => s.itemsSold >= 10000 },
  // ── Prestige / Ascension ──
  { id: "asc1",      name: "First Ascension",   description: "Ascend for the first time.",     icon: TrendingUp, color: "text-violet-400",  category: "Prestige", max: 1,    progress: s => s.ascensionLevel,        earned: s => s.ascensionLevel >= 1 },
  { id: "asc5",      name: "Eternal Ascension", description: "Ascend 5 times.",                icon: TrendingUp, color: "text-violet-500",  category: "Prestige", max: 5,    progress: s => s.ascensionLevel,        earned: s => s.ascensionLevel >= 5 },
  { id: "asc10",     name: "Infinite Ascension",description: "Ascend 10 times.",               icon: TrendingUp, color: "text-violet-300",  category: "Prestige", max: 10,   progress: s => s.ascensionLevel,        earned: s => s.ascensionLevel >= 10 },
  { id: "asc25",     name: "Transcendent Ascension", description: "Ascend 25 times.",          icon: TrendingUp, color: "text-violet-200",  category: "Prestige", max: 25,   progress: s => s.ascensionLevel,        earned: s => s.ascensionLevel >= 25 },
  { id: "pres1",     name: "First Prestige",    description: "Prestige for the first time.",   icon: Star,       color: "text-fuchsia-400", category: "Prestige", max: 1,    progress: s => s.prestigeLevel ?? 0,    earned: s => (s.prestigeLevel ?? 0) >= 1 },
  { id: "pres10",    name: "Void Initiate",     description: "Reach Prestige 10.",             icon: Star,       color: "text-fuchsia-500", category: "Prestige", max: 10,   progress: s => s.prestigeLevel ?? 0,    earned: s => (s.prestigeLevel ?? 0) >= 10 },
  { id: "pres50",    name: "Cosmic Sovereign",  description: "Reach Prestige 50.",             icon: Star,       color: "text-fuchsia-600", category: "Prestige", max: 50,   progress: s => s.prestigeLevel ?? 0,    earned: s => (s.prestigeLevel ?? 0) >= 50 },
  { id: "pres100",   name: "Omnipotent",        description: "Reach Prestige 100.",            icon: Star,       color: "text-fuchsia-200", category: "Prestige", max: 100,  progress: s => s.prestigeLevel ?? 0,    earned: s => (s.prestigeLevel ?? 0) >= 100 },
  { id: "pres200",   name: "Infinite Dominion", description: "Reach Prestige 200.",            icon: Star,       color: "text-white",       category: "Prestige", max: 200,  progress: s => s.prestigeLevel ?? 0,    earned: s => (s.prestigeLevel ?? 0) >= 200 },
  { id: "pres500",   name: "Reality Shaper",    description: "Reach Prestige 500.",            icon: Star,       color: "text-amber-200",   category: "Prestige", max: 500,  progress: s => s.prestigeLevel ?? 0,    earned: s => (s.prestigeLevel ?? 0) >= 500 },
  { id: "pres1000",  name: "The Absolute",      description: "Reach Prestige 1,000.",          icon: Star,       color: "text-amber-100",   category: "Prestige", max: 1000, progress: s => s.prestigeLevel ?? 0,    earned: s => (s.prestigeLevel ?? 0) >= 1000 },
];

const ACH_CATEGORIES = ["Combat", "Fishing", "Economy", "Prestige"] as const;

// ── Fetch helpers ──────────────────────────────────────────────────────────

async function fetchUpgrades(): Promise<UpgradesResponse> {
  return Engine.getUpgrades();
}
async function buyUpgrade(type: string): Promise<void> {
  Engine.buyUpgrade(type);
}
async function fetchPrestige(): Promise<PrestigeResponse> {
  return Engine.getPrestige();
}
async function doPrestige(): Promise<{ message: string; prestigeLevel: number }> {
  return Engine.doPrestige();
}

// ── UpgradeCard ────────────────────────────────────────────────────────────

function UpgradeCard({
  cfg, data, currentGold, buying, onBuy,
}: {
  cfg: typeof UPGRADE_CONFIG[number]; data: UpgradeData;
  currentGold: number; buying: boolean; onBuy: () => void;
}) {
  const Icon = cfg.icon;
  const canAfford = currentGold >= data.cost;
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className={`rounded-xl border ${cfg.border} ${cfg.bg} p-4 flex flex-col gap-3`}
    >
      <div className="flex items-center gap-2.5">
        <div className={`w-9 h-9 rounded-lg bg-black/60 border ${cfg.border} flex items-center justify-center ${cfg.color} shrink-0`}>
          <Icon size={17} strokeWidth={1.8} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={`font-display text-sm ${cfg.color}`}>{cfg.label}</span>
            <span className="text-[10px] text-gray-400 font-sans uppercase tracking-widest">Lv {data.level}</span>
          </div>
          <p className="text-[10px] text-gray-500 font-sans leading-tight mt-0.5">{cfg.description}</p>
        </div>
      </div>
      {data.level > 0 && (
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-black/40 border border-gray-800/60">
          <TrendingUp size={11} className="text-gray-500 shrink-0" />
          <span className="text-[11px] text-gray-400 font-sans">{cfg.effectLabel(data.level)}</span>
        </div>
      )}
      <div className="flex items-center gap-2 mt-auto">
        <div className="flex-1 flex items-center gap-1.5 text-[11px] text-gray-500 font-sans">
          <Coins size={11} className="text-yellow-600 shrink-0" />
          <span className={canAfford ? "text-yellow-300" : "text-red-400"}>{formatNumber(data.cost)} gold</span>
          <span className="text-gray-500">•</span>
          <span className="text-gray-500">{cfg.nextLabel()}</span>
        </div>
        <button
          onClick={onBuy} disabled={!canAfford || buying}
          className={[
            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-widest transition-all duration-150",
            canAfford && !buying
              ? `${cfg.color} border ${cfg.border} bg-black/60 hover:bg-black/80 active:scale-95`
              : "text-gray-700 border border-gray-800/40 bg-black/30 cursor-not-allowed",
          ].join(" ")}
        >
          {buying ? <Loader2 size={12} className="animate-spin" /> : <ArrowUp size={12} />}
          {buying ? "…" : "Buy"}
        </button>
      </div>
    </motion.div>
  );
}

// ── StatsView ──────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}
function StatCard({ icon: Icon, label, value, sub, color = "text-yellow-400", delay = 0 }: {
  icon: React.ElementType; label: string; value: string | number; sub?: string;
  color?: string; delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.2 }}
      className="bg-black/60 border border-gray-800/80 rounded-xl p-4 flex items-center gap-3"
    >
      <div className={`shrink-0 w-10 h-10 rounded-lg bg-black/60 border border-gray-800 flex items-center justify-center ${color}`}>
        <Icon size={18} strokeWidth={1.8} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] text-gray-500 uppercase tracking-widest font-sans mb-0.5">{label}</p>
        <p className={`text-xl font-display tabular-nums leading-none ${color}`}>
          {typeof value === "number" ? formatNumber(value) : value}
        </p>
        {sub && <p className="text-[10px] text-gray-400 font-sans mt-0.5">{sub}</p>}
      </div>
    </motion.div>
  );
}
function StatsView() {
  const { data, isLoading, error } = useStats();
  if (isLoading) return <div className="flex-1 flex items-center justify-center"><Loader2 size={28} className="animate-spin text-yellow-700/60" /></div>;
  if (error || !data) return <div className="text-center text-red-500 text-sm py-8">Failed to load stats.</div>;
  const kda = data.monstersDefeated > 0 ? (data.totalDamageDealt / Math.max(1, data.monstersDefeated)).toFixed(0) : "0";
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <h2 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 px-1">Combat</h2>
        <div className="grid grid-cols-2 gap-2">
          <StatCard icon={Skull}  label="Monsters Killed" value={data.monstersDefeated} color="text-red-400"    delay={0.04} />
          <StatCard icon={Crown}  label="Bosses Slain"    value={data.bossesDefeated}   color="text-orange-400" delay={0.06} />
          <StatCard icon={Sword}  label="Total Damage"    value={data.totalDamageDealt}  color="text-yellow-400" delay={0.08} />
          <StatCard icon={Shield} label="Damage Taken"    value={data.totalDamageTaken}  color="text-blue-400"   delay={0.10} />
        </div>
        <StatCard icon={TrendingUp} label="Avg Dmg per Kill" value={formatNumber(Number(kda))} sub="total damage / monsters defeated" color="text-green-400" delay={0.12} />
      </div>
      <div className="flex flex-col gap-2">
        <h2 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 px-1">Loot & Economy</h2>
        <div className="grid grid-cols-2 gap-2">
          <StatCard icon={Package}     label="Gear Looted" value={data.gearLooted}  color="text-purple-400" delay={0.14} />
          <StatCard icon={ShoppingBag} label="Items Sold"  value={data.itemsSold}   color="text-amber-400"  delay={0.16} />
          <StatCard icon={Coins}       label="Gold Earned" value={data.goldEarned}  color="text-yellow-400" delay={0.18} sub="from kills & sales" />
          <StatCard icon={Coins}       label="Current Gold" value={data.currentGold} color="text-yellow-300" delay={0.20} />
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <h2 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 px-1">Progression</h2>
        <div className="grid grid-cols-2 gap-2">
          <StatCard icon={TrendingUp} label="Hero Level"       value={data.level}             color="text-yellow-400" delay={0.22} />
          <StatCard icon={Crown}      label="Ascension Tier"   value={data.ascensionLevel}    color="text-violet-400" delay={0.24} sub={data.ascensionLevel === 0 ? "Not yet ascended" : undefined} />
          <StatCard icon={Sword}      label="Melee Skill Lv"   value={data.meleeSkillLevel}   color="text-orange-400" delay={0.26} />
          <StatCard icon={Shield}     label="Defense Skill Lv" value={data.defenseSkillLevel} color="text-blue-400"   delay={0.28} />
        </div>
        <StatCard icon={Calendar} label="Hero Since" value={formatDate(data.createdAt)} sub={data.daysSinceCreation === 0 ? "Started today" : `${data.daysSinceCreation} day${data.daysSinceCreation !== 1 ? "s" : ""} of adventuring`} color="text-gray-400" delay={0.30} />
      </div>
    </div>
  );
}

// ── PrestigeView ───────────────────────────────────────────────────────────

function PrestigeView() {
  const queryClient = useQueryClient();
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const { data, isLoading, refetch } = useQuery<PrestigeResponse>({
    queryKey: ["prestige"], queryFn: fetchPrestige, staleTime: 3000,
  });
  const mutation = useMutation({
    mutationFn: doPrestige,
    onSuccess: (r) => {
      refetch();
      queryClient.invalidateQueries({ queryKey: ["player"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
      setToast({ msg: r.message, ok: true });
      setTimeout(() => setToast(null), 4000);
    },
    onError: (e: any) => {
      setToast({ msg: e.message ?? "Prestige failed", ok: false });
      setTimeout(() => setToast(null), 3000);
    },
  });

  if (isLoading) return <div className="flex-1 flex items-center justify-center"><Loader2 size={28} className="animate-spin text-fuchsia-700/60" /></div>;
  if (!data) return <div className="text-center text-red-500 text-sm py-8">Failed to load prestige data.</div>;

  const pct = Math.min(100, Math.round((data.currentLevel / data.requiredLevel) * 100));

  return (
    <div className="flex flex-col gap-5">
      {/* Current prestige tier */}
      <motion.div
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        className="rounded-xl border border-fuchsia-900/40 bg-fuchsia-950/15 p-5 flex flex-col gap-4"
      >
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-black/60 border border-fuchsia-900/50 flex items-center justify-center">
            <Star size={22} className="text-fuchsia-400" strokeWidth={1.6} />
          </div>
          <div>
            <p className="text-[10px] text-gray-500 uppercase tracking-widest font-sans">Prestige Level</p>
            <p className="font-display text-3xl tabular-nums leading-none" style={{ color: data.tier?.color ?? "#a78bfa" }}>
              {data.prestigeLevel}
            </p>
            {data.tier && (
              <p className="text-[11px] font-sans font-bold mt-0.5" style={{ color: data.tier.color }}>{data.tier.name}</p>
            )}
            {!data.tier && <p className="text-[11px] text-gray-400 font-sans mt-0.5">No prestige yet</p>}
          </div>
        </div>

        {/* Bonuses */}
        {data.prestigeLevel > 0 && (
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: "XP Bonus", value: `+${Math.round((data.xpMultiplier - 1) * 100)}%`, color: "text-blue-400" },
              { label: "Gold Bonus", value: `+${Math.round((data.goldMultiplier - 1) * 100)}%`, color: "text-yellow-400" },
              { label: "HP Bonus", value: `+${data.hpBonus}`, color: "text-red-400" },
            ].map(b => (
              <div key={b.label} className="flex flex-col items-center gap-0.5 px-2 py-2 rounded-lg bg-black/40 border border-gray-800/60">
                <span className={`font-display text-base tabular-nums ${b.color}`}>{b.value}</span>
                <span className="text-[10px] text-gray-400 uppercase tracking-widest font-sans">{b.label}</span>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Next tier info */}
      {data.nextTier && (
        <motion.div
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-black/40 border border-gray-800/50 text-[11px] text-gray-500 font-sans"
        >
          <Star size={11} style={{ color: data.nextTier.color }} />
          <span>Next tier: <span className="font-bold" style={{ color: data.nextTier.color }}>{data.nextTier.name}</span> at Prestige {data.nextTier.minPrestige}</span>
        </motion.div>
      )}

      {/* Prestige action */}
      <motion.div
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className={`rounded-xl border p-5 flex flex-col gap-4 ${data.canPrestige ? "border-fuchsia-700/50 bg-fuchsia-950/20" : "border-gray-800/50 bg-black/30"}`}
      >
        <div>
          <p className="text-[10px] text-gray-500 uppercase tracking-widest font-sans mb-1">Prestige Reset</p>
          <p className="text-xs text-gray-400 font-sans leading-relaxed">
            Resetting resets your level to 1 but permanently increases XP (+30%) and gold (+20%) earned per prestige level. Gold, inventory, fishing progress, upgrades, and enchanting stones are <span className="text-green-400 font-bold">kept</span>.
          </p>
        </div>

        {/* Level progress bar */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-[10px] font-sans">
            <span className="text-gray-400 uppercase tracking-widest">Level progress</span>
            <span className={data.canPrestige ? "text-fuchsia-400 font-bold" : "text-gray-500"}>
              {data.currentLevel} / {data.requiredLevel}
            </span>
          </div>
          <div className="h-2 rounded-full bg-black/60 border border-gray-800/60 overflow-hidden">
            <motion.div
              className={`h-full rounded-full ${data.canPrestige ? "bg-fuchsia-500" : "bg-gray-700"}`}
              initial={{ width: 0 }} animate={{ width: `${pct}%` }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            />
          </div>
        </div>

        <button
          onClick={() => mutation.mutate()}
          disabled={!data.canPrestige || mutation.isPending}
          className={[
            "flex items-center justify-center gap-2 w-full py-3 rounded-xl font-bold text-sm uppercase tracking-widest transition-all duration-200",
            data.canPrestige && !mutation.isPending
              ? "bg-fuchsia-900/60 border border-fuchsia-700/60 text-fuchsia-300 hover:bg-fuchsia-800/60 active:scale-[0.98]"
              : "bg-black/40 border border-gray-800/40 text-gray-700 cursor-not-allowed",
          ].join(" ")}
        >
          {mutation.isPending ? <Loader2 size={15} className="animate-spin" /> : <RefreshCw size={15} />}
          {mutation.isPending ? "Prestiging…" : data.canPrestige ? "Prestige Now" : `Reach level ${data.requiredLevel}`}
        </button>
      </motion.div>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
            className={`fixed bottom-20 left-1/2 -translate-x-1/2 max-w-xs px-4 py-2 rounded-xl bg-black/95 border text-xs font-bold tracking-widest uppercase shadow-lg text-center
              ${toast.ok ? "border-fuchsia-700/60 text-fuchsia-300" : "border-red-800/60 text-red-400"}`}
          >
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── AchievementsView ───────────────────────────────────────────────────────

function AchievementsView() {
  const { data, isLoading, error } = useStats();
  const [cat, setCat] = useState<typeof ACH_CATEGORIES[number]>("Combat");

  if (isLoading) return <div className="flex-1 flex items-center justify-center"><Loader2 size={28} className="animate-spin text-yellow-700/60" /></div>;
  if (error || !data) return <div className="text-center text-red-500 text-sm py-8">Failed to load achievements.</div>;

  const filtered = ACHIEVEMENTS.filter(a => a.category === cat);
  const totalEarned = ACHIEVEMENTS.filter(a => a.earned(data as StatsData)).length;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-400 uppercase tracking-widest font-sans">{totalEarned}/{ACHIEVEMENTS.length} earned</p>
      </div>

      {/* Category tabs */}
      <div className="flex rounded-lg overflow-hidden border border-gray-800 text-[10px] font-bold uppercase tracking-widest">
        {ACH_CATEGORIES.map(c => (
          <button key={c} onClick={() => setCat(c)}
            className={["flex-1 px-2 py-1.5 transition-colors", cat === c ? "bg-yellow-900/40 text-yellow-300" : "bg-black text-gray-400 hover:text-gray-200"].join(" ")}
          >{c}</button>
        ))}
      </div>

      <div className="flex flex-col gap-2">
        {filtered.map((ach, i) => {
          const earned = ach.earned(data as StatsData);
          const prog = Math.min(ach.max, ach.progress(data as StatsData));
          const pct = Math.min(100, Math.round((prog / ach.max) * 100));
          const Icon = ach.icon;
          return (
            <motion.div
              key={ach.id}
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className={`rounded-xl border p-3 flex items-center gap-3 transition-colors ${
                earned
                  ? "border-yellow-800/50 bg-yellow-950/15"
                  : "border-gray-800/50 bg-black/30"
              }`}
            >
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${earned ? "bg-yellow-900/40 border border-yellow-800/50" : "bg-black/50 border border-gray-800/50"}`}>
                <Icon size={16} className={earned ? ach.color : "text-gray-500"} strokeWidth={1.8} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className={`text-xs font-bold font-sans ${earned ? "text-gray-200" : "text-gray-400"}`}>{ach.name}</span>
                  {earned && <CheckCircle size={11} className="text-green-500 shrink-0" />}
                  {!earned && <Circle size={11} className="text-gray-500 shrink-0" />}
                </div>
                <p className="text-[10px] text-gray-400 font-sans">{ach.description}</p>
                {!earned && (
                  <div className="mt-1.5 flex items-center gap-2">
                    <div className="flex-1 h-1 rounded-full bg-black/60 border border-gray-800/40 overflow-hidden">
                      <div className="h-full rounded-full bg-gray-500" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-[10px] text-gray-400 font-sans tabular-nums shrink-0">{formatNumber(prog)}/{formatNumber(ach.max)}</span>
                  </div>
                )}
              </div>
              {earned && <Trophy size={14} className="text-yellow-600 shrink-0" />}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────

type Tab = "upgrades" | "prestige" | "achievements" | "stats";

const TABS: { key: Tab; label: string; icon: React.ElementType }[] = [
  { key: "upgrades",     label: "Upgrades",     icon: ArrowUp },
  { key: "prestige",     label: "Prestige",     icon: Star },
  { key: "achievements", label: "Achieve",      icon: Trophy },
  { key: "stats",        label: "Stats",        icon: BarChart3 },
];

export default function Upgrades() {
  const [tab, setTab] = useState<Tab>("upgrades");
  const [buying, setBuying] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading, refetch } = useQuery<UpgradesResponse>({
    queryKey: ["upgrades"], queryFn: fetchUpgrades, staleTime: 5000,
  });
  const mutation = useMutation({
    mutationFn: buyUpgrade,
    onSuccess: () => {
      refetch();
      queryClient.invalidateQueries({ queryKey: ["player"] });
    },
  });
  const handleBuy = async (key: string) => {
    if (buying) return;
    setBuying(key);
    try {
      await mutation.mutateAsync(key);
      setToast("Upgraded!");
      setTimeout(() => setToast(null), 1800);
    } catch (e: any) {
      setToast(e.message ?? "Error");
      setTimeout(() => setToast(null), 2500);
    } finally {
      setBuying(null);
    }
  };

  const currentTab = TABS.find(t => t.key === tab)!;
  const TabIcon = currentTab.icon;

  return (
    <div className="flex-1 max-w-3xl mx-auto w-full px-4 pt-4 pb-4 flex flex-col gap-4 overflow-y-auto">
      {/* Header + tabs */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2.5">
          <TabIcon size={20} className="text-yellow-600" />
          <span className="font-display text-xl text-yellow-200/80">{currentTab.label}</span>
        </div>
        <div className="flex rounded-lg overflow-hidden border border-gray-800 text-[10px] font-bold uppercase tracking-widest">
          {TABS.map(t => {
            const Icon = t.icon;
            return (
              <button key={t.key} onClick={() => setTab(t.key)}
                className={["flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 transition-colors", tab === t.key ? "bg-yellow-900/40 text-yellow-300" : "bg-black text-gray-600 hover:text-gray-400"].join(" ")}
              >
                <Icon size={11} />
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {tab === "upgrades" && (
          <motion.div key="upgrades" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-yellow-950/20 border border-yellow-900/40 mb-4">
              <Coins size={14} className="text-yellow-500 shrink-0" />
              <span className="text-[11px] text-gray-500 font-sans uppercase tracking-widest">Available gold</span>
              <span className="ml-auto font-display text-yellow-300 tabular-nums">{isLoading ? "…" : formatNumber(data?.currentGold ?? 0)}</span>
            </div>
            {isLoading ? (
              <div className="flex-1 flex items-center justify-center py-12"><Loader2 size={28} className="animate-spin text-yellow-700/60" /></div>
            ) : data ? (
              <div className="flex flex-col gap-3">
                {UPGRADE_CONFIG.map(cfg => (
                  <UpgradeCard key={cfg.key} cfg={cfg}
                    data={data[cfg.key as keyof UpgradesResponse] as UpgradeData}
                    currentGold={data.currentGold} buying={buying === cfg.key}
                    onBuy={() => handleBuy(cfg.key)}
                  />
                ))}
              </div>
            ) : null}
          </motion.div>
        )}

        {tab === "prestige" && (
          <motion.div key="prestige" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <PrestigeView />
          </motion.div>
        )}

        {tab === "achievements" && (
          <motion.div key="achievements" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <AchievementsView />
          </motion.div>
        )}

        {tab === "stats" && (
          <motion.div key="stats" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <StatsView />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast (upgrades tab) */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
            className="fixed bottom-20 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-black/90 border border-yellow-800/60 text-yellow-300 text-xs font-bold tracking-widest uppercase shadow-lg"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
