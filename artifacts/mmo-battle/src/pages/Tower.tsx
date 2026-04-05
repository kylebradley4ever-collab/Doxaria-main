import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Trophy, Star, Zap, Shield, Sword, TrendingUp, Gift, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import * as Engine from "@/lib/engine";

interface Milestone {
  floor: number; gold: number; stones: number; talentPoints: number;
  label: string; claimed: boolean; reached: boolean;
}
interface TowerData {
  highestFloor: number; nextFloor: number; floorName: string;
  monsterName: string;
  monster: { hp: number; attack: number; defense: number };
  reward: { gold: number; xp: number; stones: number };
  milestones: Milestone[];
  playerStats: { attack: number; defense: number; maxHp: number; level: number };
}
interface FloorResult {
  won: boolean; floor: number; newHighest: boolean;
  goldEarned: number; xpEarned: number; stonesEarned: number;
  monsterName: string; floorName: string;
  milestoneUnlocked: { floor: number; gold: number; stones: number; talentPoints: number; label: string } | null;
}

const MILESTONE_COLORS: Record<number, string> = {
  10: "text-gray-300 border-gray-600",
  25: "text-blue-400 border-blue-800",
  50: "text-purple-400 border-purple-800",
  100: "text-yellow-400 border-yellow-800",
  200: "text-orange-400 border-orange-800",
  500: "text-red-400 border-red-800",
  1000: "text-pink-300 border-pink-700",
};

function floorBgClass(floor: number) {
  if (floor >= 1000) return "border-pink-700/40 bg-pink-950/10";
  if (floor >= 500)  return "border-red-800/40 bg-red-950/10";
  if (floor >= 200)  return "border-orange-800/40 bg-orange-950/10";
  if (floor >= 100)  return "border-yellow-800/40 bg-yellow-950/10";
  if (floor >= 50)   return "border-purple-800/40 bg-purple-950/10";
  if (floor >= 25)   return "border-blue-800/40 bg-blue-950/10";
  return "border-gray-700/40 bg-gray-900/20";
}

function floorTextClass(floor: number) {
  if (floor >= 1000) return "text-pink-300";
  if (floor >= 500)  return "text-red-400";
  if (floor >= 200)  return "text-orange-400";
  if (floor >= 100)  return "text-yellow-400";
  if (floor >= 50)   return "text-purple-400";
  if (floor >= 25)   return "text-blue-400";
  return "text-gray-300";
}

