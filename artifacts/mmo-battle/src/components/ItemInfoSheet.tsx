import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { getRarityGradient } from "@/lib/rarityUtils";
import { ITEM_TYPE_IMAGES } from "@/lib/itemImages";
import { cn, formatNumber } from "@/lib/utils";
import { Coins, Zap, Shield, Swords, Heart, Star, Fish, Wand2 } from "lucide-react";

// ── Item kinds ──────────────────────────────────────────────────────────────

export type GearInfo = {
  kind: "gear";
  name: string; rarity: string; type: string;
  statBonus: number; goldValue: number;
  enchantLevel?: number; equipped?: boolean; emoji?: string;
};
export type FishInfo = {
  kind: "fish";
  name: string; rarity: string; weightLabel: string; goldValue: number;
};
export type PetInfo = {
  kind: "pet";
  name: string; rarity: string; emoji: string;
  atkBonus: number; defBonus: number; hpBonus: number;
  goldBonus: number; xpBonus: number;
  description: string; source?: string;
};
export type RodInfo = {
  kind: "rod";
  name: string; rarity: string; emoji: string;
  description: string;
  castSpeedBonus: number; luckBonus: number; goldMultiplier: number;
};

export type AnyItemInfo = GearInfo | FishInfo | PetInfo | RodInfo;

// ── Rarity flavour data ─────────────────────────────────────────────────────

const RARITY_META: Record<string, { label: string; color: string; detail: string }> = {
  Common:       { label: "Very Common",       color: "text-gray-400",    detail: "Drops frequently — no special luck needed." },
  Uncommon:     { label: "Uncommon",          color: "text-green-400",   detail: "Drops regularly. A little luck helps." },
  Rare:         { label: "Rare",              color: "text-blue-400",    detail: "Shows up occasionally. Luck upgrades help." },
  Magical:      { label: "Rare",              color: "text-cyan-300",    detail: "A notch above Rare. Luck is a meaningful factor." },
  Epic:         { label: "Very Rare",         color: "text-purple-400",  detail: "Uncommon find. Higher luck makes a real difference." },
  Legendary:    { label: "Extremely Rare",    color: "text-amber-400",   detail: "Few ever encounter one. Max luck is important." },
  Ancient:      { label: "Legendary Rarity",  color: "text-amber-300",   detail: "Extraordinarily rare. Patience and max luck required." },
  Mythic:       { label: "Mythic Rarity",     color: "text-red-400",     detail: "Near-impossible odds. The stuff of legends." },
  Divine:       { label: "Divine Rarity",     color: "text-yellow-200",  detail: "Almost none exist. Most players never see one." },
  Cosmic:       { label: "Cosmic Rarity",     color: "text-indigo-300",  detail: "One in millions of events. A cosmic coincidence." },
  Eternal:      { label: "Eternal Rarity",    color: "text-violet-300",  detail: "Appears once in an era. Luck alone won't save you." },
  Transcendent: { label: "Transcendent",      color: "text-fuchsia-300", detail: "Beyond normal rarity classifications entirely." },
  Celestial:    { label: "Celestial Rarity",  color: "text-sky-200",     detail: "A handful across all saves ever created." },
  Primordial:   { label: "Primordial Rarity", color: "text-rose-200",    detail: "Primordial rarity — essentially impossible." },
  Void:         { label: "Void Rarity",       color: "text-slate-200",   detail: "Exists in the gap between possible and impossible." },
  Abyssal:      { label: "Abyssal Rarity",    color: "text-teal-200",    detail: "So rare it barely registers on any known scale." },
  Eldritch:     { label: "Eldritch Rarity",   color: "text-lime-300",    detail: "Looking for this too long may cost you your sanity." },
  Oblivion:     { label: "Oblivion Rarity",   color: "text-slate-300",   detail: "Exists between existing and not existing." },
  Cataclysm:    { label: "Cataclysm Rarity",  color: "text-red-200",     detail: "Its appearance alone reshapes local probability." },
  Paradox:      { label: "Paradox Rarity",    color: "text-cyan-100",    detail: "Is simultaneously found and not found." },
  Omniversal:   { label: "Omniversal Rarity", color: "text-emerald-100", detail: "Every version of you across all realities tried to get this." },
  Apex:         { label: "Apex Rarity",       color: "text-yellow-100",  detail: "The apex predator of drop tables. No known counter." },
  Singular:     { label: "Singular",          color: "text-sky-100",     detail: "One exists. Across everything." },
  Origin:       { label: "Origin Rarity",     color: "text-amber-100",   detail: "The source. The first. The template for all others." },
  "The End":    { label: "The End",           color: "text-white",       detail: "There is nothing rarer. You have witnessed the impossible." },
  Omnipotent:   { label: "Omnipotent",        color: "text-emerald-300", detail: "Commands all probability. Your luck stat is irrelevant." },
  Sovereign:    { label: "Sovereign",         color: "text-purple-200",  detail: "Sovereign over all rarity. Reality bends." },
  Genesis:      { label: "Genesis",           color: "text-rose-100",    detail: "The raw material of creation itself." },
  "The Absolute": { label: "The Absolute",    color: "text-white",       detail: "It simply is. All rarity ends here." },
};

