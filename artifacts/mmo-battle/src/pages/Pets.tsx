import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Star, Heart, Shield, Sword, Coins, Zap, X, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import * as Engine from "@/lib/engine";
import { ItemInfoSheet, type PetInfo } from "@/components/ItemInfoSheet";

interface Pet {
  id: string; name: string; emoji: string; rarity: string;
  atkBonus: number; defBonus: number; hpBonus: number; goldBonus: number; xpBonus: number;
  description: string; source: string;
}

interface PetsResponse {
  pets: Pet[];
  activePetIndex: number;
  activePet: Pet | null;
  total: number;
}

const RARITY_COLORS: Record<string, string> = {
  Common: "text-gray-400 border-gray-700",
  Uncommon: "text-green-400 border-green-800",
  Rare: "text-blue-400 border-blue-800",
  Epic: "text-purple-400 border-purple-800",
  Legendary: "text-yellow-400 border-yellow-800",
  Mythic: "text-orange-400 border-orange-800",
  Divine: "text-pink-400 border-pink-800",
  Cosmic: "text-cyan-400 border-cyan-800",
  Abyssal: "text-indigo-400 border-indigo-800",
  Eternal: "text-amber-300 border-amber-700",
};

const RARITY_BG: Record<string, string> = {
  Common: "bg-gray-950/40", Uncommon: "bg-green-950/30", Rare: "bg-blue-950/30",
  Epic: "bg-purple-950/30", Legendary: "bg-yellow-950/30", Mythic: "bg-orange-950/30",
  Divine: "bg-pink-950/30", Cosmic: "bg-cyan-950/30", Abyssal: "bg-indigo-950/30", Eternal: "bg-amber-950/30",
};

