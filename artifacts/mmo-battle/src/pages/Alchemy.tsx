import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, FlaskConical, Timer, Flame, Package, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import * as Engine from "@/lib/engine";

interface Ingredient { id: string; name: string; emoji: string; description: string; }
interface PotionEffect { atkBonus?: number; defBonus?: number; hpBonus?: number; xpBonus?: number; goldBonus?: number; critBonus?: number; }
interface PotionRecipe { id: string; name: string; emoji: string; description: string; duration: number; effect: PotionEffect; ingredients: Record<string, number>; color: string; }
interface ActivePotion { recipeId: string; name: string; emoji: string; effect: PotionEffect; expiresAt: number; }
interface AlchemyResponse {
  ingredients: Record<string, number>;
  recipes: PotionRecipe[];
  ingredientDefs: Ingredient[];
  activePotion: ActivePotion | null;
}

const COLOR_MAP: Record<string, { text: string; border: string; bg: string; btn: string }> = {
  red:    { text: "text-red-400",    border: "border-red-900/40",    bg: "bg-red-950/20",    btn: "bg-red-900/30 hover:bg-red-900/50 border-red-700/40 text-red-400"    },
  blue:   { text: "text-blue-400",   border: "border-blue-900/40",   bg: "bg-blue-950/20",   btn: "bg-blue-900/30 hover:bg-blue-900/50 border-blue-700/40 text-blue-400"   },
  green:  { text: "text-green-400",  border: "border-green-900/40",  bg: "bg-green-950/20",  btn: "bg-green-900/30 hover:bg-green-900/50 border-green-700/40 text-green-400"  },
  cyan:   { text: "text-cyan-400",   border: "border-cyan-900/40",   bg: "bg-cyan-950/20",   btn: "bg-cyan-900/30 hover:bg-cyan-900/50 border-cyan-700/40 text-cyan-400"   },
  yellow: { text: "text-yellow-400", border: "border-yellow-900/40", bg: "bg-yellow-950/20", btn: "bg-yellow-900/30 hover:bg-yellow-900/50 border-yellow-700/40 text-yellow-400" },
  purple: { text: "text-purple-400", border: "border-purple-900/40", bg: "bg-purple-950/20", btn: "bg-purple-900/30 hover:bg-purple-900/50 border-purple-700/40 text-purple-400" },
  orange: { text: "text-orange-400", border: "border-orange-900/40", bg: "bg-orange-950/20", btn: "bg-orange-900/30 hover:bg-orange-900/50 border-orange-700/40 text-orange-400" },
  violet: { text: "text-violet-400", border: "border-violet-900/40", bg: "bg-violet-950/20", btn: "bg-violet-900/30 hover:bg-violet-900/50 border-violet-700/40 text-violet-400" },
};

const INGREDIENT_SOURCES: Record<string, string> = {
  shadow_dust:      "Shadow / Dark / Shade monsters",
  bone_powder:      "Skeleton / Bone / Undead / Ghoul monsters",
  void_crystal:     "Void / Null / Abyss monsters",
  fire_essence:     "Dragon / Inferno / Fire / Magma monsters",
  cosmic_dust:      "Celestial / Cosmic / Star / Astral monsters",
  blood_vial:       "Vampire / Blood monsters",
  monster_essence:  "Any monster (40% chance)",
  golden_herb:      "Any monster (30% chance)",
};

function formatTimeLeft(expiresAt: number): string {
  const ms = expiresAt - Date.now();
  if (ms <= 0) return "Expired";
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  return m > 0 ? `${m}m ${s % 60}s` : `${s}s`;
}

function formatEffect(effect: PotionEffect): string {
  const parts: string[] = [];
  if (effect.atkBonus) parts.push(`${effect.atkBonus > 0 ? "+" : ""}${effect.atkBonus}% ATK`);
  if (effect.defBonus) parts.push(`${effect.defBonus > 0 ? "+" : ""}${effect.defBonus}% DEF`);
  if (effect.hpBonus) parts.push(`+${effect.hpBonus} HP`);
  if (effect.xpBonus) parts.push(`+${effect.xpBonus}% XP`);
  if (effect.goldBonus) parts.push(`+${effect.goldBonus}% Gold`);
  return parts.join(", ");
}

