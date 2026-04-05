import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Coins, TrendingUp, Star, Loader2, Package, ChevronRight, Info } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { formatNumber } from "@/lib/utils";
import * as Engine from "@/lib/engine";
import { FISHING_RODS, catchesRequiredForLevel, type FishingRod } from "@/lib/gameLogic";
import { type OwnedRod } from "@/lib/store";
import { ItemInfoSheet, type FishInfo, type RodInfo, type AnyItemInfo } from "@/components/ItemInfoSheet";

// ── Rarity types ─────────────────────────────────────────────────────────────

type FishRarity =
  | "Common" | "Uncommon" | "Rare" | "Magical" | "Epic"
  | "Legendary" | "Ancient" | "Mythic" | "Divine" | "Cosmic"
  | "Eternal" | "Transcendent" | "Celestial" | "Primordial" | "Void"
  | "Abyssal" | "Eldritch" | "Oblivion" | "Cataclysm" | "Paradox"
  | "Omniversal" | "Apex" | "Singular" | "Origin" | "The End";

const RARITY_ORDER: FishRarity[] = [
  "Common","Uncommon","Rare","Magical","Epic",
  "Legendary","Ancient","Mythic","Divine","Cosmic",
  "Eternal","Transcendent","Celestial","Primordial","Void",
  "Abyssal","Eldritch","Oblivion","Cataclysm","Paradox",
  "Omniversal","Apex","Singular","Origin","The End",
];

const RARITY_COLOR: Record<string, string> = {
  Common:"text-gray-400", Uncommon:"text-green-400", Rare:"text-blue-400",
  Magical:"text-cyan-300", Epic:"text-purple-400", Legendary:"text-orange-400",
  Ancient:"text-amber-300", Mythic:"text-red-400", Divine:"text-yellow-300",
  Cosmic:"text-indigo-300", Eternal:"text-violet-300", Transcendent:"text-fuchsia-300",
  Celestial:"text-sky-200", Primordial:"text-rose-200", Void:"text-white",
  Abyssal:"text-teal-200", Eldritch:"text-lime-300", Oblivion:"text-slate-300",
  Cataclysm:"text-red-200", Paradox:"text-cyan-100", Omniversal:"text-emerald-100",
  Apex:"text-yellow-100", Singular:"text-sky-100", Origin:"text-amber-100",
  "The End":"text-white",
  Omnipotent:"text-emerald-300", "The Absolute":"text-white",
};

const RARITY_GLOW: Record<string, string> = {
  Common:"rgba(156,163,175,0.4)", Uncommon:"rgba(74,222,128,0.6)",
  Rare:"rgba(96,165,250,0.7)", Magical:"rgba(103,232,249,0.75)",
  Epic:"rgba(192,132,252,0.8)", Legendary:"rgba(251,146,60,0.85)",
  Ancient:"rgba(251,191,36,0.85)", Mythic:"rgba(248,113,113,0.9)",
  Divine:"rgba(253,224,71,0.95)", Cosmic:"rgba(165,180,252,0.95)",
  Eternal:"rgba(196,181,253,1.0)", Transcendent:"rgba(240,171,252,1.0)",
  Celestial:"rgba(186,230,253,1.0)", Primordial:"rgba(253,164,175,1.0)",
  Void:"rgba(255,255,255,1.0)",
  Abyssal:"rgba(20,184,166,1.0)", Eldritch:"rgba(132,204,22,1.0)",
  Oblivion:"rgba(148,163,184,1.0)", Cataclysm:"rgba(252,165,165,1.0)",
  Paradox:"rgba(207,250,254,1.0)", Omniversal:"rgba(167,243,208,1.0)",
  Apex:"rgba(254,240,138,1.0)", Singular:"rgba(186,230,253,1.0)",
  Origin:"rgba(253,230,138,1.0)", "The End":"rgba(255,255,255,1.0)",
  Omnipotent:"rgba(52,211,153,1.0)", "The Absolute":"rgba(255,255,255,1.0)",
};