export default function Pets() {
  const qc = useQueryClient();
  const [selected, setSelected] = useState<number | null>(null);
  const [infoPet, setInfoPet] = useState<PetInfo | null>(null);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);

  const { data, isLoading } = useQuery<PetsResponse>({
    queryKey: ["pets"],
    queryFn: () => Engine.getPets(),
    refetchInterval: 8000,
  });

  const equipMut = useMutation({
    mutationFn: async (index: number) => Engine.equipPet(index),
    onError: (e) => { setMessage({ text: (e as Error).message, ok: false }); },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pets"] });
      setMessage({ text: "Pet equipped!", ok: true });
      setSelected(null);
      setTimeout(() => setMessage(null), 2000);
    },
  });

  const releaseMut = useMutation({
    mutationFn: async (index: number) => Engine.releasePet(index),
    onError: (e) => { setMessage({ text: (e as Error).message, ok: false }); },
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["pets"] });
      qc.invalidateQueries({ queryKey: ["player"] });
      setMessage({ text: `Pet released! +${res.goldEarned.toLocaleString()} gold`, ok: true });
      setSelected(null);
      setTimeout(() => setMessage(null), 3000);
    },
  });

  if (isLoading || !data) {
    return <div className="flex justify-center items-center h-48"><Loader2 className="animate-spin text-yellow-600" size={32} /></div>;
  }

  return (
    <div className="p-4 max-w-lg mx-auto space-y-4">
      <div className="text-center space-y-1">
        <h1 className="font-display text-xl text-yellow-400 tracking-widest uppercase flex items-center justify-center gap-2">
          🐾 Pet Companions
        </h1>
        <p className="text-gray-400 text-xs">Pets drop from monsters. Equip one for passive bonuses.</p>
        <p className="text-gray-400 text-xs">{data.pets.length}/{data.total} pets discovered</p>
      </div>

      <AnimatePresence>
        {message && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className={cn("text-center text-sm rounded-lg py-2 px-4", message.ok ? "text-green-400 bg-green-950/30" : "text-red-400 bg-red-950/30")}>
            {message.text}
          </motion.div>
        )}
      </AnimatePresence>

      {data.activePet && (
        <div className={cn("rounded-xl border p-3 space-y-2", RARITY_COLORS[data.activePet.rarity] || "border-gray-700", RARITY_BG[data.activePet.rarity] || "")}>
          <div className="flex items-center gap-2">
            <Star size={14} className="text-yellow-400" />
            <span className="text-yellow-400 text-xs font-bold uppercase tracking-wider">Active Pet</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-4xl">{data.activePet.emoji}</span>
            <div>
              <div className="font-bold text-white">{data.activePet.name}</div>
              <div className={cn("text-xs font-bold", RARITY_COLORS[data.activePet.rarity]?.split(" ")[0])}>{data.activePet.rarity}</div>
              <div className="flex flex-wrap gap-2 mt-1">
                {data.activePet.atkBonus > 0 && <span className="text-red-400 text-xs">+{data.activePet.atkBonus} ATK</span>}
                {data.activePet.defBonus > 0 && <span className="text-blue-400 text-xs">+{data.activePet.defBonus} DEF</span>}
                {data.activePet.hpBonus > 0 && <span className="text-green-400 text-xs">+{data.activePet.hpBonus} HP</span>}
                {data.activePet.goldBonus > 0 && <span className="text-yellow-400 text-xs">+{data.activePet.goldBonus}% Gold</span>}
                {data.activePet.xpBonus > 0 && <span className="text-cyan-400 text-xs">+{data.activePet.xpBonus}% XP</span>}
              </div>
            </div>
          </div>
        </div>
      )}

      {data.pets.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <div className="text-5xl mb-3">🐾</div>
          <p className="text-sm">No pets yet. Keep fighting to find companions!</p>
          <p className="text-xs mt-1 text-gray-500">Pets drop randomly from monsters during battle.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {data.pets.map((pet, i) => {
            const isActive = data.activePetIndex === i;
            const isSelected = selected === i;
            return (
              <motion.div
                key={pet.id + '-' + i}
                whileTap={{ scale: 0.97 }}
                onClick={() => setSelected(isSelected ? null : i)}
                className={cn(
                  "rounded-xl border p-3 space-y-2 cursor-pointer transition-all",
                  isActive ? "ring-2 ring-yellow-500/60" : "",
                  RARITY_COLORS[pet.rarity] || "border-gray-700",
                  RARITY_BG[pet.rarity] || "bg-gray-950/40"
                )}
              >
                <div className="flex justify-between items-start">
                  <span className="text-3xl">{pet.emoji}</span>
                  <div className="flex items-center gap-1.5">
                    {isActive && <Star size={14} className="text-yellow-400" />}
                    <button
                      onClick={(e) => { e.stopPropagation(); setInfoPet({ kind:"pet", name:pet.name, rarity:pet.rarity, emoji:pet.emoji, atkBonus:pet.atkBonus, defBonus:pet.defBonus, hpBonus:pet.hpBonus, goldBonus:pet.goldBonus, xpBonus:pet.xpBonus, description:pet.description, source:pet.source }); }}
                      className="w-5 h-5 rounded-full bg-black/40 border border-white/10 flex items-center justify-center"
                      title="Pet info"
                    >
                      <Info size={9} className="text-gray-500" />
                    </button>
                  </div>
                </div>
                <div>
                  <div className="font-bold text-white text-sm">{pet.name}</div>
                  <div className={cn("text-xs font-bold", RARITY_COLORS[pet.rarity]?.split(" ")[0])}>{pet.rarity}</div>
                  <div className="text-gray-500 text-xs mt-1 line-clamp-2">{pet.description}</div>
                </div>
                <div className="flex flex-wrap gap-1">
                  {pet.atkBonus > 0 && <span className="text-red-400 text-xs">+{pet.atkBonus}⚔️</span>}
                  {pet.defBonus > 0 && <span className="text-blue-400 text-xs">+{pet.defBonus}🛡️</span>}
                  {pet.hpBonus > 0 && <span className="text-green-400 text-xs">+{pet.hpBonus}❤️</span>}
                  {pet.goldBonus > 0 && <span className="text-yellow-400 text-xs">+{pet.goldBonus}%💰</span>}
                  {pet.xpBonus > 0 && <span className="text-cyan-400 text-xs">+{pet.xpBonus}%⚡</span>}
                </div>
                <AnimatePresence>
                  {isSelected && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="space-y-1">
                      {!isActive && (
                        <button
                          onClick={(e) => { e.stopPropagation(); equipMut.mutate(i); }}
                          className="w-full py-1 rounded-lg bg-yellow-900/30 border border-yellow-700/40 text-yellow-400 text-xs font-bold hover:bg-yellow-900/50 transition-colors"
                        >
                          Equip
                        </button>
                      )}
                      {isActive && (
                        <button
                          onClick={(e) => { e.stopPropagation(); equipMut.mutate(-1); }}
                          className="w-full py-1 rounded-lg bg-gray-800/50 border border-gray-700 text-gray-400 text-xs font-bold hover:bg-gray-800 transition-colors"
                        >
                          Unequip
                        </button>
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); releaseMut.mutate(i); }}
                        className="w-full py-1 rounded-lg bg-red-950/30 border border-red-900/40 text-red-500 text-xs font-bold hover:bg-red-950/50 transition-colors"
                      >
                        Release (+500g)
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}

      <ItemInfoSheet item={infoPet} open={!!infoPet} onClose={() => setInfoPet(null)} />
    </div>
  );
}
