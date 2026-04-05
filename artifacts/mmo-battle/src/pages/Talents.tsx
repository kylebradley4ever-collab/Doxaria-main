import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Zap, RotateCcw, Loader2, Lock, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import * as Engine from "@/lib/engine";

interface TalentResponse {
  talentPoints: number;
  spent: { atk: number; def: number; hp: number; crit: number; speed: number; luck: number };
  totalSpent: number;
  bonuses: { atkBonus: number; defBonus: number; hpBonus: number; critChance: number; speedBonus: number; luckBonus: number };
}

const TALENT_CONFIG = [
  { key: "atk",   label: "Strength",  emoji: "⚔️",  desc: "+3 ATK per point",       color: "red",    glow: "shadow-red-900/60",    border: "border-red-900/40",    bg: "bg-red-950/30"    },
  { key: "def",   label: "Fortitude", emoji: "🛡️",  desc: "+2 DEF per point",       color: "blue",   glow: "shadow-blue-900/60",   border: "border-blue-900/40",   bg: "bg-blue-950/30"   },
  { key: "hp",    label: "Endurance", emoji: "❤️",  desc: "+25 Max HP per point",    color: "green",  glow: "shadow-green-900/60",  border: "border-green-900/40",  bg: "bg-green-950/30"  },
  { key: "crit",  label: "Precision", emoji: "🎯",  desc: "+0.5% Crit/point",        color: "yellow", glow: "shadow-yellow-900/60", border: "border-yellow-900/40", bg: "bg-yellow-950/30" },
  { key: "speed", label: "Swiftness", emoji: "💨",  desc: "+1% Atk Speed/point",     color: "cyan",   glow: "shadow-cyan-900/60",   border: "border-cyan-900/40",   bg: "bg-cyan-950/30"   },
  { key: "luck",  label: "Fortune",   emoji: "🍀",  desc: "+1% Luck per point",      color: "purple", glow: "shadow-purple-900/60", border: "border-purple-900/40", bg: "bg-purple-950/30" },
] as const;

const COLOR_MAP: Record<string, string> = {
  red: "text-red-400", blue: "text-blue-400", green: "text-green-400",
  yellow: "text-yellow-400", cyan: "text-cyan-400", purple: "text-purple-400",
};

const BTN_COLOR_MAP: Record<string, string> = {
  red: "border-red-600/50 hover:bg-red-900/30 text-red-400",
  blue: "border-blue-600/50 hover:bg-blue-900/30 text-blue-400",
  green: "border-green-600/50 hover:bg-green-900/30 text-green-400",
  yellow: "border-yellow-600/50 hover:bg-yellow-900/30 text-yellow-400",
  cyan: "border-cyan-600/50 hover:bg-cyan-900/30 text-cyan-400",
  purple: "border-purple-600/50 hover:bg-purple-900/30 text-purple-400",
};

