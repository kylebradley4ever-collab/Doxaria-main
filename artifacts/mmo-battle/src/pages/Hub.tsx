import { useState, useEffect } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { usePlayer } from "@/hooks/use-player";
import { Loader2, Gift, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import * as Engine from "@/lib/engine";

interface LoginReward { day: number; gold: number; stones: number; label: string; special?: boolean; }
interface LoginBonusResponse {
  streak: number; alreadyClaimed: boolean; nextReward: LoginReward;
  rewards: LoginReward[]; currentDay: number; lastLoginDate: string | null;
}

const HUB_FEATURES = [
  { href: "/tower",       emoji: "🗼", label: "Infinite Tower", desc: "Climb endless floors, no ceiling", color: "purple" },
  { href: "/talents",     emoji: "🌟", label: "Talent Tree",    desc: "Spend points to boost your hero",  color: "yellow" },
  { href: "/pets",        emoji: "🐾", label: "Pets",           desc: "Collect companion creatures",       color: "green"  },
  { href: "/skills",      emoji: "⚔️", label: "Skills",         desc: "Melee & defense XP per hit",       color: "blue"   },
  { href: "/alchemy",     emoji: "⚗️", label: "Alchemy",        desc: "Brew powerful potions",             color: "purple" },
  { href: "/arena",       emoji: "🏟️", label: "Arena",          desc: "PvP battles & rankings",            color: "red"    },
  { href: "/challenge",   emoji: "🔥", label: "Challenge Mode", desc: "Endless wave survival",             color: "orange" },
  { href: "/map",         emoji: "🗺️", label: "World Map",      desc: "Explore all zones",                 color: "blue"   },
  { href: "/stats",       emoji: "📊", label: "Stats",          desc: "Your adventure by the numbers",     color: "gray"   },
  { href: "/codex",       emoji: "📖", label: "Monster Codex",  desc: "Bestiary of slain creatures",       color: "gray"   },
  { href: "/leaderboard", emoji: "🏆", label: "Leaderboard",    desc: "Top players worldwide",             color: "gold"   },
];

const HUB_COLORS: Record<string, { border: string; bg: string; text: string }> = {
  yellow: { border: "border-yellow-900/40", bg: "bg-yellow-950/20", text: "text-yellow-400" },
  green:  { border: "border-green-900/40",  bg: "bg-green-950/20",  text: "text-green-400"  },
  purple: { border: "border-purple-900/40", bg: "bg-purple-950/20", text: "text-purple-400" },
  red:    { border: "border-red-900/40",    bg: "bg-red-950/20",    text: "text-red-400"    },
  orange: { border: "border-orange-900/40", bg: "bg-orange-950/20", text: "text-orange-400" },
  blue:   { border: "border-blue-900/40",   bg: "bg-blue-950/20",   text: "text-blue-400"   },
  gray:   { border: "border-gray-800",      bg: "bg-gray-900/30",   text: "text-gray-400"   },
  gold:   { border: "border-amber-800/40",  bg: "bg-amber-950/20",  text: "text-amber-400"  },
};

function LoginBonusModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const [claimed, setClaimed] = useState(false);
  const [reward, setReward] = useState<LoginReward | null>(null);

  const { data } = useQuery<LoginBonusResponse>({
    queryKey: ["login-bonus"],
    queryFn: () => Engine.getLoginBonus(),
  });

  const claimMut = useMutation({
    mutationFn: async () => Engine.claimLoginBonus(),
    onSuccess: (res) => {
      setClaimed(true);
      setReward(res.reward);
      qc.invalidateQueries({ queryKey: ["login-bonus"] });
      qc.invalidateQueries({ queryKey: ["player"] });
    },
  });

  if (!data) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.8, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.8, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-gray-950 border border-yellow-900/60 rounded-2xl p-5 w-full max-w-sm space-y-4"
      >
        <div className="text-center">
          <div className="text-4xl mb-2">🎁</div>
          <h2 className="font-display text-yellow-400 text-lg tracking-widest uppercase">Daily Login</h2>
          <p className="text-gray-400 text-xs mt-1">Day Streak: <span className="text-yellow-400 font-bold">{data.streak}</span></p>
        </div>

        <div className="grid grid-cols-7 gap-1">
          {data.rewards.map((r, i) => {
            const isPast = i < data.currentDay;
            const isCurrent = i === data.currentDay;
            const isFuture = i > data.currentDay;
            return (
              <div key={i} className={cn(
                "rounded-lg p-1.5 text-center transition-all",
                isCurrent ? "border border-yellow-700/60 bg-yellow-950/40 ring-1 ring-yellow-500/30" :
                isPast ? "border border-green-900/40 bg-green-950/20" :
                "border border-gray-800 bg-gray-900/30 opacity-40"
              )}>
                <div className="text-xs">{isPast ? "✓" : isCurrent ? "⭐" : "🔒"}</div>
                <div className={cn("text-xs font-bold", isCurrent ? "text-yellow-400" : isPast ? "text-green-400" : "text-gray-600")}>
                  {r.day}
                </div>
              </div>
            );
          })}
        </div>

        {!claimed && !data.alreadyClaimed ? (
          <div className="space-y-3">
            <div className="rounded-xl border border-yellow-900/40 bg-yellow-950/20 p-3 text-center">
              <div className="text-2xl mb-1">{data.nextReward.special ? "⭐" : "🎁"}</div>
              <div className="text-yellow-400 font-bold">{data.nextReward.label}</div>
              <div className="text-green-400 text-sm">+{data.nextReward.gold.toLocaleString()} Gold</div>
              {data.nextReward.stones > 0 && <div className="text-purple-400 text-sm">+{data.nextReward.stones} Enchanting Stone{data.nextReward.stones !== 1 ? "s" : ""}</div>}
            </div>
            <button
              onClick={() => claimMut.mutate()}
              disabled={claimMut.isPending}
              className="w-full py-2.5 rounded-xl border border-yellow-700/50 bg-yellow-950/30 text-yellow-400 font-bold hover:bg-yellow-950/50 transition-colors flex items-center justify-center gap-2"
            >
              {claimMut.isPending ? <Loader2 size={16} className="animate-spin" /> : <Gift size={16} />}
              Claim Reward
            </button>
          </div>
        ) : claimed && reward ? (
          <div className="text-center space-y-2">
            <CheckCircle size={32} className="text-green-400 mx-auto" />
            <div className="text-green-400 font-bold">Claimed!</div>
            <div className="text-sm text-gray-300">+{reward.gold.toLocaleString()} Gold{reward.stones > 0 ? ` & +${reward.stones} Stones` : ""}</div>
            <button onClick={onClose} className="text-gray-500 text-xs hover:text-gray-400">Close</button>
          </div>
        ) : (
          <div className="text-center text-gray-500 text-sm">
            <CheckCircle size={24} className="text-green-400 mx-auto mb-2" />
            Already claimed today. Come back tomorrow!
          </div>
        )}

        <button onClick={onClose} className="w-full text-gray-400 text-xs hover:text-gray-300 py-1">Close</button>
      </motion.div>
    </motion.div>
  );
}