// ── Drop rate data (base stats, no luck) ────────────────────────────────────

// Gear: zone-1 normal monster, 18% base loot chance × rarity%
const GEAR_DROP_RATE: Record<string, string> = {
  Common:       "~1 in 8 kills",
  Uncommon:     "~1 in 26 kills",
  Rare:         "~1 in 93 kills",
  Epic:         "~1 in 617 kills",
  Legendary:    "~1 in 5.8k kills",
  Mythic:       "~1 in 111k kills",
  Divine:       "~zone 5+ bosses",
  Cosmic:       "~zone 8+ bosses",
  Abyssal:      "~zone 9+ bosses",
  Transcendent: "~zone 10+ bosses",
  Eternal:      "~zone 11+ bosses",
  Omnipotent:   "zone 13+ deep runs",
  Primordial:   "zone 13+ deep runs",
  Sovereign:    "jackpot — ~1 in 50k kills",
  Genesis:      "jackpot — ~1 in 500k kills",
  "The Absolute":"jackpot — ~1 in 5m kills",
};

// Fish: base (no luck), exact thresholds from rollFish
const FISH_DROP_RATE: Record<string, string> = {
  Common:       "~70% of casts",
  Uncommon:     "~1 in 6 casts",
  Rare:         "~1 in 14 casts",
  Magical:      "~1 in 33 casts",
  Epic:         "~1 in 83 casts",
  Legendary:    "~1 in 200 casts",
  Ancient:      "~1 in 556 casts",
  Mythic:       "~1 in 1.4k casts",
  Divine:       "~1 in 3.3k casts",
  Cosmic:       "~1 in 8.3k casts",
  Eternal:      "~1 in 20k casts",
  Transcendent: "~1 in 55k casts",
  Celestial:    "~1 in 143k casts",
  Primordial:   "~1 in 333k casts",
  Void:         "~1 in 833k casts",
  Abyssal:      "~1 in 2m casts",
  Eldritch:     "~1 in 5m casts",
  Oblivion:     "~1 in 16.7m casts",
  Cataclysm:    "~1 in 40m casts",
  Paradox:      "~1 in 111m casts",
  Omniversal:   "~1 in 250m casts",
  Apex:         "~1 in 833m casts",
  Singular:     "~1 in 2b casts",
  Origin:       "~1 in 5b casts",
  "The End":    "~1 in 10b casts",
};

// Pets: 0.15% base kill chance × rarity weight
const PET_DROP_RATE: Record<string, string> = {
  Common:       "~1 in 1.3k kills",
  Uncommon:     "~1 in 2.2k kills",
  Rare:         "~1 in 5.1k kills",
  Epic:         "~1 in 13k kills",
  Legendary:    "~1 in 44k kills",
  Mythic:       "~1 in 167k kills",
  Divine:       "~1 in 833k kills",
  Cosmic:       "~1 in 3.3m kills",
  Abyssal:      "~1 in 11m kills",
  Eternal:      "~1 in 33m kills",
  Transcendent: "~1 in 83m kills",
  Primordial:   "~1 in 167m kills",
  Omnipotent:   "~1 in 333m kills",
  Sovereign:    "~1 in 1.7b kills",
  Genesis:      "~1 in 8.3b kills",
  "The Absolute":"~1 in 50b kills",
};

