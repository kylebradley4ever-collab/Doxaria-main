export function getRarityGradient(rarity: string): string {
  switch (rarity) {
    case 'Common':       return 'from-gray-400 to-gray-500';
    case 'Uncommon':     return 'from-green-400 to-green-600';
    case 'Rare':         return 'from-blue-400 to-blue-600';
    case 'Epic':         return 'from-purple-400 to-purple-600';
    case 'Legendary':    return 'from-yellow-400 to-orange-500';
    case 'Mythic':       return 'from-red-500 via-orange-500 to-yellow-500';
    case 'Divine':       return 'from-yellow-200 via-white to-amber-300';
    case 'Abyssal':      return 'from-cyan-400 via-blue-500 to-indigo-600';
    case 'Transcendent': return 'from-pink-400 via-violet-400 to-cyan-400';
    case 'Cosmic':       return 'from-sky-200 via-blue-300 to-cyan-400';
    case 'Eternal':      return 'from-rose-300 via-pink-400 to-rose-500';
    case 'Primordial':    return 'from-white via-zinc-200 to-slate-300';
    case 'Omnipotent':    return 'from-amber-100 via-yellow-300 to-orange-300';
    case 'Sovereign':     return 'from-rose-200 via-fuchsia-300 to-violet-400';
    case 'Genesis':       return 'from-emerald-200 via-teal-300 to-cyan-400';
    case 'The Absolute':  return 'from-white via-white to-white';
    default:              return 'from-gray-400 to-gray-500';
  }
}

export function getRarityGlow(rarity: string): string {
  switch (rarity) {
    case 'Legendary':    return 'shadow-[0_0_16px_rgba(234,179,8,0.4)]';
    case 'Mythic':       return 'shadow-[0_0_20px_rgba(239,68,68,0.5)]';
    case 'Divine':       return 'shadow-[0_0_24px_rgba(255,255,200,0.6)]';
    case 'Abyssal':      return 'shadow-[0_0_24px_rgba(34,211,238,0.5)]';
    case 'Transcendent': return 'shadow-[0_0_30px_rgba(192,132,252,0.7)]';
    case 'Cosmic':       return 'shadow-[0_0_36px_rgba(125,211,252,0.8)]';
    case 'Eternal':      return 'shadow-[0_0_40px_rgba(253,164,175,0.9)]';
    case 'Primordial':   return 'shadow-[0_0_50px_rgba(255,255,255,1.0)]';
    case 'Omnipotent':   return 'shadow-[0_0_60px_rgba(255,210,80,1.0)]';
    case 'Sovereign':    return 'shadow-[0_0_70px_rgba(232,121,249,1.0)]';
    case 'Genesis':      return 'shadow-[0_0_80px_rgba(52,211,153,1.0)]';
    case 'The Absolute': return 'shadow-[0_0_100px_rgba(255,255,255,1.0)]';
    default:             return '';
  }
}