export default function Talents() {
  const qc = useQueryClient();
  const [spending, setSpending] = useState<string | null>(null);
  const [resetting, setResetting] = useState(false);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);

  const { data, isLoading } = useQuery<TalentResponse>({
    queryKey: ["talents"],
    queryFn: () => Engine.getTalents(),
    refetchInterval: 5000,
  });

  const spendMut = useMutation({
    mutationFn: async (talent: string) => Engine.spendTalent(talent),
    onMutate: (t) => setSpending(t),
    onSettled: () => setSpending(null),
    onError: (e) => { setMessage({ text: (e as Error).message, ok: false }); },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["talents"] });
      qc.invalidateQueries({ queryKey: ["player"] });
      setMessage({ text: "Talent point spent!", ok: true });
      setTimeout(() => setMessage(null), 2000);
    },
  });

  const resetMut = useMutation({
    mutationFn: async () => Engine.resetTalents(),
    onMutate: () => setResetting(true),
    onSettled: () => setResetting(false),
    onError: (e) => { setMessage({ text: (e as Error).message, ok: false }); },
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["talents"] });
      qc.invalidateQueries({ queryKey: ["player"] });
      setMessage({ text: `Reset! Refunded ${res.refunded} points.`, ok: true });
      setTimeout(() => setMessage(null), 3000);
    },
  });

  if (isLoading || !data) {
    return <div className="flex justify-center items-center h-48"><Loader2 className="animate-spin text-yellow-600" size={32} /></div>;
  }

  const bonusLabels: Record<string, string> = {
    atk:   `+${data.bonuses.atkBonus} ATK`,
    def:   `+${data.bonuses.defBonus} DEF`,
    hp:    `+${data.bonuses.hpBonus} Max HP`,
    crit:  `+${data.bonuses.critChance.toFixed(1)}% Crit`,
    speed: `+${data.bonuses.speedBonus}% Speed`,
    luck:  `+${data.bonuses.luckBonus}% Luck`,
  };

  return (
    <div className="p-4 max-w-lg mx-auto space-y-4">
      <div className="text-center space-y-1">
        <h1 className="font-display text-xl text-yellow-400 tracking-widest uppercase flex items-center justify-center gap-2">
          <Zap size={18} /> Talent Tree
        </h1>
        <p className="text-gray-500 text-xs">Earn 1 point per level. Customize your hero permanently.</p>
      </div>

      <motion.div
        className="rounded-xl border border-yellow-900/40 bg-yellow-950/20 p-4 text-center"
        animate={{ scale: data.talentPoints > 0 ? [1, 1.02, 1] : 1 }}
        transition={{ repeat: data.talentPoints > 0 ? Infinity : 0, duration: 2 }}
      >
        <div className="text-4xl font-bold text-yellow-400">{data.talentPoints}</div>
        <div className="text-yellow-700 text-xs uppercase tracking-widest mt-1">Available Points</div>
        <div className="text-gray-400 text-xs mt-1">{data.totalSpent} points spent</div>
      </motion.div>

      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className={cn("text-center text-sm rounded-lg py-2 px-4", message.ok ? "text-green-400 bg-green-950/30" : "text-red-400 bg-red-950/30")}
          >
            {message.text}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-2 gap-3">
        {TALENT_CONFIG.map(t => {
          const spent = data.spent[t.key as keyof typeof data.spent];
          const isSpending = spending === t.key;
          return (
            <motion.div
              key={t.key}
              whileTap={{ scale: 0.97 }}
              className={cn("rounded-xl border p-3 space-y-2", t.border, t.bg)}
            >
              <div className="flex items-center justify-between">
                <span className="text-lg">{t.emoji}</span>
                <span className={cn("font-bold text-sm", COLOR_MAP[t.color])}>{spent} pts</span>
              </div>
              <div>
                <div className={cn("font-bold text-sm", COLOR_MAP[t.color])}>{t.label}</div>
                <div className="text-gray-500 text-xs">{t.desc}</div>
                {spent > 0 && (
                  <div className={cn("text-xs font-bold mt-1", COLOR_MAP[t.color])}>{bonusLabels[t.key]}</div>
                )}
              </div>
              <button
                onClick={() => spendMut.mutate(t.key)}
                disabled={data.talentPoints <= 0 || isSpending}
                className={cn(
                  "w-full py-1.5 rounded-lg border text-xs font-bold transition-colors flex items-center justify-center gap-1",
                  data.talentPoints > 0 ? BTN_COLOR_MAP[t.color] : "border-gray-800 text-gray-700 cursor-not-allowed"
                )}
              >
                {isSpending ? <Loader2 size={12} className="animate-spin" /> : <ChevronUp size={12} />}
                Spend Point
              </button>
            </motion.div>
          );
        })}
      </div>

      {data.totalSpent > 0 && (
        <button
          onClick={() => resetMut.mutate()}
          disabled={resetting}
          className="w-full py-2 rounded-xl border border-red-900/40 text-red-500 text-xs font-bold hover:bg-red-950/30 transition-colors flex items-center justify-center gap-2"
        >
          {resetting ? <Loader2 size={14} className="animate-spin" /> : <RotateCcw size={14} />}
          Reset All Talents (costs gold)
        </button>
      )}

      <div className="rounded-xl border border-gray-800 bg-gray-950/50 p-3 space-y-1">
        <div className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-2">Active Bonuses</div>
        {TALENT_CONFIG.map(t => (
          <div key={t.key} className="flex justify-between text-xs">
            <span className="text-gray-400">{t.emoji} {t.label}</span>
            <span className={cn("font-bold", data.spent[t.key as keyof typeof data.spent] > 0 ? COLOR_MAP[t.color] : "text-gray-500")}>
              {bonusLabels[t.key]}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