// Rods: base fishing level (0.2% rod drop/cast) × rod's weight / total weight (~494.6)
const ROD_DROP_RATE: Record<string, string> = {
  "Willow Rod":            "~1 in 1.2k casts",
  "Bamboo Rod":            "~1 in 1.6k casts",
  "Copper Rod":            "~1 in 4.1k casts",
  "Iron Rod":              "~1 in 5.5k casts",
  "Angler's Rod":          "~1 in 12.4k casts",
  "Silver Rod":            "~1 in 20.6k casts",
  "Hunter's Rod":          "~1 in 61.8k casts",
  "Storm Rod":             "~1 in 99k casts",
  "Dragon Rod":            "~1 in 309k casts",
  "Void Rod":              "~1 in 550k casts",
  "Mythic Lure":           "~1 in 2.1m casts",
  "Abyssal Caster":        "~1 in 3.5m casts",
  "Celestial Rod":         "~1 in 12.4m casts",
  "God's Fishing Pole":    "~1 in 30.9m casts",
  "Cosmic Caster":         "~1 in 82.4m casts",
  "Eternal Lure":          "~1 in 247m casts",
  "Reality Hook":          "~1 in 618m casts",
  "The World Serpent's Rod":"~1 in 2.5b casts",
  "Omnipotent Angler":     "~1 in 8.2b casts",
  "The Absolute Hook":     "~1 in 49b casts",
};

function getDropRate(item: AnyItemInfo): string {
  if (item.kind === "gear") return GEAR_DROP_RATE[item.rarity] ?? "—";
  if (item.kind === "fish") return FISH_DROP_RATE[item.rarity] ?? "—";
  if (item.kind === "pet")  return PET_DROP_RATE[item.rarity]  ?? "—";
  if (item.kind === "rod")  return ROD_DROP_RATE[item.name]    ?? "—";
  return "—";
}

// ── Description generators ──────────────────────────────────────────────────

const GEAR_TIER_DESC: Record<string, string> = {
  Common:       "A basic piece of gear. Functional, if unremarkable.",
  Uncommon:     "Noticeably better quality. A find worth keeping.",
  Rare:         "Expertly crafted. Few fighters carry equipment this fine.",
  Epic:         "A powerful artifact radiating restrained energy.",
  Legendary:    "Legendary equipment — only the greatest warriors ever touched items this powerful.",
  Mythic:       "Mythic-grade. Its very presence warps the air around it.",
  Divine:       "Forged by divine hands. Mortals were never meant to hold this.",
  Cosmic:       "A relic from before the stars were named.",
  Abyssal:      "From the deep void. Its hunger is palpable.",
  Eternal:      "Has existed since before recorded history. Will exist after.",
  Transcendent: "Exists beyond conventional understanding of power.",
  Primordial:   "Born from the raw forces of creation itself.",
  Omnipotent:   "The pinnacle of what can exist. Mortals should not look at it directly.",
  Sovereign:    "Commands the obedience of reality.",
  Genesis:      "The first of its kind. The source of all items that followed.",
  "The Absolute": "It simply is. All other items are echoes of this one.",
};

const FISH_TIER_DESC: Record<string, string> = {
  Common:       "Found in almost every body of water. Nothing special — but still a catch.",
  Uncommon:     "Seen occasionally by patient anglers. Worth a second look.",
  Rare:         "Rarer than most fish. Skilled anglers seek it out.",
  Magical:      "Shimmers faintly. Something about it feels otherworldly.",
  Epic:         "Hard to find. Legends among local fishing villages.",
  Legendary:    "Sightings are barely believed. A prized trophy.",
  Ancient:      "Older than recorded history. Some say it remembers the first sea.",
  Mythic:       "Perhaps one or two exist in any given world. Almost no one has seen one.",
  Divine:       "Said to be blessed by ocean gods. To catch one is to be chosen.",
  Cosmic:       "Swims between galaxies when no one is watching.",
  Eternal:      "It will outlive the ocean itself.",
  Transcendent: "Transcends the concept of fish.",
  Celestial:    "Born from a falling star that entered the sea long ago.",
  Primordial:   "The ancestor of all aquatic life.",
  Void:         "Came from the space between everything. Is only mostly a fish.",
  Abyssal:      "Dwells where light has never reached and never will.",
  Eldritch:     "Looking at it too long makes you forget your name.",
  Oblivion:     "Exists in the gap between existing and not.",
  Cataclysm:    "Its presence alone reshapes local geography.",
  Paradox:      "It is both caught and uncaught simultaneously.",
  Omniversal:   "Every version of you across every reality tried and failed to catch this.",
  Apex:         "The apex predator of all possible fish. It has no natural enemies.",
  Singular:     "Unique. One in all of creation.",
  Origin:       "The very first fish. The template for all that came after.",
  "The End":    "There is nothing rarer. Finding this means something fundamental has shifted.",
};

