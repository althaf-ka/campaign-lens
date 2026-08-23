import { Clock, ShieldCheck, RefreshCw, Headphones } from "lucide-react";
import { benefitsData } from "@/data/campaign";

const iconMap = {
  clock: Clock,
  shield: ShieldCheck,
  "refresh-cw": RefreshCw,
  headphones: Headphones,
};

export function Benefits() {
  return (
    <section
      id="benefits"
      className="py-20 sm:py-28 bg-stone-900 text-stone-100 relative overflow-hidden"
    >
      {/* Subtle background ambiance glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-amber-500/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
          <span className="inline-block px-3 py-1 rounded-full bg-amber-400/10 text-amber-300 text-xs font-semibold uppercase tracking-wider border border-amber-400/20">
            The Lumora Standard
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-white tracking-tight">
            Why Lumora?
          </h2>
          <p className="text-base text-stone-400">
            Smart lighting designed for people, not tech specialists. Built to
            last with zero setup anxiety.
          </p>
        </div>

        {/* Benefits Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {benefitsData.map((benefit, idx) => {
            const Icon = iconMap[benefit.iconName];
            return (
              <div
                key={idx}
                className="rounded-2xl p-6 bg-stone-800/60 border border-stone-700/60 hover:border-amber-400/40 transition-colors space-y-4"
              >
                <div className="w-12 h-12 rounded-xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center text-amber-300">
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-semibold text-white tracking-tight">
                  {benefit.title}
                </h3>
                <p className="text-sm text-stone-400 leading-relaxed">
                  {benefit.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
