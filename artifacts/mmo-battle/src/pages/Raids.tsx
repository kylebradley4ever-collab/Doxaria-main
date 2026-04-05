import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Skull, Swords, Shield, Zap, Lock, Trophy, Clock, AlertTriangle, ChevronRight, Flame, KeyRound } from "lucide-react";
import { usePlayer } from "@/hooks/use-player";
import { useQueryClient } from "@tanstack/react-query";
import { getGetPlayerQueryKey } from "@/lib/localApi";
import * as Engine from "@/lib/engine";
import { GOD_REQUIRED_KEY, getKeyDef } from "@/lib/gameLogic";

interface GodBoss {
  name: string;
  title: string;
  lore: string;
  minLevel: number;
  cooldownMinutes: number;
  enrageThreshold: number;
}

interface RaidState {
  godName: string;
  godHp: number;
  godMaxHp: number;
  godAttack: number;
  godDefense: number;
  phase: number;
  isEnraged: boolean;
  status: string;
  lootGranted: boolean;
  completedAt: string | null;
  createdAt: string;
}

interface RaidResponse {
  raid: RaidState | null;
  gods: GodBoss[];
  player: { level: number; hp: number; maxHp: number };
  raidCooldowns: Record<string, number>;
  raidKeys: Record<string, number>;
}

interface AttackResponse {
  raid: RaidState;
  player: { level: number; hp: number; maxHp: number };
  log: string[];
  loot: { name: string; rarity: string } | null;
  playerDamage: number;
  godDamage: number;
}

const GOD_THEMES: Record<string, { color: string; border: string; bg: string; icon: string }> = {
  "Ares":        { color: "text-red-400",    border: "border-red-600/40",    bg: "from-red-950/50",     icon: "⚔️" },
  "Thanatos":    { color: "text-purple-400", border: "border-purple-600/40", bg: "from-purple-950/50",  icon: "💀" },
  "Kronos":      { color: "text-blue-400",   border: "border-blue-600/40",   bg: "from-blue-950/50",    icon: "⏳" },
  "Typhon":      { color: "text-orange-400", border: "border-orange-600/40", bg: "from-orange-950/50",  icon: "🌊" },
  "Nyx":         { color: "text-indigo-400", border: "border-indigo-600/40", bg: "from-indigo-950/50",  icon: "🌑" },
  "Erebus":      { color: "text-gray-300",   border: "border-gray-500/40",   bg: "from-gray-950/50",    icon: "🕳️" },
  "Azathoth":    { color: "text-amber-300",  border: "border-amber-500/40",  bg: "from-amber-950/50",   icon: "🌀" },
  "The Infinite":   { color: "text-white",       border: "border-white/30",       bg: "from-zinc-950/50",      icon: "♾️" },
  "Ouroboros":      { color: "text-emerald-300", border: "border-emerald-500/40", bg: "from-emerald-950/50",   icon: "🐍" },
  "Yog-Sothoth":    { color: "text-cyan-300",    border: "border-cyan-500/40",    bg: "from-cyan-950/50",      icon: "🌀" },
  "Nemesis":        { color: "text-rose-300",     border: "border-rose-500/40",    bg: "from-rose-950/50",      icon: "⚖️" },
  "The Devourer":   { color: "text-red-500",      border: "border-red-700/50",     bg: "from-red-950/60",       icon: "🕳️" },
  "Chronovore":     { color: "text-teal-300",     border: "border-teal-600/40",    bg: "from-teal-950/50",      icon: "⏱️" },
  "Tiamat Prime":   { color: "text-orange-300",   border: "border-orange-600/40",  bg: "from-orange-950/50",    icon: "🐉" },
  "Apeiron":        { color: "text-violet-300",   border: "border-violet-600/40",  bg: "from-violet-950/50",    icon: "∞"  },
  "Yaldabaoth":     { color: "text-yellow-300",   border: "border-yellow-600/40",  bg: "from-yellow-950/50",    icon: "👁️" },
  "Final Entropy":  { color: "text-slate-300",    border: "border-slate-500/40",   bg: "from-slate-950/70",     icon: "💀" },
  "The First Cause":{ color: "text-amber-200",    border: "border-amber-400/40",   bg: "from-amber-950/50",     icon: "✨" },
  "Origin":         { color: "text-white",        border: "border-white/50",       bg: "from-white/5",          icon: "🌟" },
};