export default function Hub() {
  const { data: player } = usePlayer();
  const [showLoginBonus, setShowLoginBonus] = useState(false);

  const { data: loginData } = useQuery<LoginBonusResponse>({
    queryKey: ["login-bonus"],
    queryFn: () => Engine.getLoginBonus(),
  });

  useEffect(() => {
    if (!loginData || loginData.alreadyClaimed) return;
    const timer = setTimeout(() => setShowLoginBonus(true), 500);
    return () => clearTimeout(timer);
  }, [loginData]);

  return (
    <div className="p-4 max-w-lg mx-auto space-y-4">
      <div className="text-center space-y-1">
        <h1 className="font-display text-xl text-yellow-400 tracking-widest uppercase">⚡ Hub</h1>
        <p className="text-gray-400 text-xs">Access all game features</p>
        {loginData && !loginData.alreadyClaimed && (
          <motion.button
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
            onClick={() => setShowLoginBonus(true)}
            className="inline-flex items-center gap-1 px-3 py-1 rounded-full border border-yellow-700/50 bg-yellow-950/30 text-yellow-400 text-xs font-bold"
          >
            <Gift size={12} />
            Daily Bonus Available!
          </motion.button>
        )}
      </div>

      {player && (
        <div className="rounded-xl border border-gray-800 bg-gray-900/40 p-3 grid grid-cols-4 gap-2 text-center text-xs">
          <div><div className="text-yellow-400 font-bold">{player.level}</div><div className="text-gray-400 text-xs">Level</div></div>
          <div><div className="text-purple-400 font-bold">{player.prestigeLevel || 0}</div><div className="text-gray-400 text-xs">Prestige</div></div>
          <div><div className="text-green-400 font-bold">{(player.gold || 0).toLocaleString()}</div><div className="text-gray-400 text-xs">Gold</div></div>
          <div><div className="text-orange-400 font-bold">{(player as any).talentPoints || 0}</div><div className="text-gray-400 text-xs">Talents</div></div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        {HUB_FEATURES.map((feature, i) => {
          const colors = HUB_COLORS[feature.color];
          return (
            <motion.div
              key={feature.href}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
            >
              <Link href={feature.href}>
                <div className={cn(
                  "rounded-xl border p-3 space-y-1.5 cursor-pointer hover:opacity-80 active:scale-95 transition-all",
                  colors.border, colors.bg
                )}>
                  <div className="text-2xl">{feature.emoji}</div>
                  <div className={cn("font-bold text-sm", colors.text)}>{feature.label}</div>
                  <div className="text-gray-400 text-xs">{feature.desc}</div>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>

      <div className="rounded-xl border border-gray-800 bg-gray-900/30 p-3 text-center">
        <button
          onClick={() => setShowLoginBonus(true)}
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-300 transition-colors mx-auto"
        >
          <Gift size={16} />
          Daily Login Bonus {loginData?.alreadyClaimed ? "(claimed)" : "(available!)"}
          {!loginData?.alreadyClaimed && <span className="text-yellow-400 animate-pulse">●</span>}
        </button>
        {loginData && <p className="text-gray-400 text-xs mt-1">Login Streak: {loginData.streak} day{loginData.streak !== 1 ? "s" : ""}</p>}
      </div>

      <a
        href="https://discord.gg/2J8djzzav6"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 rounded-xl border border-indigo-700/40 bg-indigo-950/30 py-3 px-4 text-indigo-300 hover:bg-indigo-950/60 hover:text-indigo-100 hover:border-indigo-600/60 transition-all"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
          <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057c.002.022.015.043.031.052a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
        </svg>
        <span className="font-bold text-sm tracking-wide">Join our Discord</span>
      </a>

      <AnimatePresence>
        {showLoginBonus && <LoginBonusModal onClose={() => setShowLoginBonus(false)} />}
      </AnimatePresence>
    </div>
  );
}