const RARITY_BG: Record<string, string> = {
  Common:"bg-gray-900/30 border-gray-800/50",
  Uncommon:"bg-green-950/30 border-green-900/50",
  Rare:"bg-blue-950/30 border-blue-900/50",
  Magical:"bg-cyan-950/30 border-cyan-900/50",
  Epic:"bg-purple-950/30 border-purple-900/50",
  Legendary:"bg-orange-950/30 border-orange-900/50",
  Ancient:"bg-amber-950/30 border-amber-900/50",
  Mythic:"bg-red-950/30 border-red-900/50",
  Divine:"bg-yellow-950/30 border-yellow-800/50",
  Cosmic:"bg-indigo-950/30 border-indigo-900/50",
  Eternal:"bg-violet-950/30 border-violet-900/50",
  Transcendent:"bg-fuchsia-950/30 border-fuchsia-900/50",
  Celestial:"bg-sky-950/30 border-sky-900/50",
  Primordial:"bg-rose-950/30 border-rose-900/50",
  Void:"bg-white/5 border-white/20",
  Abyssal:"bg-teal-950/30 border-teal-800/50",
  Eldritch:"bg-lime-950/30 border-lime-900/50",
  Oblivion:"bg-slate-900/30 border-slate-700/50",
  Cataclysm:"bg-red-950/40 border-red-700/50",
  Paradox:"bg-cyan-950/30 border-cyan-700/50",
  Omniversal:"bg-emerald-950/30 border-emerald-700/50",
  Apex:"bg-yellow-950/30 border-yellow-700/50",
  Singular:"bg-sky-950/30 border-sky-700/50",
  Origin:"bg-amber-950/30 border-amber-700/50",
  "The End":"bg-white/8 border-white/30",
  Omnipotent:"bg-emerald-950/30 border-emerald-800/50",
  "The Absolute":"bg-white/8 border-white/40",
};

const FISH_EMOJI: Record<string, string> = {
  Common:"🐟", Uncommon:"🐟", Rare:"🐡", Magical:"🐠",
  Epic:"🦈", Legendary:"🐬", Ancient:"🐳", Mythic:"🦑",
  Divine:"🌟", Cosmic:"🌌", Eternal:"♾️", Transcendent:"💫",
  Celestial:"⭐", Primordial:"🐲", Void:"👁️",
  Abyssal:"🌊", Eldritch:"🦠", Oblivion:"🕳️", Cataclysm:"💀",
  Paradox:"🔮", Omniversal:"🌐", Apex:"👑", Singular:"💎",
  Origin:"🔱", "The End":"☯️",
};

const FISH_IMAGE: Record<string, string> = {
  Common:       "/fish/common.png",
  Uncommon:     "/fish/uncommon.png",
  Rare:         "/fish/rare.png",
  Magical:      "/fish/magical.png",
  Epic:         "/fish/epic.png",
  Legendary:    "/fish/legendary.png",
  Ancient:      "/fish/ancient.png",
  Mythic:       "/fish/mythic.png",
  Divine:       "/fish/divine.png",
  Cosmic:       "/fish/cosmic.png",
  Eternal:      "/fish/eternal.png",
  Transcendent: "/fish/transcendent.png",
  Celestial:    "/fish/celestial.png",
  Primordial:   "/fish/primordial.png",
  Void:         "/fish/void.png",
  Abyssal:      "/fish/abyssal.png",
  Eldritch:     "/fish/eldritch.png",
  Oblivion:     "/fish/oblivion.png",
  Cataclysm:    "/fish/cataclysm.png",
  Paradox:      "/fish/paradox.png",
  Omniversal:   "/fish/omniversal.png",
  Apex:         "/fish/apex.png",
  Singular:     "/fish/singular.png",
  Origin:       "/fish/origin.png",
  "The End":    "/fish/the_end.png",
};

// ── Types ─────────────────────────────────────────────────────────────────────

interface CaughtFish {
  id: number; name: string; rarity: string; weightGrams: number;
  weightLabel: string; goldValue: number; sold: boolean; caughtAt: string;
}

