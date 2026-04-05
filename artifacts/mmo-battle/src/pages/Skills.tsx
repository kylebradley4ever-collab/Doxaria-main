import { usePlayer } from "@/hooks/use-player";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { useAscendPlayer, getGetPlayerQueryKey } from "@/lib/localApi";
import { useQueryClient } from "@tanstack/react-query";
import { Sword, Shield, Crown } from "lucide-react";

const RARITY_THRESHOLDS = [
  { level: 1,  label: "Novice",    color: "text-gray-400",   glow: "shadow-gray-700/40" },
  { level: 5,  label: "Apprentice",color: "text-green-400",  glow: "shadow-green-700/40" },
  { level: 10, label: "Adept",     color: "text-blue-400",   glow: "shadow-blue-700/40" },
  { level: 20, label: "Expert",    color: "text-purple-400", glow: "shadow-purple-700/40" },
  { level: 35, label: "Master",    color: "text-yellow-400", glow: "shadow-yellow-700/40" },
  { level: 50, label: "Grandmaster",color:"text-orange-400", glow: "shadow-orange-700/40" },
  { level: 75, label: "Legend",    color: "text-red-400",    glow: "shadow-red-700/40" },
  { level: 100,label: "Mythic",    color: "text-pink-400",   glow: "shadow-pink-700/40" },
];

function getTier(level: number) {
  let tier = RARITY_THRESHOLDS[0];
  for (const t of RARITY_THRESHOLDS) {
    if (level >= t.level) tier = t;
  }
  return tier;
}

interface SkillCardProps {
  icon: React.ReactNode;
  name: string;
  level: number;
  xp: number;
  xpToNext: number;
  statLabel: string;
  statValue: string;
  bonusStat: string;
  gainCondition: string;
  delay?: number;
}

function SkillCard({
  icon,
  name,
  level,
  xp,
  xpToNext,
  statLabel,
  statValue,
  bonusStat,
  gainCondition,
  delay = 0,
}: SkillCardProps) {
  const tier = getTier(level);
  const nextTier = RARITY_THRESHOLDS.find(t => t.level > level);
  const pct = Math.min(100, Math.floor((xp / xpToNext) * 100));
  const hitsLeft = xpToNext - xp;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
      className="relative rounded-xl border border-yellow-900/30 bg-gradient-to-b from-gray-900/80 to-black/60 p-4 overflow-hidden"
    >
      <div className={cn("absolute inset-0 opacity-5 blur-2xl rounded-xl", tier.glow)} />

      <div className="relative flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-black/60 border border-yellow-900/40 flex items-center justify-center shrink-0">
            {icon}
          </div>
          <div>
            <div className="font-display text-sm tracking-widest uppercase text-yellow-200/90">{name}</div>
            <div className={cn("text-xs font-bold tracking-wide mt-0.5", tier.color)}>
              {tier.label}
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-display font-bold text-yellow-400 leading-none">
            {level}
          </div>
          <div className="text-[10px] text-gray-400 uppercase tracking-widest mt-0.5">Level</div>
        </div>
      </div>

      <div className="flex gap-2 mb-3">
        <div className="flex-1 rounded-lg border border-yellow-900/30 bg-black/40 px-3 py-2 flex items-center justify-between">
          <span className="text-[11px] uppercase tracking-widest text-gray-400">{statLabel}</span>
          <span className="text-sm font-bold text-yellow-300">{statValue}</span>
        </div>
        <div className="flex-1 rounded-lg border border-yellow-900/30 bg-black/40 px-3 py-2 flex items-center justify-between">
          <span className="text-[11px] uppercase tracking-widest text-gray-400">Bonus</span>
          <span className="text-sm font-bold text-green-400">+{bonusStat}</span>
        </div>
      </div>

      <div className="mb-1.5">
        <div className="flex justify-between items-center mb-1">
          <span className="text-[10px] uppercase tracking-widest text-gray-400">XP to next level</span>
          <span className="text-xs text-gray-400 tabular-nums">{xp} / {xpToNext}</span>
        </div>
        <div className="h-2 rounded-full bg-gray-800/80 border border-gray-700/40 overflow-hidden">
          <motion.div
            className={cn("h-full rounded-full", level >= 100 ? "bg-pink-500" : "bg-gradient-to-r from-yellow-700 via-yellow-500 to-yellow-300")}
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.6, ease: "easeOut", delay: delay + 0.2 }}
          />
        </div>
      </div>

      <div className="flex items-center justify-between mt-2">
        <span className="text-[10px] text-gray-400 leading-snug max-w-[60%]">{gainCondition}</span>
        <span className="text-[10px] text-gray-400">
          {hitsLeft > 0 ? `${hitsLeft} hits to lv${level + 1}` : "MAX"}
        </span>
      </div>

      {nextTier && (
        <div className="mt-2 pt-2 border-t border-yellow-900/20 text-[10px] text-gray-500 tracking-wide">
          Next rank: <span className={nextTier.color}>{nextTier.label}</span> at level {nextTier.level}
        </div>
      )}
    </motion.div>
  );
}

