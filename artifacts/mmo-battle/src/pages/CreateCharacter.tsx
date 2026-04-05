import { useState } from "react";
import { useCreateCharacter } from "@/hooks/use-player";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export default function CreateCharacter() {
  const [name, setName] = useState("");
  const { mutate: createPlayer, isPending } = useCreateCharacter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    createPlayer({ name });
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4">
      {/* Background Image injected via CSS class or inline style */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-40 mix-blend-luminosity"
        style={{ backgroundImage: `url(${import.meta.env.BASE_URL}images/hero-bg.png)` }}
      />
      <div className="absolute inset-0 z-0 bg-gradient-to-t from-background via-background/80 to-transparent" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="bg-glass border-gold rounded-2xl p-8 md:p-10 shadow-2xl text-center">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="mb-8 flex justify-center"
          >
            <img 
              src={`${import.meta.env.BASE_URL}images/logo-mark.png`} 
              alt="Game Logo" 
              className="w-32 h-32 object-contain drop-shadow-[0_0_20px_rgba(212,175,55,0.5)]"
            />
          </motion.div>
          
          <h1 className="font-display text-4xl tracking-[0.12em] uppercase text-yellow-400 mb-1 leading-tight">
            A New Hero<br />Awakens
          </h1>
          <p className="text-xs tracking-[0.25em] uppercase text-yellow-600/70 font-sans mb-1">
            Dungeons · Raids · Infinite Power
          </p>
          <p className="text-gray-400 font-sans text-sm mb-8 mt-3 leading-relaxed">
            Name your warrior. Forge your legend.<br />
            The realm has been waiting.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={20}
                placeholder="Your name, warrior…"
                className="w-full bg-black/50 border-2 border-yellow-900/50 rounded-xl px-4 py-4 text-center text-xl font-display text-yellow-400 placeholder:text-yellow-900/60 focus:outline-none focus:border-yellow-500 focus:ring-4 focus:ring-yellow-500/20 transition-all"
                autoFocus
              />
            </div>

            <Button 
              type="submit" 
              className="w-full text-lg h-14 tracking-widest uppercase font-display" 
              disabled={isPending || !name.trim()}
            >
              {isPending ? "Forging Destiny…" : "Enter The Realm"}
            </Button>

            <p className="text-gray-600 text-[10px] tracking-widest uppercase font-sans pt-1">
              Your journey begins with a name
            </p>

            <a
              href="https://discord.gg/2J8djzzav6"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 flex items-center justify-center gap-2 rounded-xl border border-indigo-700/40 bg-indigo-950/30 py-2.5 px-4 text-indigo-300 hover:bg-indigo-950/60 hover:text-indigo-100 hover:border-indigo-600/60 transition-all"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057c.002.022.015.043.031.052a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
              </svg>
              <span className="font-bold text-xs tracking-wide">Join our Discord</span>
            </a>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
