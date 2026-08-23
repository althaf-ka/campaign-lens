import { ShoppingBag, Sparkles } from "lucide-react";

export function Navbar() {
  return (
    <header className="sticky top-0 z-40 bg-[#FAF8F5]/90 backdrop-blur-md border-b border-stone-200/80 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
        {/* Brand Logo */}
        <a href="#" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-full bg-stone-900 flex items-center justify-center text-amber-300 shadow-sm group-hover:scale-105 transition-transform">
            <Sparkles className="w-4 h-4 fill-amber-300" />
          </div>
          <span className="text-xl font-bold tracking-widest text-stone-900 font-editorial">
            LUMORA
          </span>
        </a>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-stone-600">
          <a
            href="#products"
            className="hover:text-stone-950 transition-colors"
          >
            Shop
          </a>
          <a
            href="#products"
            className="hover:text-stone-950 transition-colors"
          >
            Bundles
          </a>
          <a
            href="#benefits"
            className="hover:text-stone-950 transition-colors"
          >
            Why Lumora
          </a>
          <a href="#reviews" className="hover:text-stone-950 transition-colors">
            Reviews
          </a>
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-4">
          <button
            type="button"
            className="p-2 text-stone-700 hover:text-stone-950 transition-colors relative"
            aria-label="Shopping Cart"
          >
            <ShoppingBag className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-amber-500" />
          </button>

          <a
            href="#products"
            className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-full bg-stone-900 text-stone-50 hover:bg-stone-800 transition-all shadow-sm hover:shadow active:scale-[0.98]"
          >
            Shop now
          </a>
        </div>
      </div>
    </header>
  );
}
