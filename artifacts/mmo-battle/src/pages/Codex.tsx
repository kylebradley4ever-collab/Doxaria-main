import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { Loader2, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import * as Engine from "@/lib/engine";

interface CodexEntry { name: string; kills: number; }
interface CodexResponse { entries: CodexEntry[]; totalDiscovered: number; totalKills: number; }

const MONSTER_EMOJIS: Record<string, string> = {
  "Slime": "🟢", "Rat Swarm": "🐀", "Goblin": "👺", "Skeleton": "💀", "Forest Wolf": "🐺",
  "Zombie": "🧟", "Bandit": "🗡️", "Wicked Witch": "🧙", "Plague Rat": "🐁", "Stone Imp": "🪨",
  "Feral Hog": "🐗", "Cursed Scarecrow": "🎃", "Orc Brute": "👹", "Ghoul": "👻", "Wraith": "💨",
  "Vampire": "🧛", "Stone Golem": "🗿", "Dark Elf": "🧝", "Werewolf": "🐺", "Cave Troll": "🧌",
  "Bog Witch": "🧙", "Iron Golem": "⚙️", "Shadow Rogue": "🌑", "Blood Wolf": "🐺",
  "Demon": "😈", "Dark Knight": "🖤", "Hellhound": "🔥", "Necromancer": "☠️", "Shade": "👤",
  "Medusa": "🐍", "Death Knight": "💀", "Shadow Stalker": "🌚", "Plague Doctor": "🎭",
  "Dragon": "🐉", "Infernal Lord": "😈", "Chaos Beast": "👾", "Void Spawner": "🌀",
  "Elder Demon": "👿", "Leviathan": "🌊", "Inferno Wyrm": "🔥", "Abyssal Specter": "👁️",
  "Void Walker": "🚶", "Cosmic Horror": "🌌", "Primordial Beast": "🦕", "Abyss Titan": "⬛",
  "Oblivion Drake": "🐲", "Null Entity": "⬜", "Entropy Fiend": "💨", "Void Sovereign": "👑",
  "Corrupted Seraph": "😇", "Fallen Angel": "🪽", "Celestial Guardian": "⭐",
  "Light Wraith": "💫", "Heaven's Exile": "🌟", "Radiant Fiend": "☀️",
  "Kraken Spawn": "🐙", "Deep One": "🦑", "Void Hydra": "🐍", "Abyssal Revenant": "👁️",
  "Reality Breach": "💥", "Chaos Lord": "👑", "Fractured Titan": "⚡",
};

function getKillTier(kills: number): { label: string; color: string } {
  if (kills >= 1000) return { label: "Nemesis",    color: "text-orange-400" };
  if (kills >= 500)  return { label: "Slayer",     color: "text-red-400"    };
  if (kills >= 100)  return { label: "Hunter",     color: "text-purple-400" };
  if (kills >= 50)   return { label: "Veteran",    color: "text-blue-400"   };
  if (kills >= 10)   return { label: "Familiar",   color: "text-green-400"  };
  return               { label: "Novice",      color: "text-gray-500"   };
}

export default function Codex() {
  const { data, isLoading } = useQuery<CodexResponse>({
    queryKey: ["codex"],
    queryFn: () => Engine.getCodex(),
    refetchInterval: 10000,
  });

  if (isLoading || !data) {
    return <div className="flex justify-center items-center h-48"><Loader2 className="animate-spin text-yellow-600" size={32} /></div>;
  }

  return (
    <div className="p-4 max-w-lg mx-auto space-y-4">
      <div className="text-center space-y-1">
        <h1 className="font-display text-xl text-yellow-400 tracking-widest uppercase flex items-center justify-center gap-2">
          <BookOpen size={18} /> Monster Codex
        </h1>
        <p className="text-gray-500 text-xs">Bestiary of all monsters encountered in battle</p>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="rounded-xl border border-gray-800 bg-gray-900/40 p-3">
          <div className="text-xl font-bold text-yellow-400">{data.totalDiscovered}</div>
          <div className="text-gray-500 text-xs">Discovered</div>
        </div>
        <div className="rounded-xl border border-gray-800 bg-gray-900/40 p-3">
          <div className="text-xl font-bold text-red-400">{data.totalKills.toLocaleString()}</div>
          <div className="text-gray-500 text-xs">Total Kills</div>
        </div>
        <div className="rounded-xl border border-gray-800 bg-gray-900/40 p-3">
          <div className="text-xl font-bold text-blue-400">
            {data.entries.filter(e => e.kills >= 100).length}
          </div>
          <div className="text-gray-500 text-xs">Mastered</div>
        </div>
      </div>

      {data.entries.length === 0 ? (
        <div className="text-center py-12 text-gray-600">
          <div className="text-5xl mb-3">📖</div>
          <p className="text-sm">No entries yet. Go fight some monsters!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {data.entries.map((entry, i) => {
            const tier = getKillTier(entry.kills);
            const emoji = MONSTER_EMOJIS[entry.name] || "👾";
            const progressPct = Math.min(100, (entry.kills / 1000) * 100);
            return (
              <motion.div
                key={entry.name}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.03, 0.5) }}
                className="rounded-xl border border-gray-800 bg-gray-900/30 p-3 flex items-center gap-3"
              >
                <div className="text-2xl w-8 text-center">{emoji}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-white text-sm font-bold truncate">{entry.name}</span>
                    <span className={cn("text-xs font-bold ml-2 shrink-0", tier.color)}>{tier.label}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1 h-1 bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-red-600 rounded-full transition-all"
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                    <span className="text-gray-500 text-xs shrink-0">{entry.kills.toLocaleString()} kills</span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