function gearDescription(rarity: string): string {
  return GEAR_TIER_DESC[rarity] ?? "A remarkable piece of equipment.";
}
function fishDescription(rarity: string): string {
  return FISH_TIER_DESC[rarity] ?? "An extraordinary creature of the deep.";
}

// ── Rarity badge ─────────────────────────────────────────────────────────────

const RARITY_BORDER: Record<string, string> = {
  Common:"border-gray-700/60", Uncommon:"border-green-800/60", Rare:"border-blue-700/60",
  Magical:"border-cyan-700/60", Epic:"border-purple-700/60", Legendary:"border-amber-600/60",
  Ancient:"border-amber-500/60", Mythic:"border-red-600/60", Divine:"border-yellow-500/60",
  Cosmic:"border-indigo-500/60", Eternal:"border-violet-500/60", Transcendent:"border-fuchsia-500/60",
  Celestial:"border-sky-500/60", Primordial:"border-rose-500/60", Void:"border-white/30",
  Abyssal:"border-teal-600/60", Eldritch:"border-lime-700/60", Oblivion:"border-slate-600/60",
  Omnipotent:"border-emerald-400/60", Sovereign:"border-purple-400/60",
  Genesis:"border-rose-300/60", "The Absolute":"border-white/50", "The End":"border-white/50",
};

const FISH_IMAGE: Record<string, string | undefined> = {
  Common:"/fish/common.png", Uncommon:"/fish/uncommon.png", Rare:"/fish/rare.png",
  Magical:"/fish/magical.png", Epic:"/fish/epic.png", Legendary:"/fish/legendary.png",
  Ancient:"/fish/ancient.png", Mythic:"/fish/mythic.png", Divine:"/fish/divine.png",
  Cosmic:"/fish/cosmic.png", Eternal:"/fish/eternal.png", Transcendent:"/fish/transcendent.png",
  Celestial:"/fish/celestial.png", Primordial:"/fish/primordial.png", Void:"/fish/void.png",
  Abyssal:"/fish/abyssal.png", Eldritch:"/fish/eldritch.png", Oblivion:"/fish/oblivion.png",
  Cataclysm:"/fish/cataclysm.png", Paradox:"/fish/paradox.png", Omniversal:"/fish/omniversal.png",
  Apex:"/fish/apex.png", Singular:"/fish/singular.png", Origin:"/fish/origin.png",
  "The End":"/fish/the_end.png",
};

const FISH_EMOJI_MAP: Record<string, string> = {
  Common:"🐟", Uncommon:"🐟", Rare:"🐡", Magical:"🐠",
  Epic:"🦈", Legendary:"🐬", Ancient:"🐳", Mythic:"🦑",
  Divine:"🌟", Cosmic:"🌌", Eternal:"♾️", Transcendent:"💫",
  Celestial:"☄️", Primordial:"🌊", Void:"🕳️", Abyssal:"👾",
  Eldritch:"🐙", Oblivion:"💨", Cataclysm:"🌪️", Paradox:"🔀",
  Omniversal:"🌐", Apex:"⚡", Singular:"🔮", Origin:"🌱", "The End":"💀",
};

function getStatLabel(type: string): string {
  return ["weapon","gloves","ring"].includes(type) ? "ATK" : "DEF";
}
function getTypeLabel(type: string): string {
  const labels: Record<string,string> = {
    weapon:"Weapon", armor:"Armor", helmet:"Helmet", boots:"Boots",
    gloves:"Gloves", ring:"Ring", amulet:"Amulet", shield:"Shield",
  };
  return labels[type] ?? type;
}

// ── Main component ───────────────────────────────────────────────────────────

