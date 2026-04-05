import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Swords, Trophy, Shield, Sword, Heart, Crown, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import * as Engine from "@/lib/engine";

interface ArenaTier { name: string; color: string; reward: number; minPoints: number; }
interface ArenaOpponent { id: number; name: string; level: number; attack: number; defense: number; maxHp: number; arenaPoints: number; prestigeLevel: number; }
interface ArenaResponse {
  myStats: { attack: number; defense: number; maxHp: number; level: number };
  arenaPoints: number; arenaWins: number; arenaLosses: number;
  arenaTier: ArenaTier; nextTier: ArenaTier | null;
  opponents: ArenaOpponent[];
  dailyUsesLeft: number;
  dailyUsesMax: number;
}
interface FightResult {
  won: boolean; pointsChange: number; goldReward: number; tierBonus: number; newPoints: number;
  newTier: ArenaTier;
  opponent: { name: string; attack: number; defense: number; maxHp: number };
  myStats: { attack: number; defense: number; maxHp: number };
}

const TIER_COLORS: Record<string, string> = {
  Bronze: "text-amber-600", Silver: "text-gray-400", Gold: "text-yellow-400",
  Platinum: "text-slate-300", Diamond: "text-cyan-300", Champion: "text-pink-400", Grandmaster: "text-yellow-300",
};

const TIER_BORDERS: Record<string, string> = {
  Bronze: "border-amber-800/60", Silver: "border-gray-700/60", Gold: "border-yellow-800/60",
  Platinum: "border-slate-600/60", Diamond: "border-cyan-700/60", Champion: "border-pink-800/60", Grandmaster: "border-yellow-700/60",
};

const TIER_BG: Record<string, string> = {
  Bronze: "bg-amber-950/20", Silver: "bg-gray-900/30", Gold: "bg-yellow-950/20",
  Platinum: "bg-slate-900/30", Diamond: "bg-cyan-950/20", Champion: "bg-pink-950/20", Grandmaster: "bg-yellow-950/30",
};

const ALL_TIERS = [
  { name: "Bronze", minPoints: 0 }, { name: "Silver", minPoints: 500 },
  { name: "Gold", minPoints: 1500 }, { name: "Platinum", minPoints: 3000 },
  { name: "Diamond", minPoints: 6000 }, { name: "Champion", minPoints: 10000 },
  { name: "Grandmaster", minPoints: 20000 },
];