interface FishingState {
  level: number; totalCaught: number; catchesToNext: number; currentGold: number;
  unsoldCount: number; unsoldGold: number; cooldownMs: number;
  recent: CaughtFish[]; rarityCounts: Record<string, number>;
  activeRodId: string; activeRod: FishingRod | null; ownedRods: OwnedRod[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

async function fetchState(): Promise<FishingState> {
  const s = Engine.getFishingState();
  return {
    level: s.fishingLevel, totalCaught: s.totalCaught, catchesToNext: s.catchesToNext,
    currentGold: s.currentGold, unsoldCount: s.unsoldCount, unsoldGold: s.unsoldGold,
    cooldownMs: s.cooldownMs, recent: s.recent as CaughtFish[],
    rarityCounts: s.rarityCounts, activeRodId: s.activeRodId,
    activeRod: s.activeRod as FishingRod | null, ownedRods: s.ownedRods as OwnedRod[],
  };
}

function getRodDef(rodId: string): FishingRod {
  return FISHING_RODS.find(r => r.id === rodId) ?? {
    id: "wooden_stick", name: "Wooden Stick", emoji: "🪵", rarity: "Common",
    description: "A stick. It works.", castSpeedBonus: 0, luckBonus: 0,
    goldMultiplier: 1.0, dropWeight: 0,
  };
}

function getOwnedRodDefs(owned: OwnedRod[]): { uid: number; rod: FishingRod }[] {
  const map = new Map<string, { uid: number; rod: FishingRod }>();
  for (const o of owned) {
    if (!map.has(o.rodId)) {
      map.set(o.rodId, { uid: o.uid, rod: getRodDef(o.rodId) });
    }
  }
  const woodenStick: FishingRod = {
    id: "wooden_stick", name: "Wooden Stick", emoji: "🪵", rarity: "Common",
    description: "A stick. It works.", castSpeedBonus: 0, luckBonus: 0,
    goldMultiplier: 1.0, dropWeight: 0,
  };
  return [{ uid: 0, rod: woodenStick }, ...Array.from(map.values())];
}

// ── Sub-components ────────────────────────────────────────────────────────────

function FishImageWithEmoji({ rarity, size = 96 }: { rarity: string; size?: number }) {
  const [imgError, setImgError] = useState(false);
  const glow = RARITY_GLOW[rarity] ?? "rgba(156,163,175,0.4)";
  const emoji = FISH_EMOJI[rarity] ?? "🐟";
  const src = FISH_IMAGE[rarity];

  if (!src || imgError) {
    return (
      <span
        style={{ fontSize: size, filter: `drop-shadow(0 0 ${Math.round(size * 0.2)}px ${glow})`, lineHeight: 1 }}
        role="img" aria-label={rarity + " fish"}
      >
        {emoji}
      </span>
    );
  }
  return (
    <div
      className="rounded-full overflow-hidden"
      style={{
        width: size, height: size,
        boxShadow: `0 0 ${Math.round(size * 0.25)}px ${glow}, 0 0 ${Math.round(size * 0.5)}px ${glow}40`,
        border: `2px solid ${glow}`,
      }}
    >
      <img
        src={src}
        alt={rarity + " fish"}
        className="w-full h-full object-cover"
        onError={() => setImgError(true)}
      />
    </div>
  );
}

function RarityBadge({ rarity }: { rarity: string }) {
  const color = RARITY_COLOR[rarity] ?? "text-gray-400";
  const bg = RARITY_BG[rarity] ?? "bg-gray-900/30 border-gray-800/50";
  return (
    <span className={`text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded border ${color} ${bg}`}>
      {rarity}
    </span>
  );
}

function CatchCard({ fish, isNew, onInfo }: { fish: CaughtFish; isNew?: boolean; onInfo?: () => void }) {
  const [imgError, setImgError] = useState(false);
  const color = RARITY_COLOR[fish.rarity] ?? "text-gray-400";
  const bg = RARITY_BG[fish.rarity] ?? "bg-gray-900/30 border-gray-800/50";
  const glow = RARITY_GLOW[fish.rarity] ?? "rgba(156,163,175,0.3)";
  const src = FISH_IMAGE[fish.rarity];

  return (
    <motion.div
      initial={isNew ? { opacity: 0, x: -16, scale: 0.96 } : undefined}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      transition={{ duration: 0.25 }}
      onClick={onInfo}
      className={`flex items-center gap-3 px-3 py-2 rounded-xl border ${bg} ${onInfo ? "cursor-pointer active:scale-[0.98] transition-transform" : ""}`}
    >
      {src && !imgError ? (
        <div
          className="w-9 h-9 rounded-full overflow-hidden shrink-0 border"
          style={{ borderColor: glow, boxShadow: `0 0 8px ${glow}60` }}
        >
          <img src={src} alt="" className="w-full h-full object-cover" onError={() => setImgError(true)} />
        </div>
      ) : (
        <span className="text-[22px] leading-none shrink-0" style={{ filter: `drop-shadow(0 0 6px ${glow})` }}>
          {FISH_EMOJI[fish.rarity] ?? "🐟"}
        </span>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className={`text-[12px] font-bold font-display ${color} truncate`}>{fish.name}</span>
          <RarityBadge rarity={fish.rarity} />
        </div>
        <span className="text-[10px] text-gray-600">{fish.weightLabel}</span>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <Coins size={10} className="text-yellow-600" />
        <span className="text-[10px] text-yellow-500 tabular-nums">{formatNumber(fish.goldValue)}</span>
      </div>
    </motion.div>
  );
}

function RodCard({
  rod, isActive, count, onEquip, onInfo,
}: { rod: FishingRod; isActive: boolean; count: number; onEquip: () => void; onInfo?: () => void }) {
  const color = RARITY_COLOR[rod.rarity] ?? "text-gray-400";
  const bg = RARITY_BG[rod.rarity] ?? "bg-gray-900/30 border-gray-800/50";
  const glow = RARITY_GLOW[rod.rarity] ?? "rgba(156,163,175,0.3)";

  return (
    <motion.div
      layout
      className={`relative flex flex-col gap-2 p-3 rounded-xl border ${bg} ${isActive ? "ring-1" : ""}`}
      style={isActive ? { boxShadow: `0 0 14px ${glow}40` } : undefined}
    >
      {isActive && (
        <div className={`absolute top-2 right-2 text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded ${color} bg-black/40 border border-current`}>
          Equipped
        </div>
      )}
      {count > 1 && (
        <div className="absolute top-2 left-10 text-[9px] text-gray-500 bg-black/60 rounded px-1">×{count}</div>
      )}
      <div className="flex items-center gap-2">
        <span className="text-2xl leading-none" style={{ filter: `drop-shadow(0 0 6px ${glow})` }}>{rod.emoji}</span>
        <div className="flex-1 min-w-0">
          <div className={`text-[12px] font-bold font-display ${color}`}>{rod.name}</div>
          <RarityBadge rarity={rod.rarity} />
        </div>
        {onInfo && (
          <button
            onClick={(e) => { e.stopPropagation(); onInfo(); }}
            className="shrink-0 w-6 h-6 rounded-full bg-black/40 border border-white/10 flex items-center justify-center"
            title="Rod info"
          >
            <Info size={10} className="text-gray-500" />
          </button>
        )}
      </div>
      <p className="text-[10px] text-gray-500 leading-relaxed">{rod.description}</p>
      <div className="grid grid-cols-3 gap-1 text-center">
        <div className="bg-black/30 rounded-lg py-1">
          <div className="text-[9px] text-gray-600 uppercase tracking-wider">Speed</div>
          <div className="text-[11px] text-blue-400 font-bold">{rod.castSpeedBonus > 0 ? `-${rod.castSpeedBonus}ms` : "—"}</div>
        </div>
        <div className="bg-black/30 rounded-lg py-1">
          <div className="text-[9px] text-gray-600 uppercase tracking-wider">Luck</div>
          <div className="text-[11px] text-green-400 font-bold">{rod.luckBonus > 0 ? `+${rod.luckBonus}` : "—"}</div>
        </div>
        <div className="bg-black/30 rounded-lg py-1">
          <div className="text-[9px] text-gray-600 uppercase tracking-wider">Gold</div>
          <div className="text-[11px] text-yellow-400 font-bold">{rod.goldMultiplier > 1 ? `×${rod.goldMultiplier.toFixed(1)}` : "×1"}</div>
        </div>
      </div>
      {!isActive && (
        <button
          onClick={onEquip}
          className="mt-1 w-full py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest border border-current/40 hover:bg-white/5 active:scale-95 transition-all"
          style={{ color: glow }}
        >
          Equip
        </button>
      )}
    </motion.div>
  );
}

// ── Cast State Type ───────────────────────────────────────────────────────────

type CastPhase = "idle" | "casting" | "waiting" | "caught" | "nothing";

// ── Main Component ────────────────────────────────────────────────────────────

export default function Fishing() {
  const queryClient = useQueryClient();
  const [phase, setPhase] = useState<CastPhase>("idle");
  const [latestFish, setLatestFish] = useState<CaughtFish | null>(null);
  const [rodJustFound, setRodJustFound] = useState<FishingRod | null>(null);
  const [autoMode, setAutoMode] = useState(false);
  const [tab, setTab] = useState<"catches" | "rods" | "records">("catches");
  const [toast, setToast] = useState<string | null>(null);
  const [infoItem, setInfoItem] = useState<AnyItemInfo | null>(null);
  const autoRef = useRef(autoMode);
  autoRef.current = autoMode;
  const castingRef = useRef(false);
  const mountedRef = useRef(true);
  useEffect(() => () => { mountedRef.current = false; }, []);

  const { data: state, isLoading } = useQuery<FishingState>({
    queryKey: ["fishing"],
    queryFn: fetchState,
    staleTime: 2000,
    refetchInterval: autoMode ? false : 6000,
  });

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2800);
  };

  const castMutation = useMutation({
    mutationFn: () => Promise.resolve(Engine.castFishing()),
    onSuccess: (result) => {
      if (result.caughtNothing) {
        setPhase("nothing");
        queryClient.invalidateQueries({ queryKey: ["fishing"] });
        setTimeout(() => {
          if (!mountedRef.current) return;
          setPhase("idle");
          castingRef.current = false;
          if (autoRef.current) setTimeout(() => doCast(), 600);
        }, 1400);
        return;
      }
      setLatestFish(result.fish as CaughtFish);
      setPhase("caught");
      if (result.rodFound) {
        setRodJustFound(result.rodFound as FishingRod);
        setTimeout(() => setRodJustFound(null), 4000);
      }
      queryClient.invalidateQueries({ queryKey: ["fishing"] });
      queryClient.invalidateQueries({ queryKey: ["player"] });
      setTimeout(() => {
        if (!mountedRef.current) return;
        setPhase("idle");
        castingRef.current = false;
        if (autoRef.current) setTimeout(() => doCast(), 800);
      }, 2200);
    },
    onError: () => {
      if (!mountedRef.current) return;
      setPhase("idle");
      castingRef.current = false;
      if (autoRef.current) setTimeout(() => doCast(), 1200);
    },
  });

  const sellMutation = useMutation({
    mutationFn: () => Promise.resolve(Engine.sellAllFish()),
    onSuccess: (result) => {
      if (result.fishSold === 0) showToast("No fish to sell!");
      else showToast(`Sold ${result.fishSold} fish for ${formatNumber(result.goldGained)} gold!`);
      queryClient.invalidateQueries({ queryKey: ["fishing"] });
      queryClient.invalidateQueries({ queryKey: ["player"] });
    },
  });

  const equipMutation = useMutation({
    mutationFn: (rodId: string) => { Engine.setActiveRod(rodId); return Promise.resolve(); },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["fishing"] }),
  });

