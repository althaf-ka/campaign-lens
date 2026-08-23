import { Link } from "@tanstack/react-router";
import { Eye, Shield, Sparkles } from "lucide-react";

export function Navbar() {
  return (
    <nav className="border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-50">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center gap-2.5 text-zinc-100 font-bold tracking-tight">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-400/10 border border-amber-400/30 text-amber-400">
                <Eye className="h-4 w-4" />
              </div>
              <span className="text-lg font-editorial tracking-wide">
                Campaign<span className="text-amber-400">Lens</span>
              </span>
            </Link>

            <span className="hidden md:inline-flex items-center gap-1.5 rounded-full border border-zinc-800 bg-zinc-900 px-2.5 py-0.5 text-[11px] font-mono text-zinc-400">
              <Sparkles className="h-3 w-3 text-amber-400" />
              Real-time Competitor Campaign Intelligence
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-zinc-400 bg-zinc-900/60 border border-zinc-800 px-3 py-1.5 rounded-lg">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Engine Online</span>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
