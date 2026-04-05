import { usePlayer } from "@/hooks/use-player";
import { Progress } from "@/components/ui/progress";
import { Shield, Sword, Coins, Skull, Sparkles } from "lucide-react";
import { formatNumber } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useRef, useEffect, useState } from "react";

export function PlayerBar() {
  const { data: player } = usePlayer();

  // Flash gold/kills when they change
  const prevGold     = useRef<number>(0);
  const prevKills    = useRef<number>(0);
  const [goldFlash,  setGoldFlash]  = useState(false);
  const [killsFlash, setKillsFlash] = useState(false);

  useEffect(() => {
    if (!player) return;
    if (player.gold > prevGold.current) {
      setGoldFlash(true);
      setTimeout(() => setGoldFlash(false), 600);
    }
    if (player.monstersDefeated > prevKills.current) {
      setKillsFlash(true);
      setTimeout(() => setKillsFlash(false), 600);
    }
    prevGold.current  = player.gold;
    prevKills.current = player.monstersDefeated;
  }, [player?.gold, player?.monstersDefeated]);

  if (!player) return null;

  const hpPct = Math.max(0, Math.min(100, (player.hp / player.maxHp) * 100));
  const xpPct = Math.max(0, Math.min(100, (player.xp / player.xpToNextLevel) * 100));

  const hpColor =
    hpPct > 60 ? "bg-gradient-to-r from-green-800 to-green-500"
    : hpPct > 30 ? "bg-gradient-to-r from-yellow-800 to-yellow-500"
    : "bg-gradient-to-r from-red-800 to-red-500";

  return (
    <div className="sticky top-0 z-50 w-full bg-black/85 backdrop-blur-xl border-b border-yellow-900/30">
      <div className="max-w-3xl mx-auto px-3 py-2.5 flex items-center gap-3">

        {/* Level ring */}
        <div className="relative shrink-0">
          <div className="absolute inset-0 bg-yellow-500/15 blur-md rounded-full" />
          <div className="relative h-11 w-11 rounded-full border-2 border-yellow-600/70 flex items-center justify-center bg-gray-950 shadow-[0_0_12px_rgba(212,175,55,0.25)]">
            <span className="font-display text-sm text-yellow-400 leading-none">{player.level}</span>
          </div>
        </div>

        {/* Name + bars */}
        <div className="flex-1 min-w-0 flex flex-col gap-1.5">
          {/* Name + mini stats */}
          <div className="flex items-center justify-between">
            <h2 className="text-base leading-none m-0">{player.name}</h2>
            <div className="flex items-center gap-2.5 text-xs text-gray-300 font-sans">
              <span className="flex items-center gap-0.5">
                <Sword size={10} className="text-orange-400" />{player.attack}
              </span>
              <span className="flex items-center gap-0.5">
                <Shield size={10} className="text-blue-400" />{player.defense}
              </span>
            </div>
          </div>

          {/* HP bar */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold w-5 text-red-400 shrink-0 text-right">HP</span>
            <div className="flex-1 relative">
              <Progress value={hpPct} indicatorColor={hpColor} className="h-2.5 bg-red-950/40" />
              <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white drop-shadow-md tabular-nums">
                {formatNumber(player.hp)} / {formatNumber(player.maxHp)}
              </span>
            </div>
          </div>

          {/* XP bar */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold w-5 text-blue-400 shrink-0 text-right">XP</span>
            <div className="flex-1 relative">
              <Progress value={xpPct} indicatorColor="bg-gradient-to-r from-blue-900 to-blue-400" className="h-1.5 bg-blue-950/40" />
              <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white/90 drop-shadow tabular-nums">
                {formatNumber(player.xp)} / {formatNumber(player.xpToNextLevel)}
              </span>
            </div>
          </div>
        </div>

        {/* Resources */}
        <div className="flex flex-col gap-1.5 shrink-0">
          <motion.div
            animate={goldFlash ? { scale: [1, 1.15, 1] } : {}}
            transition={{ duration: 0.3 }}
            className="flex items-center gap-1.5 bg-yellow-950/40 px-2.5 py-1 rounded-lg border border-yellow-900/50"
          >
            <Coins size={12} className="text-yellow-500" />
            <span className="font-bold text-yellow-400 font-sans text-[11px] tabular-nums">
              {formatNumber(player.gold)}
            </span>
          </motion.div>

          <motion.div
            animate={killsFlash ? { scale: [1, 1.15, 1] } : {}}
            transition={{ duration: 0.3 }}
            className="flex items-center gap-1.5 bg-red-950/30 px-2.5 py-1 rounded-lg border border-red-900/40"
          >
            <Skull size={12} className="text-red-500" />
            <span className="font-bold text-red-400 font-sans text-[11px] tabular-nums">
              {formatNumber(player.monstersDefeated)}
            </span>
          </motion.div>

          {/* Enchanting stones — only show when player has any */}
          <AnimatePresence>
            {player.enchantingStones > 0 && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                className="flex items-center gap-1.5 bg-violet-950/40 px-2.5 py-1 rounded-lg border border-violet-700/50 shadow-[0_0_8px_rgba(139,92,246,0.25)]"
              >
                <Sparkles size={12} className="text-violet-400" />
                <span className="font-bold text-violet-300 font-sans text-[11px] tabular-nums">
                  {player.enchantingStones}
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>

      {/* Level-up celebration overlay text */}
      <AnimatePresence>
        {xpPct >= 99.5 && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="absolute inset-x-0 bottom-0 flex justify-center"
          >
            <span className="text-[10px] font-bold text-green-400 tracking-widest uppercase pb-0.5 animate-pulse">
              Level up imminent!
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