const RAID_DROP_TIER: Record<string, string> = {
  "Ares": "Eternal", "Thanatos": "Eternal", "Kronos": "Eternal",
  "Typhon": "Eternal", "Nyx": "Eternal", "Erebus": "Eternal",
  "Azathoth": "Primordial", "The Infinite": "Omnipotent", "Ouroboros": "Omnipotent",
  "Yog-Sothoth": "Omnipotent",
  "Nemesis": "Sovereign", "The Devourer": "Sovereign", "Chronovore": "Sovereign",
  "Tiamat Prime": "Genesis", "Apeiron": "Genesis", "Yaldabaoth": "Genesis",
  "Final Entropy": "The Absolute", "The First Cause": "The Absolute", "Origin": "The Absolute",
};

const RAID_DROP_COLOR: Record<string, string> = {
  Eternal: "text-yellow-600", Primordial: "text-white/90", Omnipotent: "text-amber-400",
  Sovereign: "text-fuchsia-300", Genesis: "text-teal-300", "The Absolute": "text-white",
};

const RARITY_COLORS: Record<string, string> = {
  Common: "text-gray-300", Uncommon: "text-green-400", Rare: "text-blue-400",
  Epic: "text-purple-400", Legendary: "text-orange-400", Mythic: "text-red-400",
  Divine: "text-pink-400", Abyssal: "text-violet-500", Transcendent: "text-fuchsia-300",
  Cosmic: "text-cyan-300", Eternal: "text-yellow-300",
  Primordial: "text-white", Omnipotent: "text-amber-200",
  Sovereign: "text-fuchsia-300", Genesis: "text-teal-300", "The Absolute": "text-white",
};

function formatCooldown(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  return `${Math.floor(minutes / 60)}h ${minutes % 60 > 0 ? `${minutes % 60}m` : ""}`.trim();
}

function getRemainingCooldown(completedAtMs: number | undefined, cooldownMinutes: number): number {
  if (!completedAtMs) return 0;
  const elapsed = (Date.now() - completedAtMs) / 60000;
  return Math.max(0, Math.ceil(cooldownMinutes - elapsed));
}

