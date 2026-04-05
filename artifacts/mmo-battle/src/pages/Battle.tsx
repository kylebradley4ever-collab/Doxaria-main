import { useState, useEffect, useRef, useCallback } from "react";
import { ITEM_TYPE_IMAGES } from "@/lib/itemImages";
import { getMonsterImage } from "@/lib/monsterImages";
import { fmtNum } from "@/lib/engine";
import { useQueryClient } from "@tanstack/react-query";
import {
  useStartBattle,
  usePerformAttack,
  getBattle,
  getGetPlayerQueryKey,
  getGetInventoryQueryKey,
} from "@/lib/localApi";
import { usePlayer } from "@/hooks/use-player";
import { Progress } from "@/components/ui/progress";
import { motion, AnimatePresence } from "framer-motion";
import { Sword, Shield, Skull, Sparkles, AlertTriangle, Zap, FlaskConical, MapPin, Check, Heart } from "lucide-react";
import type { LootItem } from "@/lib/localApi";
import type { SpawnedMonster as Monster } from "@/lib/gameLogic";
import { cn } from "@/lib/utils";
import { getRarityGradient, getRarityGlow } from "@/lib/rarityUtils";
import { ItemInfoSheet, type GearInfo } from "@/components/ItemInfoSheet";

type Phase = "loading" | "fighting" | "victory" | "dead";

