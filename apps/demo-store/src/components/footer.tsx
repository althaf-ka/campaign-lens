import { Sparkles } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-stone-950 text-stone-400 py-16 text-sm border-t border-stone-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
          {/* Brand */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-stone-800 flex items-center justify-center text-amber-300">
                <Sparkles className="w-3.5 h-3.5 fill-amber-300" />
              </div>
              <span className="text-lg font-bold tracking-widest text-white font-editorial">
                LUMORA
              </span>
            </div>
            <p className="text-xs text-stone-500 max-w-sm">
              Smarter lighting. Simpler living. Premium adaptive lighting
              systems for modern homes.
            </p>
          </div>

          {/* Quick links */}
          <nav className="flex flex-wrap gap-x-8 gap-y-2 text-stone-400">
            <a href="#products" className="hover:text-white transition-colors">
              Products
            </a>
            <a href="#products" className="hover:text-white transition-colors">
              Bundles
            </a>
            <a href="#benefits" className="hover:text-white transition-colors">
              Support
            </a>
            <a href="#benefits" className="hover:text-white transition-colors">
              Shipping
            </a>
            <a href="#benefits" className="hover:text-white transition-colors">
              Returns
            </a>
          </nav>
        </div>

        {/* Demo Disclosure Badge & Copyright */}
        <div className="pt-8 border-t border-stone-800/80 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs">
          <p className="text-stone-500">© 2026 Lumora. All rights reserved.</p>

          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-stone-900 border border-stone-800 text-stone-400 font-mono text-[11px]">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span>
              Demo storefront for CampaignLens · Fictional demonstration
              storefront
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