export default function Arena() {
  const qc = useQueryClient();
  const [result, setResult] = useState<FightResult | null>(null);
  const [fighting, setFighting] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { data, isLoading } = useQuery<ArenaResponse>({
    queryKey: ["arena"],
    queryFn: () => Engine.getArena(),
    refetchInterval: 15000,
  });

  const fightMut = useMutation({
    mutationFn: (opponentId?: number) => {
      try { return Promise.resolve(Engine.challengeArena(opponentId)); }
      catch (e) { return Promise.reject(e); }
    },
    onMutate: () => { setFighting(true); setShowResult(false); setErrorMsg(null); },
    onSettled: () => setFighting(false),
    onSuccess: (res) => {
      setResult(res);
      setShowResult(true);
      qc.invalidateQueries({ queryKey: ["arena"] });
      qc.invalidateQueries({ queryKey: ["player"] });
    },
    onError: (e: any) => {
      setErrorMsg(e?.message ?? "Something went wrong");
      setTimeout(() => setErrorMsg(null), 4000);
    },
  });

  if (isLoading || !data) {
    return <div className="flex justify-center items-center h-48"><Loader2 className="animate-spin text-yellow-600" size={32} /></div>;
  }

  const tierName = data.arenaTier?.name || "Bronze";
  const winRate = data.arenaWins + data.arenaLosses > 0
    ? Math.round((data.arenaWins / (data.arenaWins + data.arenaLosses)) * 100)
    : 0;
  const nextTierPoints = data.nextTier?.minPoints || null;
  const progressToNext = nextTierPoints
    ? Math.min(100, ((data.arenaPoints - (data.arenaTier?.minPoints || 0)) / (nextTierPoints - (data.arenaTier?.minPoints || 0))) * 100)
    : 100;
  const isLimitReached = data.dailyUsesLeft <= 0;
  const canFight = !fighting && !isLimitReached;

  return (
    <div className="p-4 max-w-lg mx-auto space-y-4">
      <div className="text-center space-y-1">
        <h1 className="font-display text-xl text-yellow-400 tracking-widest uppercase flex items-center justify-center gap-2">
          <Swords size={18} /> PvP Arena
        </h1>
        <p className="text-gray-500 text-xs">Challenge other players and climb the ranks</p>
      </div>

      <div className={cn("rounded-xl border p-4 space-y-3", TIER_BORDERS[tierName] || "border-gray-700", TIER_BG[tierName] || "bg-gray-900/30")}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Crown size={18} className={TIER_COLORS[tierName]} />
            <span className={cn("font-bold text-lg", TIER_COLORS[tierName])}>{tierName}</span>
          </div>
          <div className="text-yellow-400 font-bold">{data.arenaPoints.toLocaleString()} pts</div>
        </div>
        {data.nextTier && (
          <div>
            <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
              <motion.div
                className={cn("h-full rounded-full", TIER_COLORS[tierName]?.replace("text-", "bg-"))}
                initial={{ width: 0 }}
                animate={{ width: `${progressToNext}%` }}
                transition={{ duration: 0.8 }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>{data.arenaPoints} pts</span>
              <span>{data.nextTier.name}: {data.nextTier.minPoints} pts</span>
            </div>
          </div>
        )}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <div className="text-green-400 font-bold">{data.arenaWins}</div>
            <div className="text-gray-400 text-xs">Wins</div>
          </div>
          <div>
            <div className="text-red-400 font-bold">{data.arenaLosses}</div>
            <div className="text-gray-400 text-xs">Losses</div>
          </div>
          <div>
            <div className="text-yellow-400 font-bold">{winRate}%</div>
            <div className="text-gray-400 text-xs">Win Rate</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {ALL_TIERS.map(t => {
          const isActive = t.name === tierName;
          const isPassed = data.arenaPoints >= t.minPoints;
          return (
            <div key={t.name} className={cn(
              "rounded-lg border p-2 text-center text-xs",
              isActive ? `${TIER_BORDERS[t.name]} ring-1 ring-current ${TIER_COLORS[t.name]}` : isPassed ? "border-gray-700 text-gray-400" : "border-gray-800 text-gray-500"
            )}>
              <div className={cn("font-bold", isActive ? TIER_COLORS[t.name] : isPassed ? "text-gray-400" : "text-gray-500")}>{t.name}</div>
              <div className="text-gray-500">{t.minPoints >= 1000 ? `${t.minPoints / 1000}k` : t.minPoints} pts</div>
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-1.5 text-xs text-gray-400">
          <Clock size={12} className={isLimitReached ? "text-red-400" : "text-gray-500"} />
          <span className={isLimitReached ? "text-red-400" : "text-gray-400"}>
            {isLimitReached ? "Daily limit reached — resets at midnight UTC" : `${data.dailyUsesLeft} / ${data.dailyUsesMax} battles remaining today`}
          </span>
        </div>
      </div>

      <AnimatePresence>
        {errorMsg && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="rounded-lg bg-red-950/40 border border-red-800/50 text-red-400 text-sm text-center py-2 px-4">
            {errorMsg}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showResult && result && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className={cn(
              "rounded-xl border p-4 space-y-3 text-center",
              result.won ? "border-green-800/60 bg-green-950/20" : "border-red-800/60 bg-red-950/20"
            )}
          >
            <div className="text-4xl">{result.won ? "⚔️" : "💀"}</div>
            <div className={cn("text-xl font-bold", result.won ? "text-green-400" : "text-red-400")}>
              {result.won ? "VICTORY!" : "DEFEAT"}
            </div>
            <div className="text-gray-400 text-sm">vs. {result.opponent.name}</div>
            <div className="flex justify-center gap-4 text-sm">
              <div>
                <div className={cn("font-bold", result.pointsChange >= 0 ? "text-green-400" : "text-red-400")}>
                  {result.pointsChange >= 0 ? "+" : ""}{result.pointsChange}
                </div>
                <div className="text-gray-400 text-xs">Arena Points</div>
              </div>
              {result.won && (
                <div>
                  <div className="text-yellow-400 font-bold">+{result.goldReward.toLocaleString()}</div>
                  <div className="text-gray-400 text-xs">Gold</div>
                </div>
              )}
            </div>
            {result.tierBonus > 0 && (
              <div className="mt-1 px-3 py-1.5 rounded-lg bg-yellow-950/40 border border-yellow-700/40 text-center">
                <div className="text-yellow-300 font-bold text-sm">New Tier Reached!</div>
                <div className="text-yellow-400 text-xs">+{result.tierBonus.toLocaleString()} milestone gold bonus</div>
              </div>
            )}
            <button onClick={() => setShowResult(false)} className="text-gray-500 text-xs hover:text-gray-400 transition-colors">Dismiss</button>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => fightMut.mutate(undefined)}
        disabled={!canFight}
        className={cn(
          "w-full py-3 rounded-xl border font-bold transition-colors flex items-center justify-center gap-2",
          isLimitReached
            ? "border-gray-700/50 bg-gray-900/20 text-gray-500 cursor-not-allowed"
            : "border-yellow-700/50 bg-yellow-950/30 text-yellow-400 hover:bg-yellow-950/50"
        )}
      >
        {fighting ? <Loader2 size={16} className="animate-spin" /> : <Swords size={16} />}
        {fighting ? "Finding Opponent..." : isLimitReached ? "No Battles Left Today" : "Quick Match"}
      </button>

      {data.opponents.length > 0 && (
        <div className="space-y-2">
          <div className="text-gray-400 text-xs font-bold uppercase tracking-widest">Other Players</div>
          {data.opponents.map(op => (
            <div key={op.id} className="rounded-xl border border-gray-800 bg-gray-900/30 p-3 flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="font-bold text-white text-sm truncate">{op.name}</div>
                <div className="text-gray-500 text-xs">Lv.{op.level} • {op.arenaPoints} pts</div>
                <div className="flex gap-3 mt-1 text-xs text-gray-400">
                  <span className="text-red-400">⚔️ {op.attack}</span>
                  <span className="text-blue-400">🛡️ {op.defense}</span>
                  <span className="text-green-400">❤️ {Engine.fmtNum(op.maxHp)}</span>
                </div>
              </div>
              <button
                onClick={() => fightMut.mutate(op.id)}
                disabled={!canFight}
                className={cn(
                  "py-1.5 px-3 rounded-lg border text-xs font-bold transition-colors",
                  isLimitReached
                    ? "border-gray-700/40 text-gray-500 cursor-not-allowed"
                    : "border-red-800/50 text-red-400 hover:bg-red-950/30"
                )}
              >
                Challenge
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
