import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";
import { getGetPlayerQueryKey } from "@/lib/localApi";
import { Scroll, Sword, Crown, Fish, Coins, ShoppingBag, Check, Clock, Gift, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import * as Engine from "@/lib/engine";

interface Quest {
  id: number;
  questDate: string;
  questIndex: number;
  type: string;
  label: string;
  target: number;
  baselineValue: number;
  progress: number;
  pctDone: number;
  completed: boolean;
  claimed: boolean;
  rewardType: string;
  rewardAmount: number;
}

interface QuestsResponse {
  quests: Quest[];
  nextResetAt: string;
}

const QUEST_ICONS: Record<string, React.ElementType> = {
  kill_monsters: Sword,
  defeat_bosses: Crown,
  catch_fish:    Fish,
  earn_gold:     Coins,
  sell_items:    ShoppingBag,
};

const QUEST_COLORS: Record<string, string> = {
  kill_monsters: "text-red-400",
  defeat_bosses: "text-orange-400",
  catch_fish:    "text-cyan-400",
  earn_gold:     "text-yellow-400",
  sell_items:    "text-amber-400",
};

const QUEST_BORDERS: Record<string, string> = {
  kill_monsters: "border-red-900/40",
  defeat_bosses: "border-orange-900/40",
  catch_fish:    "border-cyan-900/40",
  earn_gold:     "border-yellow-900/40",
  sell_items:    "border-amber-900/40",
};

const DIFFICULTY_LABELS = ["Daily", "Challenge", "Heroic"];
const DIFFICULTY_COLORS = ["text-green-400", "text-blue-400", "text-purple-400"];

function formatReward(type: string, amount: number): string {
  if (type === "stones") return `${amount} Enchanting Stone${amount !== 1 ? "s" : ""}`;
  return `${amount.toLocaleString()} Gold`;
}

function formatTarget(type: string, value: number): string {
  if (type === "earn_gold") return value.toLocaleString() + " gold";
  return value.toLocaleString();
}

function formatTimeLeft(nextResetAt: string): string {
  const diff = new Date(nextResetAt).getTime() - Date.now();
  if (diff <= 0) return "Resetting…";
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

async function fetchQuests(): Promise<QuestsResponse> {
  return Engine.getQuests();
}

async function claimQuest(id: number): Promise<{ rewardType: string; rewardAmount: number }> {
  return Engine.claimQuest(id);
}

export default function Quests() {
  const [data, setData] = useState<QuestsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [claiming, setClaiming] = useState<number | null>(null);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [timeLeft, setTimeLeft] = useState("");
  const queryClient = useQueryClient();

  const load = async () => {
    try {
      setError(null);
      const result = await fetchQuests();
      setData(result);
    } catch {
      setError("Failed to load quests.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (!data) return;
    const tick = () => setTimeLeft(formatTimeLeft(data.nextResetAt));
    tick();
    const interval = setInterval(tick, 30_000);
    return () => clearInterval(interval);
  }, [data]);

  const handleClaim = async (quest: Quest) => {
    if (claiming !== null) return;
    setClaiming(quest.id);
    try {
      const result = await claimQuest(quest.id);
      const msg = `Claimed: +${formatReward(result.rewardType, result.rewardAmount)}!`;
      setToast({ msg, ok: true });
      queryClient.invalidateQueries({ queryKey: getGetPlayerQueryKey() });
      await load();
    } catch (err: any) {
      setToast({ msg: err.message ?? "Failed to claim", ok: false });
    } finally {
      setClaiming(null);
      setTimeout(() => setToast(null), 3000);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[50vh]">
        <Loader2 size={28} className="animate-spin text-yellow-700/60" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-4 text-center text-red-500 text-sm py-12">{error ?? "No data"}</div>
    );
  }

  const allClaimed = data.quests.every(q => q.claimed);

  return (
    <div className="flex flex-col gap-4 p-4 max-w-xl mx-auto pb-6">
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={cn(
              "fixed top-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-xl text-sm font-bold shadow-xl border",
              toast.ok
                ? "bg-green-950/90 border-green-700/50 text-green-300"
                : "bg-red-950/90 border-red-700/50 text-red-300"
            )}
          >
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="font-display text-base tracking-widest uppercase text-yellow-200/90">Daily Quests</h1>
          <p className="text-[10px] text-gray-600 mt-0.5">3 new challenges every day</p>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-gray-900/60 border border-gray-800/60">
          <Clock size={11} className="text-gray-500" />
          <span className="text-[10px] text-gray-400 tabular-nums">Resets in {timeLeft}</span>
        </div>
      </motion.div>

      {allClaimed && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-xl border border-yellow-700/30 bg-yellow-950/20 p-4 flex items-center gap-3"
        >
          <Check size={18} className="text-yellow-400 shrink-0" />
          <div>
            <p className="text-sm text-yellow-300 font-bold">All quests complete!</p>
            <p className="text-[10px] text-gray-500 mt-0.5">New quests in {timeLeft}</p>
          </div>
        </motion.div>
      )}

      <div className="flex flex-col gap-3">
        {data.quests.map((quest, idx) => {
          const Icon = QUEST_ICONS[quest.type] ?? Scroll;
          const color = QUEST_COLORS[quest.type] ?? "text-yellow-400";
          const border = QUEST_BORDERS[quest.type] ?? "border-yellow-900/40";
          const pct = Math.min(100, Math.floor(quest.pctDone * 100));
          const isComplete = quest.pctDone >= 1 || quest.completed;
          const isClaimed = quest.claimed;
          const isClaiming = claiming === quest.id;
          const diffLabel = DIFFICULTY_LABELS[idx] ?? "Daily";
          const diffColor = DIFFICULTY_COLORS[idx] ?? "text-gray-400";

          return (
            <motion.div
              key={quest.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.07 }}
              className={cn(
                "rounded-xl border p-4 flex flex-col gap-3 transition-opacity duration-300",
                border,
                isClaimed ? "opacity-50 bg-black/30" : "bg-gradient-to-b from-gray-900/70 to-black/60"
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-10 h-10 rounded-lg bg-black/60 border flex items-center justify-center shrink-0",
                    border
                  )}>
                    <Icon size={18} className={color} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={cn("font-display text-sm tracking-widest uppercase", color)}>{quest.label}</span>
                      <span className={cn("text-[9px] font-bold uppercase tracking-widest", diffColor)}>{diffLabel}</span>
                    </div>
                    <p className="text-[10px] text-gray-500 font-sans mt-0.5">
                      {quest.type === "kill_monsters" && `Defeat ${formatTarget(quest.type, quest.target)} monsters`}
                      {quest.type === "defeat_bosses" && `Defeat ${formatTarget(quest.type, quest.target)} bosses`}
                      {quest.type === "catch_fish"    && `Catch ${formatTarget(quest.type, quest.target)} fish`}
                      {quest.type === "earn_gold"     && `Earn ${formatTarget(quest.type, quest.target)}`}
                      {quest.type === "sell_items"    && `Sell ${formatTarget(quest.type, quest.target)} items`}
                    </p>
                  </div>
                </div>

                {isClaimed ? (
                  <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-green-800/40 bg-green-950/20 shrink-0">
                    <Check size={12} className="text-green-500" />
                    <span className="text-[10px] text-green-600 font-bold">Done</span>
                  </div>
                ) : isComplete ? (
                  <button
                    onClick={() => handleClaim(quest)}
                    disabled={isClaiming}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[11px] font-bold uppercase tracking-widest transition-all active:scale-95 shrink-0",
                      color, border,
                      "bg-black/60 hover:bg-black/80 animate-pulse"
                    )}
                  >
                    {isClaiming
                      ? <Loader2 size={12} className="animate-spin" />
                      : <Gift size={12} />}
                    {isClaiming ? "…" : "Claim"}
                  </button>
                ) : null}
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[9px] uppercase tracking-widest text-gray-600">Progress</span>
                  <span className="text-[10px] text-gray-500 tabular-nums">
                    {Math.min(quest.progress, quest.target).toLocaleString()} / {quest.target.toLocaleString()}
                  </span>
                </div>
                <div className="h-2 rounded-full bg-gray-800/80 border border-gray-700/40 overflow-hidden">
                  <motion.div
                    className={cn(
                      "h-full rounded-full",
                      isClaimed
                        ? "bg-gray-600"
                        : isComplete
                        ? "bg-gradient-to-r from-green-700 via-green-500 to-green-300"
                        : "bg-gradient-to-r from-yellow-700 via-yellow-500 to-yellow-300"
                    )}
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.8, ease: "easeOut", delay: idx * 0.07 + 0.2 }}
                  />
                </div>
              </div>

              <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-black/40 border border-gray-800/60">
                <Gift size={11} className="text-gray-500 shrink-0" />
                <span className="text-[11px] text-gray-400 font-sans">
                  Reward: <span className={cn("font-bold", quest.rewardType === "stones" ? "text-violet-400" : "text-yellow-400")}>
                    {formatReward(quest.rewardType, quest.rewardAmount)}
                  </span>
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="text-center text-[9px] text-gray-700 tracking-widest uppercase pt-2"
      >
        Quests reset daily at midnight UTC
      </motion.div>
    </div>
  );
}