export function ItemInfoSheet({
  item, open, onClose,
}: {
  item: AnyItemInfo | null;
  open: boolean;
  onClose: () => void;
}) {
  if (!item) return null;
  const meta = RARITY_META[item.rarity] ?? { label: item.rarity, color: "text-gray-300", detail: "" };
  const borderClass = RARITY_BORDER[item.rarity] ?? "border-gray-700/50";

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className={cn(
        "bg-black/95 border max-w-sm w-[calc(100%-2rem)] mx-auto rounded-2xl p-0 overflow-hidden",
        borderClass,
      )}>
        <DialogTitle className="sr-only">{item.name} — {item.rarity}</DialogTitle>

        {/* ── Header strip ── */}
        <div className={cn(
          "px-5 pt-5 pb-3 flex items-center gap-4 border-b",
          borderClass,
        )}>
          {/* Image / emoji */}
          <ItemAvatar item={item} />

          {/* Name + rarity */}
          <div className="flex-1 min-w-0">
            <p className={cn(
              "text-sm font-bold font-display bg-clip-text text-transparent bg-gradient-to-r truncate",
              getRarityGradient(item.rarity),
            )}>
              {item.name}
            </p>
            <span className={cn("text-[11px] font-bold uppercase tracking-wider", meta.color)}>
              {item.rarity}
            </span>
            {item.kind === "gear" && item.enchantLevel && item.enchantLevel > 0 && (
              <span className="ml-2 text-[10px] bg-violet-800/60 text-violet-200 px-1.5 py-0.5 rounded-full">
                ✨+{item.enchantLevel}
              </span>
            )}
          </div>
        </div>

        {/* ── Body ── */}
        <div className="px-5 py-4 space-y-4">

          {/* Description */}
          <p className="text-gray-300 text-[13px] leading-relaxed">
            {getDescription(item)}
          </p>

          {/* Stats */}
          <StatBlock item={item} />

          {/* Rarity info */}
          <div className="rounded-xl border bg-white/[0.03] p-3 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Star size={12} className={meta.color} />
                <span className={cn("text-[11px] font-bold uppercase tracking-wider", meta.color)}>
                  {meta.label}
                </span>
              </div>
              <span className={cn("text-[11px] font-bold tabular-nums", meta.color)}>
                {getDropRate(item)}
              </span>
            </div>
            <p className="text-[11px] text-gray-500 leading-snug">{meta.detail}</p>
            <DropHint item={item} />
          </div>

          {item.kind === "gear" && item.equipped && (
            <p className="text-[10px] text-yellow-500 font-bold text-center uppercase tracking-widest">
              ✦ Currently Equipped ✦
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Sub-components ───────────────────────────────────────────────────────────

function ItemAvatar({ item }: { item: AnyItemInfo }) {
  const glow = item.rarity in RARITY_META ? undefined : undefined;

  if (item.kind === "gear") {
    const img = ITEM_TYPE_IMAGES[item.type];
    return img ? (
      <div className="w-14 h-14 shrink-0 rounded-xl bg-black/40 flex items-center justify-center border border-white/10">
        <img src={img} alt={item.type} className="w-10 h-10 object-contain drop-shadow-lg" />
      </div>
    ) : (
      <div className="w-14 h-14 shrink-0 rounded-xl bg-black/40 flex items-center justify-center text-2xl border border-white/10">
        {item.emoji ?? "🗡️"}
      </div>
    );
  }

  if (item.kind === "fish") {
    const src = FISH_IMAGE[item.rarity];
    const emoji = FISH_EMOJI_MAP[item.rarity] ?? "🐟";
    return src ? (
      <div className="w-14 h-14 shrink-0 rounded-xl overflow-hidden border border-white/10">
        <img src={src} alt={item.rarity} className="w-full h-full object-cover" />
      </div>
    ) : (
      <div className="w-14 h-14 shrink-0 rounded-xl bg-black/40 flex items-center justify-center text-3xl border border-white/10">
        {emoji}
      </div>
    );
  }

  return (
    <div
      className="w-14 h-14 shrink-0 rounded-xl bg-black/40 flex items-center justify-center text-3xl border border-white/10"
      style={{ textShadow: glow ? `0 0 12px ${glow}` : undefined }}
    >
      {item.emoji}
    </div>
  );
}

function StatBlock({ item }: { item: AnyItemInfo }) {
  if (item.kind === "gear") {
    return (
      <div className="grid grid-cols-2 gap-2">
        <StatPill icon={<Swords size={10} className="text-red-400" />} label={getTypeLabel(item.type)} value={`+${item.statBonus} ${getStatLabel(item.type)}`} color="text-red-300" />
        <StatPill icon={<Coins size={10} className="text-yellow-500" />} label="Value" value={`${formatNumber(item.goldValue)}g`} color="text-yellow-400" />
      </div>
    );
  }
  if (item.kind === "fish") {
    return (
      <div className="grid grid-cols-2 gap-2">
        <StatPill icon={<Fish size={10} className="text-blue-400" />} label="Weight" value={item.weightLabel} color="text-blue-300" />
        <StatPill icon={<Coins size={10} className="text-yellow-500" />} label="Value" value={`${formatNumber(item.goldValue)}g`} color="text-yellow-400" />
      </div>
    );
  }
  if (item.kind === "pet") {
    return (
      <div className="grid grid-cols-2 gap-2">
        {item.atkBonus > 0 && <StatPill icon={<Swords size={10} className="text-red-400" />} label="Attack" value={`+${item.atkBonus}`} color="text-red-300" />}
        {item.defBonus > 0 && <StatPill icon={<Shield size={10} className="text-blue-400" />} label="Defense" value={`+${item.defBonus}`} color="text-blue-300" />}
        {item.hpBonus > 0 && <StatPill icon={<Heart size={10} className="text-green-400" />} label="HP" value={`+${item.hpBonus}`} color="text-green-300" />}
        {item.goldBonus > 0 && <StatPill icon={<Coins size={10} className="text-yellow-500" />} label="Gold%" value={`+${item.goldBonus}%`} color="text-yellow-400" />}
        {item.xpBonus > 0 && <StatPill icon={<Zap size={10} className="text-cyan-400" />} label="XP%" value={`+${item.xpBonus}%`} color="text-cyan-300" />}
      </div>
    );
  }
  if (item.kind === "rod") {
    return (
      <div className="grid grid-cols-2 gap-2">
        <StatPill icon={<Zap size={10} className="text-cyan-400" />} label="Cast Speed" value={`+${item.castSpeedBonus}ms`} color="text-cyan-300" />
        <StatPill icon={<Star size={10} className="text-purple-400" />} label="Fish Luck" value={`+${item.luckBonus}`} color="text-purple-300" />
        <StatPill icon={<Coins size={10} className="text-yellow-500" />} label="Gold Mult." value={`×${item.goldMultiplier}`} color="text-yellow-400" />
        <StatPill icon={<Wand2 size={10} className="text-fuchsia-400" />} label="Type" value="Fishing Rod" color="text-fuchsia-300" />
      </div>
    );
  }
  return null;
}

function StatPill({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  return (
    <div className="flex items-center gap-2 bg-white/[0.04] rounded-lg px-3 py-2 border border-white/[0.06]">
      <span className="shrink-0">{icon}</span>
      <div className="min-w-0">
        <p className="text-[9px] text-gray-600 uppercase tracking-wider leading-none">{label}</p>
        <p className={cn("text-[12px] font-bold leading-snug truncate", color)}>{value}</p>
      </div>
    </div>
  );
}

function DropHint({ item }: { item: AnyItemInfo }) {
  const hints: { kind: AnyItemInfo["kind"]; text: string }[] = [
    { kind: "gear",  text: "Drops from monsters and bosses during battle. Luck upgrades improve odds and rarity." },
    { kind: "fish",  text: "Caught while fishing. Higher fishing level and better rods improve rare fish chances." },
    { kind: "pet",   text: "Drops randomly from any monster during battle. Base 1.5% chance per kill, scaling with luck." },
    { kind: "rod",   text: "Drops from fishing casts at very low rates. Only ~1.5% max chance even at high fishing level." },
  ];
  const hint = hints.find(h => h.kind === item.kind);
  return hint ? (
    <p className="text-[10px] text-gray-600 leading-snug mt-1">{hint.text}</p>
  ) : null;
}

function getDescription(item: AnyItemInfo): string {
  if (item.kind === "gear") return gearDescription(item.rarity);
  if (item.kind === "fish") return fishDescription(item.rarity);
  if (item.kind === "pet")  return item.description;
  if (item.kind === "rod")  return item.description;
  return "";
}
