import Image from "next/image";
import { CheckCircle2, ArrowRight } from "lucide-react";
import { campaign } from "@/data/campaign";

export function HeroV2() {
  return (
    <div className="promo-wrapper relative overflow-hidden py-12 sm:py-20 lg:py-24 border-b border-stone-200/80 bg-gradient-to-b from-[#FAF8F5] via-[#FAF8F5] to-stone-100/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Campaign Details Column */}
          <div className="lg:col-span-6 space-y-6">
            {/* Tag / Eyebrow */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-stone-200/80 border border-stone-300 text-stone-800 text-xs font-semibold uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-stone-900 animate-pulse" />
              <span>{campaign.eyebrow}</span>
            </div>

            {/* Main Headline as styled heading block (not standard hero h1) */}
            <div role="heading" aria-level={1} className="text-4xl sm:text-5xl lg:text-6xl font-serif font-bold text-stone-900 tracking-tight leading-[1.1]">
              {campaign.headline}
            </div>

            {/* Promotional Offer Box (not p.bg-amber-50) */}
            <div className="deal-callout flex">
              <div className="flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-gradient-to-r from-orange-100/90 to-amber-100/70 border border-orange-200/90 text-stone-900 shadow-xs">
                <span className="text-base sm:text-lg font-semibold">
                  {campaign.offer}
                </span>
              </div>
            </div>

            {/* Campaign Summary Description */}
            <div className="text-base text-stone-600 leading-relaxed max-w-lg">
              {campaign.description}
            </div>

            {/* Price Output Display (not .items-baseline span) */}
            <div className="rate-block flex items-center gap-3.5 pt-1">
              <div className="text-3xl sm:text-4xl font-serif font-bold text-stone-950 tracking-tight">
                ₹{campaign.price.current.toLocaleString()}
              </div>
              {campaign.price.previous && (
                <div className="text-lg text-stone-400 line-through">
                  ₹{campaign.price.previous.toLocaleString()}
                </div>
              )}
              <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-stone-900 text-stone-50">
                {campaign.price.qualifier}
              </span>
            </div>

            {/* Primary Action Button (button instead of anchor matching #products / bg-stone-900) */}
            <div className="pt-2 flex flex-col sm:flex-row gap-4">
              <button
                type="button"
                className="action-btn inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-semibold rounded-2xl bg-neutral-950 text-neutral-50 hover:bg-neutral-800 hover:shadow-lg transition-all shadow active:scale-[0.98] group cursor-pointer"
              >
                <span>{campaign.cta.label}</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>

            {/* Customer Assurance List (div list instead of .border-t .grid / div.flex) */}
            <div className="perks-container mt-8 pt-6 border-t border-stone-200 flex flex-wrap gap-x-6 gap-y-2.5 text-xs text-stone-700 font-medium">
              {campaign.guarantees.map((guarantee, idx) => (
                <div key={idx} className="perk-item inline-flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-stone-900 shrink-0" />
                  <span>{guarantee}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Visual Product Showcase */}
          <div className="lg:col-span-6 relative">
            <div className="relative mx-auto max-w-lg lg:max-w-none">
              <div className="relative rounded-3xl p-2 bg-gradient-to-b from-stone-200/40 via-stone-100/20 to-transparent border border-stone-200/60 shadow-xl overflow-hidden">
                <Image
                  src="/products/hero-starter.svg"
                  alt="Lumora Starter Kit Smart Lighting System"
                  width={800}
                  height={600}
                  priority
                  className="w-full h-auto object-contain rounded-2xl"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
