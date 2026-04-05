import { motion } from "framer-motion";
import {
  Loader2, TrendingUp, Sword, Shield, Skull, Crown,
  Package, ShoppingBag, Coins, Calendar, Fish,
} from "lucide-react";
import { useStats } from "@/hooks/use-stats";
import { formatNumber } from "@/lib/utils";

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

export default function Stats() {
  const { data, isLoading, error } = useStats();

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center h-48">
        <Loader2 size={28} className="animate-spin text-yellow-700/60" />
      </div>
    );
  }

  if (error || !data) {
    return <div className="text-center text-red-500 text-sm py-8">Failed to load stats.</div>;
  }

  const kda = data.monstersDefeated > 0
    ? (data.totalDamageDealt / Math.max(1, data.monstersDefeated)).toFixed(0)
    : "0";

  return (
    <div className="p-4 max-w-lg mx-auto space-y-5">
      <div className="text-center space-y-1">
        <h1 className="font-display text-xl text-yellow-400 tracking-widest uppercase">📊 Stats</h1>
        <p className="text-gray-500 text-xs">Your adventure by the numbers</p>
      </div>

      <div className="flex flex-col gap-2">
        <h2 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 px-1">Combat</h2>
        <div className="grid grid-cols-2 gap-2">
          <StatCard icon={Skull}  label="Monsters Killed" value={data.monstersDefeated} color="text-red-400"    delay={0.04} />
          <StatCard icon={Crown}  label="Bosses Slain"    value={data.bossesDefeated}   color="text-orange-400" delay={0.06} />
          <StatCard icon={Sword}  label="Total Damage"    value={data.totalDamageDealt}  color="text-yellow-400" delay={0.08} />
          <StatCard icon={Shield} label="Damage Taken"    value={data.totalDamageTaken}  color="text-blue-400"   delay={0.10} />
        </div>
        <StatCard icon={TrendingUp} label="Avg Dmg per Kill" value={formatNumber(Number(kda))} sub="total damage ÷ monsters defeated" color="text-green-400" delay={0.12} />
      </div>

      <div className="flex flex-col gap-2">
        <h2 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 px-1">Loot & Economy</h2>
        <div className="grid grid-cols-2 gap-2">
          <StatCard icon={Package}     label="Gear Looted"  value={data.gearLooted}  color="text-purple-400" delay={0.14} />
          <StatCard icon={ShoppingBag} label="Items Sold"   value={data.itemsSold}   color="text-amber-400"  delay={0.16} />
          <StatCard icon={Coins}       label="Gold Earned"  value={data.goldEarned}  color="text-yellow-400" delay={0.18} sub="from kills & sales" />
          <StatCard icon={Coins}       label="Current Gold" value={data.currentGold} color="text-yellow-300" delay={0.20} />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <h2 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 px-1">Progression</h2>
        <div className="grid grid-cols-2 gap-2">
          <StatCard icon={TrendingUp} label="Hero Level"       value={data.level}          color="text-yellow-400" delay={0.22} />
          <StatCard icon={Crown}      label="Ascension Tier"   value={data.ascensionLevel} color="text-violet-400" delay={0.24} sub={data.ascensionLevel === 0 ? "Not yet ascended" : undefined} />
          <StatCard icon={Sword}      label="Melee Skill Lv"   value={data.meleeSkillLevel}   color="text-orange-400" delay={0.26} />
          <StatCard icon={Shield}     label="Defense Skill Lv" value={data.defenseSkillLevel} color="text-blue-400"   delay={0.28} />
        </div>
        <StatCard icon={Calendar} label="Hero Since" value={formatDate(data.createdAt)} sub={data.daysSinceCreation === 0 ? "Started today" : `${data.daysSinceCreation} day${data.daysSinceCreation !== 1 ? "s" : ""} of adventuring`} color="text-gray-400" delay={0.30} />
      </div>
    </div>
  );
}