function AscensionPanel({ playerLevel, ascensionLevel }: { playerLevel: number; ascensionLevel: number }) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const { mutate: ascend, isPending } = useAscendPlayer({
    mutation: {
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: getGetPlayerQueryKey() });
        setMessage(data.message);
        setConfirmOpen(false);
      },
      onError: (err: unknown) => {
        const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? "Ascension failed.";
        setMessage(msg);
        setConfirmOpen(false);
      },
    },
  });

  const xpBonus  = Math.round(ascensionLevel * 25);
  const goldBonus = Math.round(ascensionLevel * 15);
  const canAscend = playerLevel >= 100;

  const romanNumerals = ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];
  const tierLabel = ascensionLevel > 0
    ? `Ascendant ${romanNumerals[ascensionLevel] ?? ascensionLevel}`
    : "Unascended";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.3 }}
      className="relative rounded-xl border border-rose-900/40 bg-gradient-to-b from-rose-950/20 to-black/60 p-4 overflow-hidden"
    >
      <div className="absolute inset-0 opacity-10 blur-3xl rounded-xl bg-rose-500" />

      <div className="relative flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-black/60 border border-rose-900/40 flex items-center justify-center shrink-0">
              <Crown size={20} className="text-rose-400" />
            </div>
          <div>
            <div className="font-display text-sm tracking-widest uppercase text-rose-200/90">Ascension</div>
            <div className="text-xs font-bold tracking-wide mt-0.5 text-rose-400">{tierLabel}</div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-display font-bold text-rose-400 leading-none">
            {ascensionLevel}
          </div>
          <div className="text-[10px] text-gray-400 uppercase tracking-widest mt-0.5">Tier</div>
        </div>
      </div>

      {ascensionLevel > 0 && (
        <div className="flex gap-2 mb-3">
          <div className="flex-1 rounded-lg border border-rose-900/40 bg-black/40 px-3 py-2 flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-widest text-gray-400">XP Bonus</span>
            <span className="text-sm font-bold text-green-400">+{xpBonus}%</span>
          </div>
          <div className="flex-1 rounded-lg border border-rose-900/40 bg-black/40 px-3 py-2 flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-widest text-gray-400">Gold Bonus</span>
            <span className="text-sm font-bold text-yellow-400">+{goldBonus}%</span>
          </div>
        </div>
      )}

      <div className="text-xs text-gray-400 mb-3 leading-relaxed">
        Ascend to reset your level to 1 while keeping your skills, gold, and gear.
        Each ascension permanently increases XP gain by 25% and gold gain by 15%.
        Requires level 100.
      </div>

      {canAscend ? (
        <>
          {!confirmOpen ? (
            <button
              onClick={() => { setConfirmOpen(true); setMessage(null); }}
              className="w-full py-2 rounded-lg bg-gradient-to-r from-rose-900 to-rose-700 border border-rose-600 text-rose-100 font-display tracking-widest text-xs uppercase hover:from-rose-800 hover:to-rose-600 transition-all"
            >
              ✦ Ascend ✦
            </button>
          ) : (
            <div className="space-y-2">
              <div className="text-[10px] text-rose-300 text-center tracking-wide">
                You will return to level 1. Skills, gold, and gear are kept. Confirm?
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => ascend(undefined)}
                  disabled={isPending}
                  className="flex-1 py-2 rounded-lg bg-rose-700 border border-rose-500 text-rose-100 text-xs font-bold hover:bg-rose-600 transition-all disabled:opacity-50"
                >
                  {isPending ? "Ascending…" : "Confirm"}
                </button>
                <button
                  onClick={() => setConfirmOpen(false)}
                  className="flex-1 py-2 rounded-lg bg-gray-800 border border-gray-700 text-gray-400 text-xs hover:bg-gray-700 transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="w-full py-2 rounded-lg border border-gray-800 bg-black/40 text-center text-xs text-gray-400 tracking-widest uppercase">
          Reach level 100 to ascend ({100 - playerLevel} levels away)
        </div>
      )}

      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-2 text-[10px] text-center text-rose-300 tracking-wide leading-relaxed"
          >
            {message}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function Skills() {
  const { data: player } = usePlayer();

  if (!player) return null;

  const meleeBonus = (player.meleeSkillLevel - 1) * 3;
  const defBonus   = (player.defenseSkillLevel - 1) * 2;

  return (
    <div className="flex flex-col gap-4 px-3 pt-4 pb-2 max-w-2xl mx-auto w-full">
      <motion.div
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h1 className="font-display text-lg tracking-[0.2em] uppercase text-yellow-400/80">
          Combat Skills
        </h1>
        <p className="text-xs text-gray-400 tracking-widest uppercase mt-0.5">
          Mastery forged through battle
        </p>
      </motion.div>

      <SkillCard
        icon={<Sword size={20} className="text-yellow-400" />}
        name="Melee"
        level={player.meleeSkillLevel}
        xp={player.meleeSkillXp}
        xpToNext={player.meleeSkillXpToNext}
        statLabel="Total ATK"
        statValue={String(player.attack)}
        bonusStat={`${meleeBonus} ATK`}
        gainCondition="+1 XP every time you attack"
        delay={0.05}
      />

      <SkillCard
        icon={<Shield size={20} className="text-blue-400" />}
        name="Defense"
        level={player.defenseSkillLevel}
        xp={player.defenseSkillXp}
        xpToNext={player.defenseSkillXpToNext}
        statLabel="Total DEF"
        statValue={String(player.defense)}
        bonusStat={`${defBonus} DEF`}
        gainCondition="+1 XP every time you are hit"
        delay={0.12}
      />

      <AscensionPanel
        playerLevel={player.level}
        ascensionLevel={player.ascensionLevel}
      />

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="rounded-xl border border-yellow-900/20 bg-black/30 p-3"
      >
        <div className="text-[10px] uppercase tracking-widest text-gray-400 mb-2">XP required per skill level</div>
        <div className="grid grid-cols-2 gap-x-3 gap-y-0.5">
          {[1,2,3,5,10,15,20,35,50,75].map(lv => {
            const xpNeeded = Math.floor(50 * Math.pow(1.5, lv - 1));
            const fmt = (n: number) => {
              if (n >= 1e18) return `${(n/1e18).toFixed(1)}E`;
              if (n >= 1e15) return `${(n/1e15).toFixed(1)}P`;
              if (n >= 1e12) return `${(n/1e12).toFixed(1)}T`;
              if (n >= 1e9)  return `${(n/1e9).toFixed(1)}B`;
              if (n >= 1e6)  return `${(n/1e6).toFixed(1)}M`;
              if (n >= 1e3)  return `${(n/1e3).toFixed(1)}k`;
              return String(n);
            };
            return (
              <div key={lv} className="flex items-center justify-between px-2 py-0.5 rounded bg-gray-900/50 border border-gray-800/30">
                <span className="text-[10px] text-gray-400 shrink-0">Level {lv}</span>
                <span className="text-[10px] text-yellow-500 font-mono tabular-nums">{fmt(xpNeeded)} XP</span>
              </div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}
