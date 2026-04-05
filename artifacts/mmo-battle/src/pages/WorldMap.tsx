import { motion } from "framer-motion";
import { usePlayer } from "@/hooks/use-player";
import { Loader2, MapPin, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

const ZONES = [
  { id: 1,  name: "Verdant Forest",       minLevel: 1,     maxLevel: 10,   emoji: "🌲", color: "green",   desc: "A once-peaceful wood twisted by dark magic." },
  { id: 2,  name: "Cursed Caverns",       minLevel: 11,    maxLevel: 20,   emoji: "🕳️", color: "gray",    desc: "Ancient tunnels that swallow light." },
  { id: 3,  name: "Shadowmere Wastes",    minLevel: 21,    maxLevel: 35,   emoji: "💀", color: "purple",  desc: "Blighted plains where the dead outnumber the living." },
  { id: 4,  name: "Infernal Abyss",       minLevel: 36,    maxLevel: 55,   emoji: "🔥", color: "red",     desc: "A tear in reality bleeding hellfire." },
  { id: 5,  name: "Void Between Worlds",  minLevel: 56,    maxLevel: 79,   emoji: "🌌", color: "indigo",  desc: "The end of all things." },
  { id: 6,  name: "Celestial Spire",      minLevel: 80,    maxLevel: 120,  emoji: "✨", color: "yellow",  desc: "Heaven's towers, fallen and corrupted." },
  { id: 7,  name: "Abyssal Depths",       minLevel: 121,   maxLevel: 175,  emoji: "🌊", color: "blue",    desc: "Lightless trenches where primordial horrors breed." },
  { id: 8,  name: "Shattered Realm",      minLevel: 176,   maxLevel: 249,  emoji: "💥", color: "orange",  desc: "Reality itself has fractured." },
  { id: 9,  name: "Eternal Sanctum",      minLevel: 250,   maxLevel: 349,  emoji: "🏛️", color: "pink",    desc: "A sanctuary built by gods — now their prison." },
  { id: 10, name: "The Infinite Void",    minLevel: 350,   maxLevel: 499,  emoji: "⚫", color: "gray",    desc: "Pure nothingness given form." },
  { id: 11, name: "Primordial Chaos",     minLevel: 500,   maxLevel: 749,  emoji: "🌀", color: "violet",  desc: "The churning heart of creation." },
  { id: 12, name: "The Eternal Darkness", minLevel: 750,   maxLevel: 999,  emoji: "🌑", color: "black",   desc: "Before time, before gods — only this void." },
  { id: 13, name: "The First Void",       minLevel: 1000,  maxLevel: 1499, emoji: "🔮", color: "indigo",  desc: "A dimension that should not exist." },
  { id: 14, name: "Dimensional Fracture", minLevel: 1500,  maxLevel: 1999, emoji: "💠", color: "blue",    desc: "Where parallel worlds collide and shatter." },
  { id: 15, name: "Realm of Entropy",     minLevel: 2000,  maxLevel: 2999, emoji: "♾️", color: "violet",  desc: "Order dissolving into infinite chaos." },
  { id: 16, name: "Convergence Point",    minLevel: 3000,  maxLevel: 4999, emoji: "🌐", color: "cyan",    desc: "Where all timelines collapse into one." },
  { id: 17, name: "End of Time",          minLevel: 5000,  maxLevel: 7499, emoji: "⏳", color: "orange",  desc: "The final moment before existence ceases." },
  { id: 18, name: "Beyond Reality",       minLevel: 7500,  maxLevel: 9999, emoji: "🌠", color: "pink",    desc: "A place that exists outside all known laws." },
  { id: 19, name: "The Singularity",      minLevel: 10000, maxLevel: 14999,emoji: "🕳️", color: "red",     desc: "Infinite density. Infinite darkness." },
  { id: 20, name: "Absolute Terminus",    minLevel: 15000, maxLevel: 19999,emoji: "☄️", color: "yellow",  desc: "The final frontier of known existence." },
];

const COLOR_MAP: Record<string, { border: string; bg: string; text: string; glow: string }> = {
  green:  { border: "border-green-800/60",  bg: "bg-green-950/30",  text: "text-green-400",  glow: "shadow-green-900/40"  },
  gray:   { border: "border-gray-700/60",   bg: "bg-gray-900/30",   text: "text-gray-400",   glow: "shadow-gray-900/40"   },
  purple: { border: "border-purple-800/60", bg: "bg-purple-950/30", text: "text-purple-400", glow: "shadow-purple-900/40" },
  red:    { border: "border-red-800/60",    bg: "bg-red-950/30",    text: "text-red-400",    glow: "shadow-red-900/40"    },
  indigo: { border: "border-indigo-800/60", bg: "bg-indigo-950/30", text: "text-indigo-400", glow: "shadow-indigo-900/40" },
  yellow: { border: "border-yellow-800/60", bg: "bg-yellow-950/30", text: "text-yellow-400", glow: "shadow-yellow-900/40" },
  blue:   { border: "border-blue-800/60",   bg: "bg-blue-950/30",   text: "text-blue-400",   glow: "shadow-blue-900/40"   },
  orange: { border: "border-orange-800/60", bg: "bg-orange-950/30", text: "text-orange-400", glow: "shadow-orange-900/40" },
  pink:   { border: "border-pink-800/60",   bg: "bg-pink-950/30",   text: "text-pink-400",   glow: "shadow-pink-900/40"   },
  violet: { border: "border-violet-800/60", bg: "bg-violet-950/30", text: "text-violet-400", glow: "shadow-violet-900/40" },
  black:  { border: "border-gray-900/80",   bg: "bg-black/50",      text: "text-gray-500",   glow: "shadow-black/80"      },
  cyan:   { border: "border-cyan-800/60",   bg: "bg-cyan-950/30",   text: "text-cyan-400",   glow: "shadow-cyan-900/40"   },
};

function getZoneForLevel(level: number) {
  for (let i = ZONES.length - 1; i >= 0; i--) {
    if (level >= ZONES[i].minLevel) return ZONES[i];
  }
  return ZONES[0];
}

export default function WorldMap() {
  const { data: player, isLoading } = usePlayer();

  if (isLoading || !player) {
    return <div className="flex justify-center items-center h-48"><Loader2 className="animate-spin text-yellow-600" size={32} /></div>;
  }

  const currentZone = getZoneForLevel(player.level);

  return (
    <div className="p-4 max-w-lg mx-auto space-y-4 overflow-x-hidden">
      <div className="text-center space-y-1">
        <h1 className="font-display text-xl text-yellow-400 tracking-widest uppercase flex items-center justify-center gap-2">
          🗺️ World Map
        </h1>
        <p className="text-gray-500 text-xs">Explore all zones as you level up</p>
        <p className="text-yellow-600 text-xs">You are in: <span className="text-yellow-400 font-bold">{currentZone.emoji} {currentZone.name}</span></p>
      </div>

      <div className="space-y-2">
        {ZONES.map((zone, i) => {
          const isUnlocked = player.level >= zone.minLevel;
          const isCurrent = currentZone.id === zone.id;
          const isCompleted = player.level > zone.maxLevel;
          const colors = COLOR_MAP[zone.color];
          const progress = isCompleted ? 100 : isCurrent
            ? Math.floor(((player.level - zone.minLevel) / (zone.maxLevel - zone.minLevel + 1)) * 100)
            : 0;

          return (
            <motion.div
              key={zone.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
              className={cn(
                "rounded-xl border p-3 relative overflow-hidden transition-all",
                isUnlocked ? colors.border : "border-gray-900",
                isUnlocked ? colors.bg : "bg-gray-950/20",
                isCurrent ? `shadow-lg ${colors.glow}` : "",
                !isUnlocked && "opacity-50"
              )}
            >
              {isCurrent && (
                <motion.div
                  className="absolute inset-0 opacity-10"
                  style={{ background: `radial-gradient(ellipse at center, currentColor 0%, transparent 70%)` }}
                  animate={{ opacity: [0.05, 0.15, 0.05] }}
                  transition={{ repeat: Infinity, duration: 3 }}
                />
              )}
              <div className="flex items-center gap-3">
                <div className="text-2xl">{isUnlocked ? zone.emoji : "🔒"}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={cn("font-bold text-sm", isUnlocked ? colors.text : "text-gray-400")}>{zone.name}</span>
                    {isCurrent && (
                      <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1.5 }}>
                        <MapPin size={12} className="text-yellow-400" />
                      </motion.div>
                    )}
                    {isCompleted && <span className="text-green-400 text-xs">✓</span>}
                  </div>
                  <div className="text-gray-400 text-xs">Lv. {zone.minLevel}–{zone.maxLevel}</div>
                  {isUnlocked && <div className="text-gray-400 text-xs mt-0.5 truncate">{zone.desc}</div>}
                  {!isUnlocked && <div className="text-gray-500 text-xs">Reach level {zone.minLevel} to unlock</div>}
                  {(isCurrent || isCompleted) && (
                    <div className="mt-1.5">
                      <div className="h-1 rounded-full bg-gray-800 overflow-hidden">
                        <motion.div
                          className={cn("h-full rounded-full", isCompleted ? "bg-green-500" : colors.text.replace("text-", "bg-"))}
                          initial={{ width: 0 }}
                          animate={{ width: `${progress}%` }}
                          transition={{ duration: 0.8, ease: "easeOut" }}
                        />
                      </div>
                      <div className="text-gray-400 text-xs mt-0.5 text-right">{progress}%</div>
                    </div>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <div className="text-gray-500 text-xs">Zone {zone.id}</div>
                  {isUnlocked && !isCurrent && (
                    <div className={cn("text-xs font-bold", isCompleted ? "text-green-500" : "text-gray-400")}>
                      {isCompleted ? "Cleared" : "Upcoming"}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {player.level >= 1000 && (
        <div className="rounded-xl border border-yellow-900/40 bg-yellow-950/20 p-4 text-center">
          <div className="text-2xl">∞</div>
          <div className="text-yellow-400 font-bold text-sm">Infinite Zones Unlocked</div>
          <div className="text-gray-500 text-xs mt-1">You have transcended the known world.</div>
        </div>
      )}
    </div>
  );
}