  const doCast = useCallback(() => {
    if (castingRef.current || !mountedRef.current) return;
    castingRef.current = true;
    setPhase("casting");
    setTimeout(() => {
      if (!castingRef.current || !mountedRef.current) return;
      setPhase("waiting");
      castMutation.mutate();
    }, 1200);
  }, [castMutation]);

  useEffect(() => {
    if (!autoMode) return;
    if (!castingRef.current) doCast();
  }, [autoMode, doCast]);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 size={28} className="animate-spin text-blue-700/60" />
      </div>
    );
  }

  const fishingLv = state?.level ?? 1;
  const totalCaught = state?.totalCaught ?? 0;
  const catchesToNext = state?.catchesToNext ?? fishingLv * 10;
  const catchesThisLevel = catchesRequiredForLevel(fishingLv);
  const caughtThisLevel = catchesThisLevel - catchesToNext;
  const xpProgress = Math.min(100, Math.max(0, (caughtThisLevel / catchesThisLevel) * 100));
  const activeRod = state?.activeRod ?? null;
  const activeRodId = state?.activeRodId ?? "wooden_stick";
  const ownedRods = state?.ownedRods ?? [];
  const rodDefs = getOwnedRodDefs(ownedRods);

  const rodCountMap = new Map<string, number>();
  for (const o of ownedRods) rodCountMap.set(o.rodId, (rodCountMap.get(o.rodId) ?? 0) + 1);

  const activeRodDef = activeRod ?? {
    id: "wooden_stick", name: "Wooden Stick", emoji: "🪵", rarity: "Common",
    description: "A stick.", castSpeedBonus: 0, luckBonus: 0, goldMultiplier: 1.0, dropWeight: 0,
  };

  const latestGlow = latestFish ? (RARITY_GLOW[latestFish.rarity] ?? "rgba(96,165,250,0.5)") : "rgba(59,130,246,0.4)";
  const latestColor = latestFish ? (RARITY_COLOR[latestFish.rarity] ?? "text-blue-300") : "text-blue-300";

  return (
    <div className="flex-1 max-w-2xl mx-auto w-full px-3 pt-4 pb-8 flex flex-col gap-3 overflow-y-auto">

      {/* Header */}
      <div className="flex items-center gap-2">
        <span className="text-2xl" role="img" aria-label="fishing">🎣</span>
        <span className="font-display text-xl text-blue-200/80 tracking-wide">Fishing</span>
        <span className="ml-auto text-[10px] text-gray-600 uppercase tracking-widest">Level</span>
        <span className="font-display text-xl text-blue-300 tabular-nums">{fishingLv}</span>
      </div>

      {/* XP Bar */}
      <div className="flex flex-col gap-1">
        <div className="h-2 rounded-full bg-gray-900 overflow-hidden border border-blue-950/40">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-blue-900 via-blue-500 to-cyan-400"
            animate={{ width: `${xpProgress}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>
        <div className="flex justify-between text-[9px] text-gray-700 uppercase tracking-widest">
          <span>{formatNumber(totalCaught)} caught total</span>
          <span>{catchesToNext} more to Lv {fishingLv + 1}</span>
        </div>
      </div>

      {/* Active Rod Strip — full strip is clickable to go to My Rods */}
      <button
        onClick={() => setTab("rods")}
        className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-xl border text-left hover:brightness-125 active:scale-[0.98] transition-all ${RARITY_BG[activeRodDef.rarity] ?? "bg-gray-900/30 border-gray-800/50"}`}
        style={{ boxShadow: `0 0 10px ${RARITY_GLOW[activeRodDef.rarity] ?? "rgba(156,163,175,0.2)"}30` }}
      >
        <span className="text-xl shrink-0" style={{ filter: `drop-shadow(0 0 5px ${RARITY_GLOW[activeRodDef.rarity] ?? "rgba(156,163,175,0.3)"})` }}>
          {activeRodDef.emoji}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className={`text-[11px] font-bold font-display ${RARITY_COLOR[activeRodDef.rarity] ?? "text-gray-400"}`}>
              {activeRodDef.name}
            </span>
          </div>
          <div className="flex gap-2 mt-0.5">
            {activeRodDef.luckBonus > 0 && <span className="text-[9px] text-green-500">+{activeRodDef.luckBonus} Luck</span>}
            {activeRodDef.goldMultiplier > 1 && <span className="text-[9px] text-yellow-500">×{activeRodDef.goldMultiplier.toFixed(1)} Gold</span>}
            {activeRodDef.castSpeedBonus > 0 && <span className="text-[9px] text-blue-400">-{activeRodDef.castSpeedBonus}ms</span>}
          </div>
        </div>
        <div className="flex items-center gap-1 text-[10px] text-gray-500 shrink-0 px-2 py-1 rounded-lg bg-black/30 border border-gray-800/40">
          Switch Rod <ChevronRight size={11} />
        </div>
      </button>

      {/* Water Scene */}
      <div className="relative rounded-2xl overflow-hidden border border-blue-900/50"
        style={{ background: "linear-gradient(to bottom, #0f1117 0%, #0a1628 40%, #071020 100%)" }}
      >
        {/* Animated water layers */}
        {[...Array(4)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute left-0 right-0 h-px"
            style={{ top: `${50 + i * 12}%`, background: `rgba(59,130,246,${0.06 + i * 0.03})` }}
            animate={{ scaleX: [0.9, 1.05, 0.9], x: ["-3%", "3%", "-3%"] }}
            transition={{ duration: 4 + i * 0.8, repeat: Infinity, ease: "easeInOut" }}
          />
        ))}
        {/* Shimmer overlay */}
        <motion.div
          className="absolute inset-x-0 bottom-0 h-1/2 pointer-events-none"
          style={{ background: "linear-gradient(to bottom, transparent, rgba(15,50,100,0.3))" }}
          animate={{ opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Cast content */}
        <div className="relative flex flex-col items-center justify-center py-10 gap-4 min-h-[200px]">
          <AnimatePresence mode="wait">
            {phase === "idle" && (
              <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="flex flex-col items-center gap-2">
                {latestFish ? (
                  <>
                    <FishImageWithEmoji rarity={latestFish.rarity} size={60} />
                    <div className="text-center">
                      <div className={`text-[13px] font-display font-bold ${latestColor}`}>{latestFish.name}</div>
                      <div className="text-[10px] text-gray-500">{latestFish.weightLabel} · {latestFish.rarity}</div>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center gap-1">
                    <motion.div
                      animate={{ y: [0, -4, 0] }}
                      transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
                    >
                      <span className="text-5xl opacity-40">🎣</span>
                    </motion.div>
                    <p className="text-gray-600 text-[11px] uppercase tracking-widest mt-1">Cast your line</p>
                  </div>
                )}
              </motion.div>
            )}

            {phase === "casting" && (
              <motion.div key="casting" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="flex flex-col items-center gap-2">
                <motion.span
                  className="text-4xl"
                  animate={{ rotate: [0, 30, -10, 0], scale: [1, 1.1, 1] }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                >
                  🎣
                </motion.span>
                <motion.div
                  className="w-px bg-blue-400/60"
                  animate={{ height: [0, 60] }}
                  transition={{ duration: 0.5 }}
                />
                <p className="text-blue-400/70 text-[11px] uppercase tracking-widest">Casting…</p>
              </motion.div>
            )}

            {phase === "waiting" && (
              <motion.div key="waiting" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="flex flex-col items-center gap-3">
                <div className="relative">
                  <div className="w-px h-14 bg-gradient-to-b from-blue-400/60 to-transparent mx-auto" />
                  <motion.div
                    className="w-4 h-4 rounded-full bg-red-500 border-2 border-red-300 mx-auto"
                    animate={{ y: [0, 5, 0, -3, 0], scaleY: [1, 0.8, 1, 0.9, 1] }}
                    transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                    style={{ boxShadow: "0 0 8px rgba(239,68,68,0.6)" }}
                  />
                </div>
                <p className="text-blue-300/50 text-[11px] uppercase tracking-widest">Waiting for a bite…</p>
              </motion.div>
            )}

            {phase === "nothing" && (
              <motion.div key="nothing" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.3 }}
                className="flex flex-col items-center gap-2">
                <motion.span
                  className="text-3xl grayscale opacity-60"
                  animate={{ rotate: [-8, 8, -8] }}
                  transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
                >
                  🪝
                </motion.span>
                <p className="text-gray-600 text-[11px] uppercase tracking-widest">Nothing biting…</p>
              </motion.div>
            )}

            {phase === "caught" && latestFish && (
              <motion.div key="caught" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 1.1, opacity: 0 }} transition={{ type: "spring", bounce: 0.4 }}
                className="flex flex-col items-center gap-2">
                <motion.div
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 0.5, repeat: 2 }}
                >
                  <FishImageWithEmoji rarity={latestFish.rarity} size={80} />
                </motion.div>
                <div className="text-center">
                  <p className="text-[10px] text-gray-500 uppercase tracking-widest">You caught a</p>
                  <p className={`text-xl font-display font-bold ${latestColor} mt-0.5`}
                    style={{ textShadow: `0 0 20px ${latestGlow}` }}>
                    {latestFish.name}
                  </p>
                  <p className="text-[10px] text-gray-500 mt-0.5">
                    {latestFish.rarity} · {latestFish.weightLabel} ·&nbsp;
                    <span className="text-yellow-500">{formatNumber(latestFish.goldValue)}g</span>
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Rod Found Banner */}
          <AnimatePresence>
            {rodJustFound && (
              <motion.div
                key="rod"
                initial={{ opacity: 0, y: 20, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10 }}
                className={`absolute bottom-3 left-4 right-4 flex items-center gap-2 px-3 py-2 rounded-xl border ${RARITY_BG[rodJustFound.rarity] ?? "bg-gray-900/80 border-gray-700/50"}`}
                style={{ boxShadow: `0 0 20px ${RARITY_GLOW[rodJustFound.rarity] ?? "rgba(156,163,175,0.3)"}60` }}
              >
                <span className="text-2xl" style={{ filter: `drop-shadow(0 0 6px ${RARITY_GLOW[rodJustFound.rarity]})` }}>
                  {rodJustFound.emoji}
                </span>
                <div className="flex-1">
                  <div className="text-[9px] text-gray-500 uppercase tracking-widest">Rod Found!</div>
                  <div className={`text-[12px] font-bold font-display ${RARITY_COLOR[rodJustFound.rarity] ?? "text-gray-300"}`}>
                    {rodJustFound.name}
                  </div>
                </div>
                <RarityBadge rarity={rodJustFound.rarity} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Buttons */}
        <div className="relative flex justify-center gap-3 pb-5 z-10">
          <button
            onClick={doCast}
            disabled={phase !== "idle" || autoMode}
            className={[
              "px-7 py-2.5 rounded-xl text-[12px] font-bold uppercase tracking-widest border transition-all duration-150",
              phase === "idle" && !autoMode
                ? "text-blue-200 border-blue-700/60 bg-blue-950/50 hover:bg-blue-900/50 active:scale-95 shadow-lg shadow-blue-950/30"
                : "text-gray-700 border-gray-800/40 bg-black/30 cursor-not-allowed",
            ].join(" ")}
          >
            Cast
          </button>
          <button
            onClick={() => setAutoMode(v => !v)}
            className={[
              "px-5 py-2.5 rounded-xl text-[12px] font-bold uppercase tracking-widest border transition-all duration-150",
              autoMode
                ? "text-cyan-200 border-cyan-700/60 bg-cyan-950/50 shadow-lg shadow-cyan-950/30"
                : "text-gray-500 border-gray-800/50 bg-black/30 hover:text-gray-300",
            ].join(" ")}
          >
            {autoMode ? "Auto: ON" : "Auto"}
          </button>
        </div>
      </div>

      {/* Gold + Sell Row */}
      <div className="flex gap-2">
        <div className="flex-1 flex items-center gap-2 px-3 py-2.5 rounded-xl bg-yellow-950/20 border border-yellow-900/30">
          <Coins size={13} className="text-yellow-600 shrink-0" />
          <span className="text-[10px] text-gray-600 uppercase tracking-widest">Gold</span>
          <span className="ml-auto font-display text-yellow-300 tabular-nums">{formatNumber(state?.currentGold ?? 0)}</span>
        </div>
        <button
          onClick={() => sellMutation.mutate()}
          disabled={sellMutation.isPending || (state?.unsoldCount ?? 0) === 0}
          className={[
            "flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-[11px] font-bold uppercase tracking-widest border transition-all",
            (state?.unsoldCount ?? 0) > 0 && !sellMutation.isPending
              ? "text-yellow-300 border-yellow-800/60 bg-yellow-950/20 hover:bg-yellow-950/40 active:scale-95"
              : "text-gray-700 border-gray-800/40 bg-black/30 cursor-not-allowed",
          ].join(" ")}
        >
          {sellMutation.isPending
            ? <Loader2 size={12} className="animate-spin" />
            : <Coins size={12} />}
          {(state?.unsoldCount ?? 0) > 0
            ? `Sell ${state!.unsoldCount} (+${formatNumber(state!.unsoldGold)}g)`
            : "No fish"}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl bg-black/40 border border-gray-900/50">
        {([
          { id: "catches", label: "Catch Log", icon: <TrendingUp size={11} /> },
          { id: "rods",    label: `My Rods (${rodDefs.length})`, icon: <span className="text-[11px]">🎣</span> },
          { id: "records", label: "Records", icon: <Star size={11} /> },
        ] as const).map(({ id, label, icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={[
              "flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all",
              tab === id
                ? "bg-blue-950/60 text-blue-200 border border-blue-800/50"
                : "text-gray-600 hover:text-gray-400",
            ].join(" ")}
          >
            {icon} {label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {tab === "catches" && (
          <motion.div key="catches" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col gap-1.5">
            {(state?.recent ?? []).length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-10 text-center">
                <span className="text-4xl opacity-20">🐟</span>
                <p className="text-gray-600 text-sm">Nothing caught yet. Cast your line!</p>
              </div>
            ) : (
              (state?.recent ?? []).map((fish, i) => (
                <CatchCard
                  key={`${fish.id}-${i}`}
                  fish={fish}
                  isNew={i === 0 && phase === "idle"}
                  onInfo={() => setInfoItem({ kind:"fish", name:fish.name, rarity:fish.rarity, weightLabel:fish.weightLabel, goldValue:fish.goldValue })}
                />
              ))
            )}
          </motion.div>
        )}

        {tab === "rods" && (
          <motion.div key="rods" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col gap-3">
            <div className="text-[10px] text-gray-600 px-1">
              You own <span className="text-gray-400 font-bold">{rodDefs.length}</span> rod{rodDefs.length !== 1 ? "s" : ""}.
              Rods are found while fishing — rarer rods give better bonuses.
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {rodDefs.map(({ rod }) => (
                <RodCard
                  key={rod.id}
                  rod={rod}
                  isActive={activeRodId === rod.id}
                  count={rodCountMap.get(rod.id) ?? 1}
                  onEquip={() => equipMutation.mutate(rod.id)}
                  onInfo={() => setInfoItem({ kind:"rod", name:rod.name, rarity:rod.rarity, emoji:rod.emoji, description:rod.description, castSpeedBonus:rod.castSpeedBonus, luckBonus:rod.luckBonus, goldMultiplier:rod.goldMultiplier })}
                />
              ))}
            </div>
            <div className="flex items-center gap-2 px-3 py-3 rounded-xl bg-blue-950/10 border border-blue-950/30">
              <Package size={14} className="text-blue-700 shrink-0" />
              <p className="text-[10px] text-gray-600 leading-relaxed">
                Find rods by fishing. The rarer the rod, the lower the chance — but there's always a chance.
                The <span className="text-white font-bold">Absolute Hook</span> has never been confirmed to exist.
              </p>
            </div>
          </motion.div>
        )}

        {tab === "records" && (
          <motion.div key="records" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col gap-1.5">
            {[...RARITY_ORDER].reverse().map(r => {
              const count = state?.rarityCounts?.[r] ?? 0;
              if (count === 0) return null;
              const color = RARITY_COLOR[r] ?? "text-gray-400";
              const bg = RARITY_BG[r] ?? "bg-gray-900/30 border-gray-800/50";
              const glow = RARITY_GLOW[r] ?? "rgba(156,163,175,0.3)";
              return (
                <div key={r}
                  className={`flex items-center gap-3 px-3 py-2 rounded-xl border ${bg}`}
                  style={{ boxShadow: count > 0 ? `0 0 8px ${glow}20` : undefined }}
                >
                  <span className="text-xl leading-none" style={{ filter: `drop-shadow(0 0 5px ${glow})` }}>
                    {FISH_EMOJI[r] ?? "🐟"}
                  </span>
                  <span className={`flex-1 text-[11px] font-bold font-display ${color}`}>{r}</span>
                  <span className={`text-[12px] font-bold tabular-nums ${color}`}>{formatNumber(count)}</span>
                </div>
              );
            })}
            {Object.values(state?.rarityCounts ?? {}).every(v => v === 0) && (
              <div className="flex flex-col items-center gap-2 py-10">
                <span className="text-4xl opacity-20">📊</span>
                <p className="text-gray-600 text-sm">No catches yet.</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="fixed bottom-20 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-black/90 border border-blue-800/60 text-blue-200 text-xs font-bold tracking-widest uppercase shadow-xl whitespace-nowrap z-50"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      <ItemInfoSheet item={infoItem} open={!!infoItem} onClose={() => setInfoItem(null)} />
    </div>
  );
}