export default function Tower() {
  const qc = useQueryClient();
  const [lastResult, setLastResult] = useState<FloorResult | null>(null);
  const [showResult, setShowResult] = useState(false);

  const { data, isLoading } = useQuery<TowerData>({
    queryKey: ["tower"],
    queryFn: () => Engine.getTower(),
    refetchInterval: 15000,
  });

  const climbMut = useMutation({
    mutationFn: () => Promise.resolve(Engine.runTowerFloor()),
    onSuccess: (res) => {
      setLastResult(res);
      setShowResult(true);
      qc.invalidateQueries({ queryKey: ["tower"] });
      qc.invalidateQueries({ queryKey: ["player"] });
    },
  });

  if (isLoading || !data) {
    return (
      <div className="flex justify-center items-center h-48">
        <Loader2 className="animate-spin text-purple-400" size={32} />
      </div>
    );
  }

  const { highestFloor, nextFloor, floorName, monsterName, monster, reward, milestones, playerStats } = data;

  const nextMilestone = milestones.find(m => !m.claimed);
  const floorsToNext = nextMilestone ? nextMilestone.floor - highestFloor : null;

  return (
    <div className="p-4 max-w-lg mx-auto space-y-4">
      <div className="text-center space-y-1">
        <h1 className="font-display text-xl text-purple-400 tracking-widest uppercase flex items-center justify-center gap-2">
          <TrendingUp size={18} /> Infinite Tower
        </h1>
        <p className="text-gray-500 text-xs">Climb endless floors. No ceiling. No limit.</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-purple-900/40 bg-purple-950/20 p-3 text-center">
          <Trophy size={20} className="text-purple-400 mx-auto mb-1" />
          <div className={cn("text-2xl font-bold", floorTextClass(highestFloor))}>
            {highestFloor === 0 ? "—" : highestFloor.toLocaleString()}
          </div>
          <div className="text-gray-500 text-xs">Highest Floor</div>
        </div>
        <div className={cn("rounded-xl border p-3 text-center", floorBgClass(nextFloor))}>
          <ChevronRight size={20} className={cn("mx-auto mb-1", floorTextClass(nextFloor))} />
          <div className={cn("text-2xl font-bold", floorTextClass(nextFloor))}>
            {nextFloor.toLocaleString()}
          </div>
          <div className="text-gray-500 text-xs">Next Floor</div>
        </div>
      </div>

      <div className={cn("rounded-xl border p-4 space-y-3", floorBgClass(nextFloor))}>
        <div className="flex items-center justify-between">
          <div>
            <div className={cn("font-bold text-sm", floorTextClass(nextFloor))}>{floorName}</div>
            <div className="text-gray-400 text-xs">Floor {nextFloor.toLocaleString()}</div>
          </div>
          <div className="text-right text-xs text-gray-500">
            <div className={cn("font-bold", floorTextClass(nextFloor))}>{monsterName}</div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <div>
            <div className="text-green-400 font-bold">{Engine.fmtNum(monster.hp)}</div>
            <div className="text-gray-600">HP</div>
          </div>
          <div>
            <div className="text-red-400 font-bold">{Engine.fmtNum(monster.attack)}</div>
            <div className="text-gray-600">ATK</div>
          </div>
          <div>
            <div className="text-blue-400 font-bold">{Engine.fmtNum(monster.defense)}</div>
            <div className="text-gray-600">DEF</div>
          </div>
        </div>
        <div className="border-t border-white/5 pt-2 grid grid-cols-3 gap-2 text-center text-xs">
          <div>
            <div className="text-yellow-400 font-bold">+{Engine.fmtNum(reward.gold)}</div>
            <div className="text-gray-600">Gold</div>
          </div>
          <div>
            <div className="text-cyan-400 font-bold">+{Engine.fmtNum(reward.xp)}</div>
            <div className="text-gray-600">XP</div>
          </div>
          <div>
            <div className="text-purple-400 font-bold">{reward.stones > 0 ? `+${reward.stones}` : "—"}</div>
            <div className="text-gray-600">Stones</div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-gray-800 bg-gray-900/30 p-3">
        <div className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-2">Your Stats</div>
        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <div><span className="text-red-400 font-bold">{Engine.fmtNum(playerStats.attack)}</span><div className="text-gray-600">ATK</div></div>
          <div><span className="text-blue-400 font-bold">{Engine.fmtNum(playerStats.defense)}</span><div className="text-gray-600">DEF</div></div>
          <div><span className="text-green-400 font-bold">{Engine.fmtNum(playerStats.maxHp)}</span><div className="text-gray-600">Max HP</div></div>
        </div>
      </div>

      {nextMilestone && (
        <div className="rounded-xl border border-yellow-900/30 bg-yellow-950/10 p-3 text-xs">
          <div className="flex items-center gap-2 mb-1">
            <Gift size={13} className="text-yellow-400" />
            <span className="text-yellow-400 font-bold">Next Milestone — Floor {nextMilestone.floor.toLocaleString()}</span>
          </div>
          <div className="text-gray-400">
            {floorsToNext !== null && floorsToNext > 0 ? `${floorsToNext} floors away` : "Ready to claim!"}
            {" · "}
            <span className="text-yellow-400">{Engine.fmtNum(nextMilestone.gold)}g</span>
            {nextMilestone.stones > 0 && <span className="text-purple-400"> +{nextMilestone.stones} stones</span>}
            {nextMilestone.talentPoints > 0 && <span className="text-cyan-400"> +{nextMilestone.talentPoints} talent pts</span>}
            {" · "}<span className="text-gray-300 italic">{nextMilestone.label}</span>
          </div>
        </div>
      )}

      <AnimatePresence>
        {showResult && lastResult && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={cn(
              "rounded-xl border p-4 space-y-3",
              lastResult.won ? floorBgClass(lastResult.floor) : "border-red-900/40 bg-red-950/10"
            )}
          >
            <div className="text-center space-y-1">
              {lastResult.won ? (
                <>
                  {lastResult.newHighest && (
                    <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ repeat: 3 }} className="text-yellow-400 font-bold text-sm">
                      NEW RECORD!
                    </motion.div>
                  )}
                  <div className={cn("text-3xl font-bold", floorTextClass(lastResult.floor))}>
                    Floor {lastResult.floor.toLocaleString()} Cleared
                  </div>
                  <div className="text-gray-400 text-xs">{lastResult.floorName}</div>
                </>
              ) : (
                <>
                  <div className="text-red-400 text-2xl font-bold">Defeated</div>
                  <div className="text-gray-500 text-xs">The {lastResult.monsterName} was too strong. Train more and try again.</div>
                </>
              )}
            </div>
            {lastResult.won && (
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div><div className="text-yellow-400 font-bold">+{Engine.fmtNum(lastResult.goldEarned)}</div><div className="text-gray-600">Gold</div></div>
                <div><div className="text-cyan-400 font-bold">+{Engine.fmtNum(lastResult.xpEarned)}</div><div className="text-gray-600">XP</div></div>
                <div><div className="text-purple-400 font-bold">{lastResult.stonesEarned > 0 ? `+${lastResult.stonesEarned}` : "—"}</div><div className="text-gray-600">Stones</div></div>
              </div>
            )}
            {lastResult.milestoneUnlocked && (
              <div className="rounded-lg border border-yellow-700/40 bg-yellow-950/20 p-2 text-xs text-center space-y-1">
                <div className="text-yellow-400 font-bold">Milestone Unlocked: {lastResult.milestoneUnlocked.label}</div>
                <div className="text-gray-400">Floor {lastResult.milestoneUnlocked.floor} reached!</div>
              </div>
            )}
            <button onClick={() => setShowResult(false)} className="w-full text-gray-500 text-xs hover:text-gray-400 py-1">Dismiss</button>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => climbMut.mutate()}
        disabled={climbMut.isPending}
        className={cn(
          "w-full py-3 rounded-xl border font-bold transition-colors flex items-center justify-center gap-2",
          floorBgClass(nextFloor),
          floorTextClass(nextFloor),
          "hover:brightness-125"
        )}
      >
        {climbMut.isPending ? (
          <><Loader2 size={16} className="animate-spin" /> Climbing...</>
        ) : (
          <><TrendingUp size={16} /> Attempt Floor {nextFloor.toLocaleString()}</>
        )}
      </button>

      <div className="space-y-2">
        <div className="text-gray-500 text-xs font-bold uppercase tracking-widest">Milestone Rewards</div>
        <div className="space-y-1.5">
          {milestones.map((ms) => (
            <div
              key={ms.floor}
              className={cn(
                "rounded-lg border px-3 py-2 flex items-center gap-3 text-xs",
                ms.claimed
                  ? "border-gray-800/40 bg-gray-900/20 opacity-50"
                  : ms.reached
                  ? "border-green-800/60 bg-green-950/20"
                  : MILESTONE_COLORS[ms.floor]?.split(" ")[1]
                    ? `border-${MILESTONE_COLORS[ms.floor].split(" ")[1].replace("border-", "")} bg-gray-900/20`
                    : "border-gray-700/40 bg-gray-900/20"
              )}
            >
              <div className={cn("w-14 text-center font-bold", ms.claimed ? "text-gray-600" : MILESTONE_COLORS[ms.floor]?.split(" ")[0] ?? "text-gray-400")}>
                F{ms.floor >= 1000 ? (ms.floor / 1000).toFixed(0) + "K" : ms.floor}
              </div>
              <div className="flex-1">
                <div className={cn("font-bold", ms.claimed ? "text-gray-600" : "text-gray-200")}>{ms.label}</div>
                <div className="text-gray-600 space-x-2">
                  <span className="text-yellow-500">{Engine.fmtNum(ms.gold)}g</span>
                  {ms.stones > 0 && <span className="text-purple-400">+{ms.stones} stones</span>}
                  {ms.talentPoints > 0 && <span className="text-cyan-400">+{ms.talentPoints} talent</span>}
                </div>
              </div>
              <div className="text-gray-600">
                {ms.claimed ? "✓" : ms.reached ? <Star size={12} className="text-green-400" /> : "—"}
              </div>
            </div>
          ))}
        </div>
        <div className="text-center text-gray-700 text-xs">…floors go on forever. How high can you climb?</div>
      </div>
    </div>
  );
}