function MonsterSprite({ name, size, isBoss, style }: { name: string; size: number; isBoss: boolean; style?: React.CSSProperties }) {
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);
  const src = getMonsterImage(name);
  return (
    <div style={{ width: size, height: size, position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
      {!loaded && !errored && (
        <div style={{ width: size, height: size, borderRadius: 12, background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div className="animate-spin" style={{ width: size * 0.45, height: size * 0.45, borderRadius: "50%", border: "2px solid rgba(140,80,255,0.3)", borderTopColor: "rgba(140,80,255,0.9)" }} />
        </div>
      )}
      {errored && (
        <div style={{ width: size, height: size, borderRadius: 12, background: "rgba(60,0,60,0.6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "#a855f7", textAlign: "center", padding: 6 }}>
          {name}
        </div>
      )}
      <img
        src={src}
        alt={name}
        onLoad={() => setLoaded(true)}
        onError={() => { setErrored(true); setLoaded(false); }}
        style={{
          ...style,
          width: size,
          height: size,
          objectFit: "contain",
          display: loaded ? "block" : "none",
        }}
      />
    </div>
  );
}

const ATTACK_INTERVAL_MS = 2000;
const VICTORY_PAUSE_MS   = 2400;
const RESPAWN_SECS       = 5;

interface Rewards { xp: number; gold: number; leveledUp: boolean }

export default function Battle() {
  const [phase, setPhase]           = useState<Phase>("loading");
  const [monster, setMonster]         = useState<Monster | null>(null);
  const [log, setLog]               = useState<Array<{ id: number; text: string }>>([]);
  const logIdRef                    = useRef(0);
  const [countdown, setCountdown]   = useState(RESPAWN_SECS);
  const [recentLoot, setRecentLoot]   = useState<LootItem | null>(null);
  const [lootInfoOpen, setLootInfoOpen] = useState(false);
  const [rewards, setRewards]         = useState<Rewards | null>(null);
  const [stoneDropped, setStoneDropped] = useState(false);
  const [keyDropped, setKeyDropped]     = useState<string | null>(null);
  const [hitKey, setHitKey]           = useState(0);

  const logScrollRef       = useRef<HTMLDivElement>(null);
  const beginFlightRef     = useRef(false);  // guards beginBattle only
  const phaseRef           = useRef<Phase>("loading");
  const countdownTimerRef  = useRef<ReturnType<typeof setInterval> | null>(null);
  const victoryTimerRef    = useRef<ReturnType<typeof setTimeout> | null>(null);

  phaseRef.current = phase;

  const queryClient = useQueryClient();
  const { data: playerData } = usePlayer();
  const { mutate: startBattle } = useStartBattle();
  const { mutate: doAttack, isPending: isAttacking } = usePerformAttack();

  // Track isAttacking in a ref so the interval callback always sees the latest value
  const isAttackingRef = useRef(false);
  useEffect(() => { isAttackingRef.current = isAttacking; });

  const appendLog = useCallback((entries: string[]) => {
    const stamped = entries.map(text => ({ id: logIdRef.current++, text }));
    setLog(prev => [...prev.slice(-120), ...stamped]);
  }, []);

  // ── beginBattle ──────────────────────────────────────────────────────────
  // skipCheck=true skips the GET /battle probe and goes straight to POST /battle/start.
  // Use skipCheck after a confirmed victory or defeat — we already know there's no active battle.
  const beginBattle = useCallback((skipCheck = false) => {
    if (beginFlightRef.current) return;
    beginFlightRef.current = true;
    setPhase("loading");

    const doStart = () => {
      startBattle(undefined, {
        onSuccess: (data) => {
          setMonster(data.monster);
          appendLog(data.log);
          setPhase("fighting");
          beginFlightRef.current = false;
        },
        onError: () => {
          beginFlightRef.current = false;
          // Retry after 2 s on transient error
          setTimeout(() => beginBattle(true), 2000);
        },
      });
    };

    if (skipCheck) {
      doStart();
      return;
    }

    // First check if there's already an active battle to resume
    // (e.g. after page reload). If so, recover its state instead of starting fresh.
    getBattle()
      .then((existing) => {
        // Active battle found — resume it
        setMonster(existing.monster);
        appendLog(existing.log.length ? existing.log : [`Resuming battle against ${existing.monster.name}...`]);
        setPhase("fighting");
        beginFlightRef.current = false;
      })
      .catch(() => doStart());
  }, [startBattle, appendLog]);

  // ── singleAttack ─────────────────────────────────────────────────────────
  const singleAttack = useCallback(() => {
    // Use isAttackingRef (mirroring React Query's isPending) instead of a manual
    // flag — this can never get permanently stuck if a callback is dropped.
    if (isAttackingRef.current || phaseRef.current !== "fighting") return;

    doAttack(undefined, {
      onSuccess: (data) => {
        setMonster(data.monster);
        appendLog(data.log);
        setHitKey(k => k + 1);

        // Update player HP (and all other stats) immediately from the attack response
        // so the HP bar reflects each hit in real time instead of only at battle end.
        queryClient.setQueryData(getGetPlayerQueryKey(), data.player);

        if (data.status === "victory") {
          queryClient.invalidateQueries({ queryKey: getGetPlayerQueryKey() });
          if (data.loot) {
            queryClient.invalidateQueries({ queryKey: getGetInventoryQueryKey() });
            setRecentLoot(data.loot);
          }
          setRewards({
            xp: data.xpGained ?? 0,
            gold: data.goldGained ?? 0,
            leveledUp: data.leveledUp ?? false,
          });
          if (data.stoneDropped) setStoneDropped(true);
          if (data.keyDropped) setKeyDropped(data.keyDropped);
          setPhase("victory");

          victoryTimerRef.current = setTimeout(() => {
            setRecentLoot(null);
            setRewards(null);
            setStoneDropped(false);
            setKeyDropped(null);
            beginBattle(true);
          }, VICTORY_PAUSE_MS);

        } else if (data.status === "defeat") {
          queryClient.invalidateQueries({ queryKey: getGetPlayerQueryKey() });
          setPhase("dead");
          let count = RESPAWN_SECS;
          setCountdown(count);
          countdownTimerRef.current = setInterval(() => {
            count -= 1;
            setCountdown(count);
            if (count <= 0) {
              clearInterval(countdownTimerRef.current!);
              beginBattle(true);
            }
          }, 1000);
        }
      },
      onError: () => { /* isAttacking resets automatically via React Query */ },
    });
  }, [doAttack, appendLog, beginBattle, queryClient]);

  // Auto-scroll log — scroll the container itself, not the page
  useEffect(() => {
    const el = logScrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [log]);

  // Start battle on mount; clean up timers on unmount
  useEffect(() => {
    beginBattle();
    return () => {
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
      if (victoryTimerRef.current)   clearTimeout(victoryTimerRef.current);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-attack loop — always uses latest singleAttack via ref
  const singleAttackRef = useRef(singleAttack);
  useEffect(() => { singleAttackRef.current = singleAttack; });
  useEffect(() => {
    if (phase !== "fighting") return;
    const player = queryClient.getQueryData<any>(getGetPlayerQueryKey());
    const speed = player?.talentSpeed ?? 0;
    const effectiveInterval = Math.max(600, Math.floor(ATTACK_INTERVAL_MS * (1 - Math.min(0.5, speed * 0.01))));
    const t = setInterval(() => singleAttackRef.current(), effectiveInterval);
    return () => clearInterval(t);
  }, [phase, queryClient]);

  // ── Derived ──────────────────────────────────────────────────────────────
  const isBoss       = monster?.isBoss ?? false;
  const monsterHpPct = monster ? Math.max(0, Math.min(100, (monster.hp / monster.maxHp) * 100)) : 0;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex-1 flex flex-col max-w-3xl mx-auto w-full p-2 gap-2 relative">

      {/* ── Floating loot card ─────────────────────────────────────────── */}
      <AnimatePresence>
        {recentLoot && (
          <motion.div
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 100, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            onClick={() => setLootInfoOpen(true)}
            className={cn(
              "fixed top-20 right-4 z-50 bg-black/95 border rounded-xl p-3 w-52 cursor-pointer active:scale-[0.98] transition-transform",
              recentLoot.rarity === "The Absolute" ? "border-white/90"
              : recentLoot.rarity === "Genesis"    ? "border-emerald-300/80"
              : recentLoot.rarity === "Sovereign"  ? "border-fuchsia-300/80"
              : recentLoot.rarity === "Omnipotent" ? "border-yellow-200/80"
              : recentLoot.rarity === "Primordial" ? "border-violet-400/80"
              : recentLoot.rarity === "Eternal"    ? "border-rose-400/70"
              : recentLoot.rarity === "Cosmic"     ? "border-sky-400/70"
              : ["Divine","Abyssal","Transcendent"].includes(recentLoot.rarity)
                ? "border-fuchsia-500/60"
                : recentLoot.rarity === "Mythic"
                  ? "border-red-600/60"
                  : "border-yellow-600/60",
              getRarityGlow(recentLoot.rarity) || "shadow-[0_0_30px_rgba(212,175,55,0.25)]"
            )}
          >
            <p className={cn(
              "text-[10px] font-bold uppercase tracking-widest flex items-center gap-1 mb-2",
              recentLoot.rarity === "The Absolute"   ? "text-white"
              : recentLoot.rarity === "Genesis"      ? "text-emerald-200"
              : recentLoot.rarity === "Sovereign"    ? "text-fuchsia-200"
              : recentLoot.rarity === "Omnipotent"   ? "text-yellow-100"
              : recentLoot.rarity === "Primordial"   ? "text-violet-200"
              : recentLoot.rarity === "Eternal"      ? "text-rose-300"
              : recentLoot.rarity === "Cosmic"       ? "text-sky-300"
              : recentLoot.rarity === "Transcendent" ? "text-fuchsia-400"
              : recentLoot.rarity === "Abyssal"      ? "text-cyan-400"
              : recentLoot.rarity === "Divine"       ? "text-amber-200"
              : recentLoot.rarity === "Mythic"       ? "text-red-400"
              : "text-yellow-500"
            )}>
              <Sparkles size={10} /> {
                recentLoot.rarity === "The Absolute"   ? "THE ABSOLUTE!"
                : recentLoot.rarity === "Genesis"      ? "GENESIS!"
                : recentLoot.rarity === "Sovereign"    ? "SOVEREIGN!"
                : recentLoot.rarity === "Omnipotent"   ? "OMNIPOTENT!"
                : recentLoot.rarity === "Primordial"   ? "PRIMORDIAL!"
                : recentLoot.rarity === "Eternal"      ? "ETERNAL!"
                : recentLoot.rarity === "Cosmic"       ? "COSMIC!"
                : recentLoot.rarity === "Transcendent" ? "TRANSCENDENT!"
                : recentLoot.rarity === "Abyssal"      ? "ABYSSAL!"
                : recentLoot.rarity === "Divine"       ? "DIVINE!"
                : "Loot Found!"
              }
            </p>
            <div className="flex items-center gap-2 mb-2">
              <img
                src={ITEM_TYPE_IMAGES[recentLoot.type]}
                alt={recentLoot.type}
                className="w-10 h-10 object-contain drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)] shrink-0"
              />
              <div className="min-w-0">
                <p className={cn(
                  "text-xs font-bold truncate bg-clip-text text-transparent bg-gradient-to-r",
                  getRarityGradient(recentLoot.rarity)
                )}>
                  {recentLoot.name}
                </p>
                <p className="text-[10px] text-gray-400">
                  {recentLoot.rarity} · +{recentLoot.statBonus}&nbsp;
                  {["weapon","gloves","ring"].includes(recentLoot.type) ? "ATK" : "DEF"}
                </p>
              </div>
            </div>
            {(rewards || stoneDropped || keyDropped) && (
              <div className="flex flex-wrap gap-2 text-[11px] font-bold font-sans border-t border-gray-800 pt-2">
                {!!rewards?.xp   && <span className="text-blue-400">+{rewards.xp} XP</span>}
                {!!rewards?.gold && <span className="text-yellow-400">+{rewards.gold} G</span>}
                {rewards?.leveledUp && (
                  <motion.span
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 0.6 }}
                    className="text-green-400"
                  >
                    LVL UP!
                  </motion.span>
                )}
                {stoneDropped && (
                  <span className="flex items-center gap-0.5 text-violet-400">
                    <FlaskConical size={9} /> +1 Stone
                  </span>
                )}
                {keyDropped && (
                  <span className="flex items-center gap-0.5 text-amber-300">
                    🗝️ {keyDropped}
                  </span>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Key drop notification (no loot) ─────────────────────────────── */}
      <AnimatePresence>
        {keyDropped && !recentLoot && (
          <motion.div
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 100, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            className="fixed top-20 right-4 z-50 bg-black/95 border border-amber-700/60 rounded-xl p-3 w-44 shadow-[0_0_20px_rgba(217,119,6,0.3)]"
          >
            <p className="text-[10px] font-bold uppercase tracking-widest text-amber-400 mb-1 flex items-center gap-1">
              🗝️ Key Found!
            </p>
            <p className="text-xs font-bold text-amber-200">{keyDropped}</p>
            <p className="text-[10px] text-gray-500 mt-0.5">Use in Raids</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Battlefield ────────────────────────────────────────────────── */}
      <div className={cn(
        "relative rounded-2xl overflow-hidden border flex flex-col items-center justify-center",
        "min-h-[190px] p-3 transition-colors duration-700",
        phase === "dead"
          ? "bg-red-950/30 border-red-900/60"
          : isBoss
            ? "bg-red-950/20 border-red-700/50 shadow-[0_0_40px_rgba(185,28,28,0.2)]"
            : "bg-glass border-gold"
      )}>
        {/* Atmospheric background */}
        <div
          className="absolute inset-0 bg-cover bg-center opacity-10 mix-blend-overlay pointer-events-none"
          style={{ backgroundImage: `url(${import.meta.env.BASE_URL}images/hero-bg.png)` }}
        />

        {/* Boss banner */}
        <AnimatePresence>
          {isBoss && phase === "fighting" && (
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute top-3 left-0 right-0 flex justify-center z-20"
            >
              <span className="flex items-center gap-2 bg-red-900/80 border border-red-500/40 text-red-200 text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full animate-pulse">
                <AlertTriangle size={10} /> Boss Encounter <AlertTriangle size={10} />
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Loading ─────────────────────────────────────── */}
        {phase === "loading" && (
          <div className="flex flex-col items-center gap-3 text-yellow-600 z-10">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 0.9, ease: "linear" }}
            >
              <Zap size={36} />
            </motion.div>
            <p className="font-display text-sm tracking-wide">Entering dungeon…</p>
          </div>
        )}

        {/* ── Dead / Countdown ────────────────────────────── */}
        {phase === "dead" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="z-10 flex flex-col items-center gap-2 text-center"
          >
            <Skull size={36} className="text-red-700" />
            <h2 className="text-2xl text-red-500 drop-shadow-[0_0_15px_rgba(220,38,38,0.8)]">
              Defeated
            </h2>
            <p className="text-gray-500 font-sans text-xs uppercase tracking-widest">Respawning in</p>
            <AnimatePresence mode="wait">
              <motion.span
                key={countdown}
                initial={{ scale: 1.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.6, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="text-5xl font-display text-red-400 tabular-nums"
              >
                {countdown}
              </motion.span>
            </AnimatePresence>
          </motion.div>
        )}

        {/* ── Active battle / Victory ─────────────────────── */}
        {(phase === "fighting" || phase === "victory") && monster && (
          <div className="z-10 w-full max-w-xs flex flex-col items-center gap-2">
            {/* Monster name + HP */}
            <div className="w-full">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "text-[10px] font-bold uppercase px-2 py-0.5 rounded border",
                    isBoss
                      ? "text-red-300 bg-red-950/60 border-red-700"
                      : "text-red-400 bg-red-950/30 border-red-900/50"
                  )}>
                    {isBoss ? "BOSS" : `Lv.${monster.level}`}
                  </span>
                  <div className="flex flex-col gap-0.5">
                    <h3 className={cn("font-display text-lg leading-none", isBoss ? "text-red-200" : "text-white")}>
                      {monster.name}
                    </h3>
                    {monster.zoneName && (
                      <span className="text-[10px] text-gray-400 uppercase tracking-widest font-sans flex items-center gap-0.5">
                        <MapPin size={7} /> {monster.zoneName}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3 text-[11px] text-muted-foreground font-sans">
                  <span className="flex items-center gap-1">
                    <Sword size={10} className="text-red-400" />{monster.attack}
                  </span>
                  <span className="flex items-center gap-1">
                    <Shield size={10} className="text-blue-400" />{monster.defense}
                  </span>
                </div>
              </div>
              <div className="relative">
                <Progress
                  value={monsterHpPct}
                  indicatorColor={phase === "victory" ? "bg-gray-600" : isBoss ? "bg-red-500" : "bg-red-600"}
                  className={cn("h-3 transition-all", isBoss ? "bg-red-900/60" : "bg-red-950/60")}
                />
                <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white drop-shadow">
                  {fmtNum(monster.hp)} / {fmtNum(monster.maxHp)}
                </span>
              </div>
            </div>

            {/* Monster sprite — stage box contains everything */}
            <div className="flex items-center justify-center py-1">
              <div
                className="relative flex items-center justify-center rounded-xl overflow-hidden"
                style={{
                  width: 120,
                  height: 120,
                  background: isBoss
                    ? "radial-gradient(circle, rgba(120,30,30,1) 0%, rgba(70,10,10,1) 100%)"
                    : "radial-gradient(circle, rgba(55,25,110,1) 0%, rgba(25,8,55,1) 100%)",
                  border: isBoss ? "1px solid rgba(255,80,80,0.5)" : "1px solid rgba(140,80,255,0.5)",
                  boxShadow: isBoss
                    ? "0 0 22px 4px rgba(255,60,60,0.4)"
                    : "0 0 22px 4px rgba(140,80,255,0.4)",
                }}
              >
                <AnimatePresence mode="wait">
                  {phase === "victory" ? (
                    <motion.div
                      key="dead-sprite"
                      initial={{ scale: 1, opacity: 1, rotate: 0 }}
                      animate={{ scale: 0.4, opacity: 0, rotate: 20, y: 20 }}
                      transition={{ duration: 0.5 }}
                    >
                      <MonsterSprite
                        name={monster.name}
                        size={isBoss ? 96 : 80}
                        isBoss={isBoss}
                        style={{ filter: "grayscale(1) brightness(1.5)" }}
                      />
                    </motion.div>
                  ) : (
                    <motion.div
                      key={`sprite-${hitKey}`}
                      initial={{ x: 0 }}
                      animate={{ x: hitKey > 0 ? [-8, 8, -4, 4, 0] : 0 }}
                      transition={{ duration: 0.25 }}
                    >
                      <motion.div
                        animate={{ y: [0, -5, 0] }}
                        transition={{ repeat: Infinity, duration: isBoss ? 1.4 : 2, ease: "easeInOut" }}
                      >
                        <MonsterSprite
                          name={monster.name}
                          size={isBoss ? 96 : 80}
                          isBoss={isBoss}
                          style={{
                            filter: isBoss
                              ? "drop-shadow(0 0 6px rgba(255,100,100,1)) drop-shadow(0 0 16px rgba(255,60,60,0.8))"
                              : "drop-shadow(0 0 6px rgba(200,150,255,1)) drop-shadow(0 0 16px rgba(140,80,255,0.8))",
                          }}
                        />
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Victory flash */}
                <AnimatePresence>
                  {phase === "victory" && (
                    <motion.div
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className={cn(
                        "absolute font-display text-xl text-glow",
                        isBoss ? "text-red-400" : "text-yellow-400"
                      )}
                    >
                      {isBoss ? <><Zap size={16} className="inline mb-0.5" /> Slain!</> : <><Check size={16} className="inline mb-0.5" /> Victory!</>}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Player HP bar — updates per hit via live query cache */}
            {playerData && (
              <div className="w-full mt-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="flex items-center gap-1 text-xs text-gray-400 uppercase tracking-widest font-sans">
                    <Heart size={9} className="text-red-400" /> You
                  </span>
                  <span className="text-xs text-gray-300 font-mono">
                    {fmtNum(playerData.hp)} / {fmtNum(playerData.maxHp)}
                  </span>
                </div>
                <Progress
                  value={Math.max(0, Math.min(100, (playerData.hp / playerData.maxHp) * 100))}
                  indicatorColor={
                    playerData.hp / playerData.maxHp > 0.6 ? "bg-gradient-to-r from-green-800 to-green-500"
                    : playerData.hp / playerData.maxHp > 0.3 ? "bg-gradient-to-r from-yellow-800 to-yellow-500"
                    : "bg-gradient-to-r from-red-800 to-red-500"
                  }
                  className="h-2 bg-red-950/40"
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Attack timing bar ──────────────────────────────────────────── */}
      <div className="h-1 bg-gray-900 rounded-full overflow-hidden">
        <AnimatePresence>
          {phase === "fighting" && (
            <motion.div
              key={phase}
              className="h-full bg-yellow-500/50"
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: ATTACK_INTERVAL_MS / 1000, ease: "linear", repeat: Infinity }}
            />
          )}
          {phase === "dead" && (
            <motion.div
              key="dead-bar"
              className="h-full bg-red-800/60"
              initial={{ width: `${(countdown / RESPAWN_SECS) * 100}%` }}
              animate={{ width: "0%" }}
              transition={{ duration: RESPAWN_SECS, ease: "linear" }}
            />
          )}
        </AnimatePresence>
      </div>

      {/* ── Combat log ─────────────────────────────────────────────────── */}
      <div className="flex-1 bg-black/60 border border-border rounded-xl overflow-hidden flex flex-col min-h-[120px] max-h-[160px]">
        <div className="px-3 py-1.5 border-b border-gray-800/60 flex items-center gap-2">
          <span className="text-[10px] font-display text-gray-500 uppercase tracking-widest">Combat Log</span>
          {phase === "fighting" && (
            <motion.div
              className="w-1.5 h-1.5 rounded-full bg-green-500"
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ repeat: Infinity, duration: 1.2 }}
            />
          )}
        </div>
        <div ref={logScrollRef} className="flex-1 overflow-y-auto px-3 py-2 space-y-0.5 font-mono text-xs scrollbar-hide">
          <AnimatePresence initial={false}>
            {log.map(({ id, text }) => {
              const isAttack     = text.includes("You attack");
              const isHit        = text.includes("strikes you");
              const isVictory    = text.includes("has been defeated");
              const isLoot       = text.includes("Loot obtained");
              const isLevelUp    = text.includes("LEVEL UP");
              const isBossMsg    = text.includes("BOSS") && !text.includes("has been defeated");
              const isDeath      = text.includes("You have been defeated");
              const isGain       = text.includes("You gained");
              const isRegen      = text.includes("Recovered");
              const isStone      = text.includes("Enchanting Stone");
              const isKey        = text.includes("Key!") && text.includes("🗝️");
              const isSkillUp    = text.includes("Skill reached Level");
              const isZone       = text.includes("Entering") || text.includes("zone");
              const isEternal    = text.includes("Eternal") || text.includes("Cosmic") || text.includes("Primordial") || text.includes("Omnipotent");
              return (
                <motion.div
                  key={id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.12 }}
                  className={cn(
                    "py-0.5 leading-snug",
                    isDeath    && "text-red-500 font-bold",
                    isLevelUp  && "text-emerald-300 font-bold",
                    isSkillUp  && "text-teal-400 font-bold",
                    isVictory  && !isLoot && "text-green-400 font-semibold",
                    isEternal  && isLoot && "text-rose-300 font-bold",
                    !isEternal && isLoot && "text-purple-400 font-semibold",
                    isBossMsg  && "text-red-300 font-bold",
                    isStone    && "text-violet-400 font-semibold",
                    isKey      && "text-amber-300 font-semibold",
                    isAttack   && "text-yellow-400",
                    isHit      && "text-red-400",
                    isGain     && "text-blue-300",
                    isRegen    && "text-green-500 text-[10px]",
                    isZone     && "text-amber-500 font-semibold",
                    !isAttack && !isHit && !isVictory && !isLoot && !isLevelUp &&
                    !isBossMsg && !isDeath && !isGain && !isRegen && !isStone &&
                    !isKey && !isSkillUp && !isZone && "text-gray-500",
                  )}
                >
                  <span className="text-gray-500 select-none">› </span>{text}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>

      <ItemInfoSheet
        item={recentLoot ? { kind:"gear", name:recentLoot.name, rarity:recentLoot.rarity, type:recentLoot.type, statBonus:recentLoot.statBonus, goldValue:recentLoot.goldValue } : null}
        open={lootInfoOpen}
        onClose={() => setLootInfoOpen(false)}
      />
    </div>
  );
}