function IngredientCard({
  ing, count, recipes, expanded, onToggle,
}: {
  ing: Ingredient;
  count: number;
  recipes: PotionRecipe[];
  expanded: boolean;
  onToggle: () => void;
}) {
  const usedIn = recipes.filter(r => r.ingredients[ing.id]);
  const maxCraftable = usedIn.length > 0
    ? Math.max(...usedIn.map(r => Math.floor(count / r.ingredients[ing.id])))
    : 0;

  const hasAny = count > 0;
  const canCraftSomething = usedIn.some(r => {
    const needed = r.ingredients[ing.id];
    return count >= needed;
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "rounded-xl border transition-all",
        hasAny
          ? canCraftSomething
            ? "border-green-900/50 bg-green-950/10"
            : "border-gray-700/60 bg-gray-900/30"
          : "border-gray-900/60 bg-gray-950/20 opacity-60"
      )}
    >
      <button className="w-full p-3 flex items-center gap-3 text-left" onClick={onToggle}>
        <div className={cn(
          "w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0 border",
          hasAny ? "border-gray-700 bg-gray-800/60" : "border-gray-800/40 bg-gray-900/30"
        )}>
          {ing.emoji}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={cn("font-bold text-sm", hasAny ? "text-gray-200" : "text-gray-500")}>{ing.name}</span>
            {canCraftSomething && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-950/50 text-green-400 border border-green-800/40">Ready</span>}
          </div>
          <div className="text-gray-500 text-xs truncate">{ing.description}</div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <div className={cn(
            "text-2xl font-display tabular-nums",
            count === 0 ? "text-gray-600" : count >= 5 ? "text-yellow-400" : "text-gray-300"
          )}>
            {count}
          </div>
          {expanded ? <ChevronUp size={14} className="text-gray-500" /> : <ChevronDown size={14} className="text-gray-500" />}
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 space-y-3 border-t border-gray-800/40 pt-3">
              <div>
                <div className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-1">Drop Source</div>
                <div className="text-xs text-gray-400 flex items-center gap-1.5">
                  <span>⚔️</span>
                  {INGREDIENT_SOURCES[ing.id] ?? "Various monsters"}
                </div>
              </div>

              {usedIn.length > 0 && (
                <div>
                  <div className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-1.5">Used In Recipes</div>
                  <div className="space-y-1.5">
                    {usedIn.map(r => {
                      const needed = r.ingredients[ing.id];
                      const have = count;
                      const ok = have >= needed;
                      const crafts = Math.floor(have / needed);
                      const colors = COLOR_MAP[r.color] || COLOR_MAP.purple;
                      return (
                        <div key={r.id} className={cn(
                          "flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs border",
                          ok ? `${colors.border} ${colors.bg}` : "border-gray-800/40 bg-gray-900/20"
                        )}>
                          <span className="flex items-center gap-1.5">
                            <span>{r.emoji}</span>
                            <span className={ok ? colors.text : "text-gray-500"}>{r.name}</span>
                          </span>
                          <span className={cn("font-bold tabular-nums", ok ? "text-green-400" : "text-gray-600")}>
                            {have}/{needed}
                            {crafts > 0 && <span className="text-gray-400 font-normal ml-1">({crafts}×)</span>}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {usedIn.length === 0 && (
                <div className="text-xs text-gray-600 italic">Not used in any recipe yet.</div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function StashView({ data }: { data: AlchemyResponse }) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const toggle = (id: string) => setExpanded(prev => prev === id ? null : id);

  const total = data.ingredientDefs.reduce((s, i) => s + (data.ingredients[i.id] || 0), 0);
  const uniqueHeld = data.ingredientDefs.filter(i => (data.ingredients[i.id] || 0) > 0).length;

  const sorted = [...data.ingredientDefs].sort((a, b) => {
    const ca = data.ingredients[a.id] || 0;
    const cb = data.ingredients[b.id] || 0;
    return cb - ca;
  });

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-gray-800 bg-gray-900/40 p-3 grid grid-cols-3 gap-2 text-center text-xs">
        <div>
          <div className="text-yellow-400 font-display text-lg">{total}</div>
          <div className="text-gray-500 text-[10px] uppercase tracking-widest">Total</div>
        </div>
        <div>
          <div className="text-purple-400 font-display text-lg">{uniqueHeld}</div>
          <div className="text-gray-500 text-[10px] uppercase tracking-widest">Types</div>
        </div>
        <div>
          <div className="text-green-400 font-display text-lg">{data.ingredientDefs.length}</div>
          <div className="text-gray-500 text-[10px] uppercase tracking-widest">Known</div>
        </div>
      </div>

      <div className="space-y-2">
        {sorted.map((ing, i) => (
          <motion.div key={ing.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
            <IngredientCard
              ing={ing}
              count={data.ingredients[ing.id] || 0}
              recipes={data.recipes}
              expanded={expanded === ing.id}
              onToggle={() => toggle(ing.id)}
            />
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function LabView({
  data,
  brewing,
  onBrew,
}: {
  data: AlchemyResponse;
  brewing: string | null;
  onBrew: (id: string) => void;
}) {
  return (
    <div className="space-y-4">
      {data.activePotion && (
        <div className="rounded-xl border border-green-900/40 bg-green-950/20 p-3">
          <div className="flex items-center gap-2 mb-2">
            <Flame size={14} className="text-green-400" />
            <span className="text-green-400 text-xs font-bold uppercase tracking-wider">Active Potion</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-3xl">{data.activePotion.emoji}</span>
            <div>
              <div className="font-bold text-white">{data.activePotion.name}</div>
              <div className="text-green-300 text-xs">{formatEffect(data.activePotion.effect)}</div>
              <div className="flex items-center gap-1 mt-1 text-gray-400 text-xs">
                <Timer size={10} />
                <span>{formatTimeLeft(data.activePotion.expiresAt)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="rounded-xl border border-gray-800 bg-gray-900/40 p-3">
        <div className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-2">🧪 Ingredients on Hand</div>
        {Object.keys(data.ingredients).filter(k => (data.ingredients[k] || 0) > 0).length === 0 ? (
          <div className="text-gray-500 text-xs text-center py-2">No ingredients yet. Keep fighting!</div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {data.ingredientDefs.map(ing => {
              const count = data.ingredients[ing.id] || 0;
              if (count === 0) return null;
              return (
                <div key={ing.id} className="flex items-center gap-1 bg-gray-800/60 rounded-lg px-2 py-1 text-xs">
                  <span>{ing.emoji}</span>
                  <span className="text-gray-300">{ing.name}</span>
                  <span className="text-yellow-400 font-bold">×{count}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="space-y-3">
        <div className="text-gray-400 text-xs font-bold uppercase tracking-widest">Recipes</div>
        {data.recipes.map(recipe => {
          const colors = COLOR_MAP[recipe.color] || COLOR_MAP.purple;
          const canBrew = Object.entries(recipe.ingredients).every(([ing, needed]) => (data.ingredients[ing] || 0) >= needed);
          const isBrewing = brewing === recipe.id;
          return (
            <motion.div
              key={recipe.id}
              className={cn("rounded-xl border p-3 space-y-2", colors.border, colors.bg)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{recipe.emoji}</span>
                  <div>
                    <div className={cn("font-bold text-sm", colors.text)}>{recipe.name}</div>
                    <div className="text-gray-400 text-xs">{recipe.description}</div>
                  </div>
                </div>
                <div className="text-gray-400 text-xs shrink-0">{Math.floor(recipe.duration / 60)}min</div>
              </div>
              <div className="flex flex-wrap gap-1">
                {data.ingredientDefs
                  .filter(i => recipe.ingredients[i.id])
                  .map(ing => {
                    const needed = recipe.ingredients[ing.id];
                    const have = data.ingredients[ing.id] || 0;
                    const ok = have >= needed;
                    return (
                      <span key={ing.id} className={cn("text-xs px-2 py-0.5 rounded-full", ok ? "bg-green-950/40 text-green-400" : "bg-red-950/40 text-red-400")}>
                        {ing.emoji} {have}/{needed} {ing.name.split(" ")[0]}
                      </span>
                    );
                  })}
              </div>
              <button
                onClick={() => onBrew(recipe.id)}
                disabled={!canBrew || isBrewing}
                className={cn(
                  "w-full py-1.5 rounded-lg border text-xs font-bold transition-colors flex items-center justify-center gap-1",
                  canBrew ? colors.btn : "border-gray-800 bg-transparent text-gray-700 cursor-not-allowed"
                )}
              >
                {isBrewing ? <Loader2 size={12} className="animate-spin" /> : <FlaskConical size={12} />}
                {canBrew ? "Brew Potion" : "Insufficient Ingredients"}
              </button>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

type Tab = "lab" | "stash";

export default function Alchemy() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<Tab>("lab");
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);
  const [brewing, setBrewing] = useState<string | null>(null);

  const { data, isLoading } = useQuery<AlchemyResponse>({
    queryKey: ["alchemy"],
    queryFn: () => Engine.getAlchemy(),
    refetchInterval: 3000,
  });

  const brewMut = useMutation({
    mutationFn: async (recipeId: string) => Engine.brewPotion(recipeId),
    onMutate: (id) => setBrewing(id),
    onSettled: () => setBrewing(null),
    onError: (e) => { setMessage({ text: (e as Error).message, ok: false }); setTimeout(() => setMessage(null), 3000); },
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["alchemy"] });
      setMessage({ text: `${res.potion.emoji} ${res.potion.name} brewed!`, ok: true });
      setTimeout(() => setMessage(null), 3000);
    },
  });

  if (isLoading || !data) {
    return <div className="flex justify-center items-center h-48"><Loader2 className="animate-spin text-yellow-600" size={32} /></div>;
  }

  const totalIngredients = data.ingredientDefs.reduce((s, i) => s + (data.ingredients[i.id] || 0), 0);

  return (
    <div className="p-4 max-w-lg mx-auto space-y-4">
      <div className="text-center space-y-1">
        <h1 className="font-display text-xl text-yellow-400 tracking-widest uppercase flex items-center justify-center gap-2">
          <FlaskConical size={18} /> Alchemy Lab
        </h1>
        <p className="text-gray-500 text-xs">Brew powerful potions from monster drops</p>
      </div>

      <div className="flex rounded-lg overflow-hidden border border-gray-800 text-[10px] font-bold uppercase tracking-widest">
        <button
          onClick={() => setTab("lab")}
          className={cn(
            "flex-1 flex items-center justify-center gap-1.5 py-2 transition-colors",
            tab === "lab" ? "bg-purple-900/40 text-purple-300" : "bg-black text-gray-500 hover:text-gray-300"
          )}
        >
          <FlaskConical size={11} /> Lab
        </button>
        <button
          onClick={() => setTab("stash")}
          className={cn(
            "flex-1 flex items-center justify-center gap-1.5 py-2 transition-colors relative",
            tab === "stash" ? "bg-yellow-900/40 text-yellow-300" : "bg-black text-gray-500 hover:text-gray-300"
          )}
        >
          <Package size={11} /> Stash
          {totalIngredients > 0 && (
            <span className="ml-1 text-[9px] px-1.5 py-0.5 rounded-full bg-yellow-900/60 text-yellow-400 font-bold">
              {totalIngredients}
            </span>
          )}
        </button>
      </div>

      <AnimatePresence>
        {message && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className={cn("text-center text-sm rounded-lg py-2 px-4", message.ok ? "text-green-400 bg-green-950/30" : "text-red-400 bg-red-950/30")}>
            {message.text}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {tab === "lab" ? (
          <motion.div key="lab" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <LabView data={data} brewing={brewing} onBrew={(id) => brewMut.mutate(id)} />
          </motion.div>
        ) : (
          <motion.div key="stash" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <StashView data={data} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