export default function Raids() {
  const { data: playerData } = usePlayer();
  const queryClient = useQueryClient();
  const [raidData, setRaidData] = useState<RaidResponse | null>(null);
  const [log, setLog] = useState<string[]>([]);
  const [isAttacking, setIsAttacking] = useState(false);
  const [autoAttack, setAutoAttack] = useState(false);
  const [flash, setFlash] = useState<"hit" | "damage" | null>(null);
  const [lastLoot, setLastLoot] = useState<{ name: string; rarity: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [resultDismissed, setResultDismissed] = useState(false);
  const autoRef = useRef(false);
  const logEndRef = useRef<HTMLDivElement>(null);

  const fetchRaids = useCallback(async () => {
    try { setRaidData(Engine.getRaids()); } catch { /* ignore */ }
  }, []);

  useEffect(() => { fetchRaids(); }, [fetchRaids]);

  // Auto-scroll log
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [log]);

  const attack = useCallback(async () => {
    if (isAttacking) return;
    setIsAttacking(true);
    setError(null);
    try {
      const data: AttackResponse = Engine.attackRaid();
      setRaidData(prev => prev ? { ...prev, raid: data.raid, player: data.player } : prev);
      setLog(prev => [...prev, ...data.log].slice(-60));
      if (data.loot) { setLastLoot(data.loot); }
      setFlash("hit");
      setTimeout(() => setFlash(null), 250);
      // Sync player HP
      queryClient.setQueryData(getGetPlayerQueryKey(), (old: unknown) => {
        if (!old || typeof old !== "object") return old;
        return { ...(old as object), ...data.player };
      });
      if (["victory", "defeated", "fled"].includes(data.raid.status)) {
        setAutoAttack(false);
        autoRef.current = false;
        fetchRaids();
      }
    } catch {
      setError("Network error");
    }
    setIsAttacking(false);
  }, [isAttacking, queryClient, fetchRaids]);

  // Auto-attack loop
  useEffect(() => {
    autoRef.current = autoAttack;
  }, [autoAttack]);

  useEffect(() => {
    if (!autoAttack) return;
    const interval = setInterval(() => {
      if (autoRef.current) attack();
    }, 1400);
    return () => clearInterval(interval);
  }, [autoAttack, attack]);

  const startRaid = async (godName: string) => {
    setError(null);
    setLog([]);
    setLastLoot(null);
    setResultDismissed(false);
    try {
      const d = Engine.startRaid(godName);
      setRaidData(prev => prev ? { ...prev, raid: d.raid } : d);
    } catch (e) { setError((e as Error).message); }
  };

  const flee = async () => {
    setAutoAttack(false);
    autoRef.current = false;
    Engine.fleeRaid();
    await fetchRaids();
    setLog([]);
  };

  if (!raidData) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-yellow-500 font-display text-xs tracking-widest uppercase animate-pulse">
        Loading Raids…
      </div>
    </div>
  );

  const { raid, gods, player, raidKeys: playerRaidKeys } = raidData;
  const playerLevel = playerData?.level ?? player.level;
  const activeRaid = raid?.status === "active" ? raid : null;
  const god = gods.find(g => g.name === activeRaid?.godName);
  const theme = activeRaid ? (GOD_THEMES[activeRaid.godName] ?? GOD_THEMES["Ares"]) : null;

  // ── Active raid view ──────────────────────────────────────────────────────
  if (activeRaid && god && theme) {
    const hpPct = (activeRaid.godHp / activeRaid.godMaxHp) * 100;
    const playerHpPct = ((playerData?.hp ?? player.hp) / (playerData?.maxHp ?? player.maxHp)) * 100;
    return (
      <div className="flex flex-col gap-3 p-4 max-w-xl mx-auto">
        {/* God Header */}
        <motion.div
          className={cn("rounded-xl border p-4 bg-gradient-to-b to-black", theme.border, theme.bg)}
          animate={flash === "hit" ? { scale: [1, 0.97, 1] } : {}}
          transition={{ duration: 0.15 }}
        >
          <div className="flex items-center justify-between mb-1">
            <div>
              <p className={cn("font-display text-xl font-bold tracking-wider", theme.color)}>
                {activeRaid.godName}
              </p>
              <p className="text-gray-500 text-xs uppercase tracking-widest">{god.title}</p>
            </div>
            {activeRaid.isEnraged && (
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ repeat: Infinity, duration: 0.8 }}
                className="flex items-center gap-1 bg-red-900/50 border border-red-700/60 rounded-lg px-2 py-1"
              >
                <Flame size={12} className="text-red-400" />
                <span className="text-red-400 text-xs font-bold">ENRAGED</span>
              </motion.div>
            )}
          </div>
          {/* God HP */}
          <div className="flex items-center gap-2 mb-2">
            <span className="text-gray-500 text-xs w-6">HP</span>
            <div className="flex-1 h-2.5 bg-gray-900 rounded-full overflow-hidden">
              <motion.div
                className={cn("h-full rounded-full", activeRaid.isEnraged ? "bg-red-500" : "bg-emerald-500")}
                animate={{ width: `${hpPct}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
            <span className="text-gray-400 text-xs w-24 text-right">
              {Engine.fmtNum(activeRaid.godHp)} / {Engine.fmtNum(activeRaid.godMaxHp)}
            </span>
          </div>
          {/* Player HP */}
          <div className="flex items-center gap-2">
            <span className="text-gray-500 text-xs w-6">You</span>
            <div className="flex-1 h-2 bg-gray-900 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-red-500 rounded-full"
                animate={{ width: `${playerHpPct}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
            <span className="text-gray-400 text-xs w-24 text-right">
              {Engine.fmtNum(playerData?.hp ?? player.hp)} / {Engine.fmtNum(playerData?.maxHp ?? player.maxHp)}
            </span>
          </div>
        </motion.div>

        {/* Combat Log */}
        <div className="bg-gray-950/80 border border-gray-800/50 rounded-xl p-3 h-36 overflow-y-auto">
          <AnimatePresence initial={false}>
            {log.map((line, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -4 }}
                animate={{ opacity: 1, x: 0 }}
                className={cn(
                  "text-xs py-0.5 leading-snug",
                  line.includes("You strike") && "text-yellow-400",
                  line.includes("retaliates") && "text-red-400",
                  line.includes("Victory") && "text-green-400 font-bold",
                  line.includes("defeated you") && "text-red-500 font-bold",
                  line.includes("[ENRAGE]") && "text-orange-400 font-bold",
                  line.includes("divine relic") && "text-purple-300",
                  !line.match(/strike|retaliates|Victory|defeated|ENRAGE|relic/) && "text-gray-500",
                )}
              >
                <span className="text-gray-500">› </span>{line}
              </motion.div>
            ))}
          </AnimatePresence>
          <div ref={logEndRef} />
        </div>

        {/* Controls */}
        <div className="flex gap-2">
          <button
            onClick={attack}
            disabled={isAttacking}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm uppercase tracking-wider transition-all",
              theme.color, theme.border,
              "border bg-black/60 hover:bg-black active:scale-95"
            )}
          >
            <Swords size={16} />
            Strike
          </button>
          <button
            onClick={() => setAutoAttack(a => !a)}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm uppercase tracking-wider transition-all border",
              autoAttack
                ? "bg-yellow-900/40 border-yellow-600/60 text-yellow-400"
                : "bg-black/60 border-gray-700/40 text-gray-500 hover:border-gray-600/60 hover:text-gray-400"
            )}
          >
            <Zap size={16} />
            {autoAttack ? "Auto ON" : "Auto"}
          </button>
          <button
            onClick={flee}
            className="flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl border border-gray-700/40 text-gray-400 hover:text-red-500 hover:border-red-700/40 text-xs uppercase tracking-wider transition-all"
          >
            Flee
          </button>
        </div>
        {error && <p className="text-red-500 text-xs text-center">{error}</p>}
      </div>
    );
  }

  // ── Victory / Defeat banners ──────────────────────────────────────────────
  // Only show if we actually fought this session (log has entries) to avoid
  // showing a stale result every time the user navigates back to this page.
  if (!resultDismissed && log.length > 0 && raid && ["victory", "defeated", "fled"].includes(raid.status)) {
    return (
      <div className="flex flex-col gap-4 p-4 max-w-xl mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className={cn(
            "rounded-xl border p-6 text-center",
            raid.status === "victory" ? "border-yellow-600/40 bg-yellow-950/20" : "border-red-700/40 bg-red-950/20"
          )}
        >
          {raid.status === "victory" ? (
            <>
              <Trophy className="w-10 h-10 text-yellow-400 mx-auto mb-2" />
              <p className="font-display text-xl text-yellow-300 font-bold">Victory!</p>
              <p className="text-gray-400 text-sm mt-1">{raid.godName} has been defeated!</p>
              {lastLoot && (
                <p className={cn("text-sm font-bold mt-3", RARITY_COLORS[lastLoot.rarity] ?? "text-gray-300")}>
                  {lastLoot.rarity} — {lastLoot.name}
                </p>
              )}
            </>
          ) : raid.status === "defeated" ? (
            <>
              <Skull className="w-10 h-10 text-red-500 mx-auto mb-2" />
              <p className="font-display text-xl text-red-400 font-bold">Defeated!</p>
              <p className="text-gray-400 text-sm mt-1">The god was too powerful...</p>
            </>
          ) : (
            <>
              <Shield className="w-10 h-10 text-gray-500 mx-auto mb-2" />
              <p className="font-display text-xl text-gray-400 font-bold">Fled</p>
              <p className="text-gray-500 text-sm mt-1">You escaped with your life.</p>
            </>
          )}
        </motion.div>
        <button
          onClick={() => { setResultDismissed(true); fetchRaids(); }}
          className="text-yellow-600 hover:text-yellow-400 text-sm text-center transition-colors"
        >
          Back to Raids
        </button>
      </div>
    );
  }

  // ── God selection screen ──────────────────────────────────────────────────
  const raidCooldowns = raidData?.raidCooldowns ?? {};

  // Key inventory — only show keys the player actually has (> 0)
  const heldKeys = Object.entries(playerRaidKeys ?? {}).filter(([, n]) => n > 0);

  return (
    <div className="flex flex-col gap-3 p-4 max-w-xl mx-auto">
      <div className="text-center mb-1">
        <h1 className="font-display text-lg text-yellow-400 tracking-widest uppercase">Raids of Gods</h1>
        <p className="text-gray-400 text-xs mt-0.5">Each raid requires a key — farm dungeons to find them</p>
      </div>

      {/* Key inventory */}
      {heldKeys.length > 0 && (
        <div className="bg-gray-950/70 border border-gray-800/50 rounded-xl p-3">
          <p className="text-gray-500 text-[10px] uppercase tracking-widest mb-2 flex items-center gap-1">
            <KeyRound size={9} /> Your Keys
          </p>
          <div className="flex flex-wrap gap-2">
            {heldKeys.map(([keyName, count]) => {
              const kd = getKeyDef(keyName);
              return (
                <span key={keyName} className={cn("text-xs font-bold flex items-center gap-1 bg-black/40 border border-gray-700/40 rounded-lg px-2 py-1", kd?.color ?? "text-gray-300")}>
                  {kd?.emoji} {keyName} <span className="text-gray-400 font-normal">×{count}</span>
                </span>
              );
            })}
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 bg-red-950/40 border border-red-700/40 rounded-lg p-2.5">
          <AlertTriangle size={14} className="text-red-500 shrink-0" />
          <p className="text-red-400 text-xs">{error}</p>
        </div>
      )}

      {gods.map(god => {
        const t = GOD_THEMES[god.name] ?? GOD_THEMES["Ares"];
        const locked = playerLevel < god.minLevel;
        const cooldownRemaining = getRemainingCooldown(raidCooldowns[god.name], god.cooldownMinutes);
        const onCooldown = cooldownRemaining > 0;
        const requiredKey = GOD_REQUIRED_KEY[god.name];
        const keyDef = requiredKey ? getKeyDef(requiredKey) : null;
        const keysHeld = requiredKey ? (playerRaidKeys?.[requiredKey] ?? 0) : 0;
        const noKey = !!requiredKey && keysHeld <= 0;
        const disabled = locked || onCooldown || noKey;

        return (
          <motion.button
            key={god.name}
            whileTap={!disabled ? { scale: 0.97 } : undefined}
            disabled={disabled}
            onClick={() => !disabled && startRaid(god.name)}
            className={cn(
              "w-full text-left rounded-xl border p-4 bg-gradient-to-b to-black transition-all",
              t.border, t.bg,
              disabled
                ? "opacity-50 cursor-not-allowed"
                : "hover:brightness-110 active:scale-98"
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className={cn("font-display text-base font-bold", t.color)}>{god.name}</span>
                  <span className="text-gray-400 text-xs">{god.title}</span>
                </div>
                <p className="text-gray-500 text-xs leading-relaxed line-clamp-2">{god.lore}</p>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2">
                  <span className="text-gray-400 text-[10px] uppercase tracking-widest">
                    Lv {god.minLevel}+
                  </span>
                  <span className="text-gray-500 text-[10px]">•</span>
                  <span className="text-gray-400 text-[10px] flex items-center gap-1">
                    <Clock size={9} />
                    {formatCooldown(god.cooldownMinutes)} cooldown
                  </span>
                  <span className="text-gray-500 text-[10px]">•</span>
                  <span className={`${RAID_DROP_COLOR[RAID_DROP_TIER[god.name] ?? "Eternal"] ?? "text-yellow-800"} text-[10px] font-bold uppercase tracking-wider`}>
                    {RAID_DROP_TIER[god.name] ?? "Eternal"} drops
                  </span>
                  {keyDef && (
                    <>
                      <span className="text-gray-500 text-[10px]">•</span>
                      <span className={cn("text-[10px] font-bold flex items-center gap-0.5", keysHeld > 0 ? keyDef.color : "text-gray-600")}>
                        <KeyRound size={8} />
                        {keyDef.emoji} {keyDef.name}
                        {keysHeld > 0 ? <span className="ml-0.5 text-gray-400 font-normal">×{keysHeld}</span> : <span className="ml-0.5 text-gray-600 font-normal">(none)</span>}
                      </span>
                    </>
                  )}
                </div>
              </div>
              <div className="shrink-0 flex flex-col items-end gap-1.5">
                {locked ? (
                  <div className="flex items-center gap-1 text-gray-500 text-xs">
                    <Lock size={12} />
                    <span>Lv {god.minLevel}</span>
                  </div>
                ) : onCooldown ? (
                  <div className="flex items-center gap-1 text-gray-400 text-xs">
                    <Clock size={12} />
                    <span>{cooldownRemaining}m</span>
                  </div>
                ) : noKey ? (
                  <div className="flex items-center gap-1 text-gray-600 text-xs">
                    <KeyRound size={12} />
                    <span>Need key</span>
                  </div>
                ) : (
                  <ChevronRight size={16} className={t.color} />
                )}
              </div>
            </div>
          </motion.button>
        );
      })}
    </div>
  );
}
