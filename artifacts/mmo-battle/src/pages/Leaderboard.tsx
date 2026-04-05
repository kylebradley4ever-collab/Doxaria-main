import { motion } from "framer-motion";
import { Trophy, Crown, Star } from "lucide-react";
import { usePlayer } from "@/hooks/use-player";
import { useStats } from "@/hooks/use-stats";

export default function Leaderboard() {
  const { data: player } = usePlayer();
  const { data: stats } = useStats();

  const score = player
    ? (player.monstersDefeated ?? 0) * 10 +
      (player.bossesDefeated ?? 0) * 100 +
      Math.floor((player.goldEarned ?? 0) / 1000) +
      (player.arenaWins ?? 0) * 50 +
      (player.challengeHighScore ?? 0) * 20
    : 0;

  return (
    <div className="p-4 max-w-lg mx-auto space-y-4">
      <div className="text-center space-y-1">
        <h1 className="font-display text-xl text-yellow-400 tracking-widest uppercase flex items-center justify-center gap-2">
          <Trophy size={18} /> Leaderboard
        </h1>
        <p className="text-gray-500 text-xs">Your personal hall of glory</p>
      </div>

      <div className="rounded-xl border border-yellow-900/40 bg-yellow-950/20 p-4 text-center space-y-2">
        <div className="flex items-center justify-center gap-2 text-yellow-400">
          <Crown size={20} />
          <span className="font-display text-lg tracking-wider">{player?.name ?? "Hero"}</span>
        </div>
        <div className="text-3xl font-bold text-yellow-300">{score.toLocaleString()}</div>
        <div className="text-gray-500 text-xs">Total Score</div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-gray-800 bg-gray-900/30 p-3 text-center">
          <div className="text-lg font-bold text-white">Lv.{player?.level ?? 1}{(player?.prestigeLevel ?? 0) > 0 ? ` ✦${player?.prestigeLevel}` : ""}</div>
          <div className="text-gray-500 text-xs">Level</div>
        </div>
        <div className="rounded-xl border border-red-900/40 bg-red-950/20 p-3 text-center">
          <div className="text-lg font-bold text-red-400">{(player?.monstersDefeated ?? 0).toLocaleString()}</div>
          <div className="text-gray-500 text-xs">Monsters Killed</div>
        </div>
        <div className="rounded-xl border border-orange-900/40 bg-orange-950/20 p-3 text-center">
          <div className="text-lg font-bold text-orange-400">{(player?.bossesDefeated ?? 0).toLocaleString()}</div>
          <div className="text-gray-500 text-xs">Bosses Defeated</div>
        </div>
        <div className="rounded-xl border border-yellow-900/40 bg-yellow-950/20 p-3 text-center">
          <div className="text-lg font-bold text-yellow-400">{(player?.goldEarned ?? 0).toLocaleString()}</div>
          <div className="text-gray-500 text-xs">Gold Earned</div>
        </div>
        <div className="rounded-xl border border-cyan-900/40 bg-cyan-950/20 p-3 text-center">
          <div className="text-lg font-bold text-cyan-400">{(player?.arenaPoints ?? 0).toLocaleString()}</div>
          <div className="text-gray-500 text-xs">Arena Points</div>
        </div>
        <div className="rounded-xl border border-blue-900/40 bg-blue-950/20 p-3 text-center">
          <div className="text-lg font-bold text-blue-400">{(player?.totalFishCaught ?? 0).toLocaleString()}</div>
          <div className="text-gray-500 text-xs">Fish Caught</div>
        </div>
        <div className="rounded-xl border border-purple-900/40 bg-purple-950/20 p-3 text-center">
          <div className="text-lg font-bold text-purple-400">{player?.challengeHighScore ?? 0}</div>
          <div className="text-gray-500 text-xs">Best Wave</div>
        </div>
        <div className="rounded-xl border border-green-900/40 bg-green-950/20 p-3 text-center">
          <div className="text-lg font-bold text-green-400">{(stats?.totalDamageDealt ?? 0).toLocaleString()}</div>
          <div className="text-gray-500 text-xs">Damage Dealt</div>
        </div>
      </div>

      <div className="rounded-xl border border-gray-800 bg-gray-900/30 p-3 text-center">
        <Star size={16} className="text-yellow-600 mx-auto mb-1" />
        <p className="text-gray-500 text-xs">This is an offline game — your progress is saved locally. Share your score with friends!</p>
      </div>
    </div>
  );
}
