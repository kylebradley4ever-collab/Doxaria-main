import { Switch, Route, Router as WouterRouter, Link, useLocation } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { usePlayer } from "@/hooks/use-player";
import { Sword, PackageOpen, Shield, Flame, ArrowUp, Waves, Scroll, LayoutGrid } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

import CreateCharacter from "@/pages/CreateCharacter";
import Battle from "@/pages/Battle";
import Inventory from "@/pages/Inventory";
import Equipment from "@/pages/Equipment";
import Skills from "@/pages/Skills";
import Raids from "@/pages/Raids";
import Upgrades from "@/pages/Upgrades";
import Fishing from "@/pages/Fishing";
import Quests from "@/pages/Quests";
import Talents from "@/pages/Talents";
import Pets from "@/pages/Pets";
import WorldMap from "@/pages/WorldMap";
import Codex from "@/pages/Codex";
import Alchemy from "@/pages/Alchemy";
import Arena from "@/pages/Arena";
import Leaderboard from "@/pages/Leaderboard";
import Challenge from "@/pages/Challenge";
import Hub from "@/pages/Hub";
import Stats from "@/pages/Stats";
import Tower from "@/pages/Tower";
import NotFound from "@/pages/not-found";
import { PlayerBar } from "@/components/PlayerBar";

const queryClient = new QueryClient();

const NAV_LINKS = [
  { href: "/",          label: "Battle",    Icon: Sword       },
  { href: "/equipment", label: "Gear",      Icon: Shield      },
  { href: "/raids",     label: "Raids",     Icon: Flame       },
  { href: "/fishing",   label: "Fishing",   Icon: Waves       },
  { href: "/quests",    label: "Quests",    Icon: Scroll      },
  { href: "/inventory", label: "Items",     Icon: PackageOpen },
  { href: "/upgrades",  label: "Upgrades",  Icon: ArrowUp     },
  { href: "/hub",       label: "Hub",       Icon: LayoutGrid  },
] as const;

function BottomNav() {
  const [location] = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-yellow-900/20 bg-black/95 backdrop-blur-xl safe-area-inset-bottom">
      <div className="flex max-w-2xl mx-auto overflow-x-auto scrollbar-none">
        {NAV_LINKS.map(({ href, label, Icon }) => {
          const active = location === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex-1 min-w-[56px] relative flex flex-col items-center py-2.5 gap-1 select-none transition-colors duration-200",
                active ? "text-yellow-400" : "text-gray-400 hover:text-gray-200"
              )}
            >
              <AnimatePresence>
                {active && (
                  <motion.span
                    layoutId="nav-indicator"
                    className="absolute top-0 left-1/2 -translate-x-1/2 h-0.5 w-8 bg-gradient-to-r from-yellow-600 via-yellow-400 to-yellow-600 rounded-full"
                    initial={{ opacity: 0, scaleX: 0.5 }}
                    animate={{ opacity: 1, scaleX: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
              </AnimatePresence>

              <motion.div
                animate={{ scale: active ? 1 : 0.9, y: active ? -1 : 0 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
              >
                <Icon size={18} strokeWidth={active ? 2.2 : 1.5} />
              </motion.div>

              <span className={cn(
                "text-[10px] uppercase tracking-widest font-bold transition-colors duration-200",
                active ? "text-yellow-400" : "text-gray-400"
              )}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

function GameLayout() {
  const { data: player, isLoading, error } = usePlayer();
  const [location] = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <img
            src={`${import.meta.env.BASE_URL}images/logo-mark.png`}
            alt="Loading"
            className="w-20 h-20 opacity-40 animate-pulse"
          />
          <p className="text-yellow-500/80 font-display text-xs tracking-widest uppercase">
            Loading Realm…
          </p>
        </div>
      </div>
    );
  }

  if (error || !player) {
    return <CreateCharacter />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <PlayerBar />
      <main className="flex-1 flex flex-col relative z-10 pb-16 overflow-x-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={location}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18, ease: "easeInOut" }}
            className="flex-1 flex flex-col"
          >
            <Switch>
              <Route path="/"            component={Battle}      />
              <Route path="/equipment"   component={Equipment}   />
              <Route path="/skills"      component={Skills}      />
              <Route path="/raids"       component={Raids}       />
              <Route path="/inventory"   component={Inventory}   />
              <Route path="/fishing"     component={Fishing}     />
              <Route path="/quests"      component={Quests}      />
              <Route path="/upgrades"    component={Upgrades}    />
              <Route path="/hub"         component={Hub}         />
              <Route path="/talents"     component={Talents}     />
              <Route path="/pets"        component={Pets}        />
              <Route path="/map"         component={WorldMap}    />
              <Route path="/codex"       component={Codex}       />
              <Route path="/alchemy"     component={Alchemy}     />
              <Route path="/arena"       component={Arena}       />
              <Route path="/leaderboard" component={Leaderboard} />
              <Route path="/challenge"   component={Challenge}   />
              <Route path="/stats"       component={Stats}       />
              <Route path="/tower"       component={Tower}       />
              <Route                     component={NotFound}    />
            </Switch>
          </motion.div>
        </AnimatePresence>
      </main>
      <BottomNav />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter hook={useHashLocation}>
          <GameLayout />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
