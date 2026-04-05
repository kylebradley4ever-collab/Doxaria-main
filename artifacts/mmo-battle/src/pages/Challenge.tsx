import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Timer, Zap, Trophy, Shield, Sword, Flame, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import * as Engine from "@/lib/engine";

interface ChallengeWave { wave: number; monsterName: string; monsterHp: number; monsterAtk: number; monsterDef: number; goldReward: number; xpReward: number; }
interface ChallengeData {
  highScore: number; runsCompleted: number; preview: ChallengeWave[];
  playerStats: { attack: number; defense: number; maxHp: number; level: number };
}
interface WaveResult { wave: number; monsterName: string; survived: boolean; playerHpLeft: number; }
interface RunResult {
  wavesCleared: number; isNewRecord: boolean; totalGold: number; totalXp: number;
  bonusStones: number; waveResults: WaveResult[]; highScore: number;
}

export default function Challenge() {
  const qc = useQueryClient();
  const [runResult, setRunResult] = useState<RunResult | null>(null);
  const [running, setRunning] = useState(false);
  const [showResult, setShowResult] = useState(false);

  const { data, isLoading } = useQuery<ChallengeData>({
    queryKey: ["challenge"],
    queryFn: () => Engine.getChallenge(),
    refetchInterval: 10000,
  });

  const runMut = useMutation({
    mutationFn: () => Promise.resolve(Engine.runChallenge()),
    onMutate: () => { setRunning(true); setShowResult(false); },
    onSettled: () => setRunning(false),
    onSuccess: (res) => {
      setRunResult(res);
      setShowResult(true);
      qc.invalidateQueries({ queryKey: ["challenge"] });
      qc.invalidateQueries({ queryKey: ["player"] });
    },
  });

  if (isLoading || !data) {
    return <div className="flex justify-center items-center h-48"><Loader2 className="animate-spin text-yellow-600" size={32} /></div>;
  }

  return (
    <div className="p-4 max-w-lg mx-auto space-y-4">
      <div className="text-center space-y-1">
        <h1 className="font-display text-xl text-yellow-400 tracking-widest uppercase flex items-center justify-center gap-2">
          <Flame size={18} /> Challenge Mode
        </h1>
        <p className="text-gray-500 text-xs">Survive endless waves of increasingly powerful monsters</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-yellow-900/40 bg-yellow-950/20 p-3 text-center">
          <Trophy size={20} className="text-yellow-400 mx-auto mb-1" />
          <div className="text-2xl font-bold text-yellow-400">{data.highScore}</div>
          <div className="text-gray-500 text-xs">Best Wave</div>
        </div>
        <div className="rounded-xl border border-purple-900/40 bg-purple-950/20 p-3 text-center">
          <Star size={20} className="text-purple-400 mx-auto mb-1" />
          <div className="text-2xl font-bold text-purple-400">{data.runsCompleted}</div>
          <div className="text-gray-500 text-xs">Runs Done</div>
        </div>
      </div>

      <div className="rounded-xl border border-gray-800 bg-gray-900/30 p-3">
        <div className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-2">Your Stats</div>
        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <div><span className="text-red-400 font-bold">{data.playerStats.attack}</span><div className="text-gray-600">ATK</div></div>
          <div><span className="text-blue-400 font-bold">{data.playerStats.defense}</span><div className="text-gray-600">DEF</div></div>
          <div><span className="text-green-400 font-bold">{Engine.fmtNum(data.playerStats.maxHp)}</span><div className="text-gray-600">Max HP</div></div>
        </div>
      </div>

      <div className="space-y-2">
        <div className="text-gray-400 text-xs font-bold uppercase tracking-widest">Wave Preview</div>
        {data.preview.map(w => (
          <div key={w.wave} className="rounded-lg border border-gray-800 bg-gray-900/30 p-2 flex items-center gap-3 text-xs">
            <div className="w-10 text-center font-bold text-orange-400">W{w.wave}</div>
            <div className="flex-1 font-bold text-gray-300">{w.monsterName}</div>
            <div className="flex gap-2 text-gray-600">
              <span className="text-red-400">⚔️{w.monsterAtk}</span>
              <span className="text-blue-400">🛡️{w.monsterDef}</span>
              <span className="text-green-400">❤️{w.monsterHp}</span>
            </div>
            <div className="text-yellow-500">+{w.goldReward}g</div>
          </div>
        ))}
        <div className="text-center text-gray-700 text-xs">…and up to 50 waves!</div>
      </div>

      <AnimatePresence>
        {showResult && runResult && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="rounded-xl border border-orange-800/60 bg-orange-950/20 p-4 space-y-3"
          >
            <div className="text-center space-y-1">
              {runResult.isNewRecord && (
                <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ repeat: 3 }} className="text-yellow-400 font-bold text-sm">
                  🏆 NEW RECORD!
                </motion.div>
              )}
              <div className="text-4xl font-bold text-orange-400">{runResult.wavesCleared}</div>
              <div className="text-gray-400 text-sm">Waves Cleared</div>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div><div className="text-yellow-400 font-bold">+{runResult.totalGold.toLocaleString()}</div><div className="text-gray-600">Gold</div></div>
              <div><div className="text-cyan-400 font-bold">+{runResult.totalXp.toLocaleString()}</div><div className="text-gray-600">XP</div></div>
              <div><div className="text-purple-400 font-bold">+{runResult.bonusStones}</div><div className="text-gray-600">Stones</div></div>
            </div>
            <div className="max-h-36 overflow-y-auto space-y-1">
              {runResult.waveResults.map(wr => (
                <div key={wr.wave} className={cn("flex items-center gap-2 text-xs rounded-lg px-2 py-1", wr.survived ? "text-green-400" : "text-red-400")}>
                  <span>{wr.survived ? "✓" : "✗"}</span>
                  <span className="flex-1">W{wr.wave}: {wr.monsterName}</span>
                  {wr.survived && <span className="text-gray-500">{wr.playerHpLeft} HP left</span>}
                </div>
              ))}
            </div>
            <button onClick={() => setShowResult(false)} className="w-full text-gray-500 text-xs hover:text-gray-400 py-1">Dismiss</button>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => runMut.mutate()}
        disabled={running}
        className="w-full py-3 rounded-xl border border-orange-700/50 bg-orange-950/20 text-orange-400 font-bold hover:bg-orange-950/40 transition-colors flex items-center justify-center gap-2"
      >
        {running ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            Running Challenge...
          </>
        ) : (
          <>
            <Flame size={16} />
            Start Challenge Run
          </>
        )}
      </button>
      <p className="text-center text-gray-600 text-xs">Rewards are calculated automatically. New record = bonus gold!</p>
    </div>
  );
}
