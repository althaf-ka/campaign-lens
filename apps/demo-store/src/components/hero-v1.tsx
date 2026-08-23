import Image from "next/image";
import { CheckCircle2, ArrowRight } from "lucide-react";
import { campaign } from "@/data/campaign";

export function HeroV1() {
  return (
    <section className="hero relative overflow-hidden py-12 sm:py-20 lg:py-24 border-b border-stone-200/80 bg-gradient-to-b from-[#FAF8F5] via-[#FAF8F5] to-stone-100/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Column: Campaign Copy & Pricing */}
          <div className="lg:col-span-6 space-y-6">
            {/* Eyebrow */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100/90 border border-amber-300/60 text-amber-900 text-xs font-semibold uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-pulse" />
              <span>{campaign.eyebrow}</span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-bold text-stone-900 tracking-tight leading-[1.1]">
              {campaign.headline}
            </h1>

            {/* Offer Callout */}
            <div>
              <p className="text-base sm:text-lg font-semibold text-amber-900 bg-amber-50 border border-amber-200/90 px-4 py-2.5 rounded-xl inline-block shadow-xs">
                {campaign.offer}
              </p>
            </div>

            {/* Subtext description */}
            <p className="text-base text-stone-600 leading-relaxed max-w-lg">
              {campaign.description}
            </p>

            {/* Pricing Box */}
            <div className="flex items-baseline gap-3 pt-2">
              <span className="text-3xl sm:text-4xl font-bold text-stone-950 font-serif tracking-tight">
                ₹{campaign.price.current.toLocaleString()}
              </span>
              {campaign.price.previous && (
                <span className="text-lg text-stone-400 line-through">
                  ₹{campaign.price.previous.toLocaleString()}
                </span>
              )}
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-200">
                SAVE 30%
              </span>
            </div>

            {/* Primary CTA */}
            <div className="pt-2 flex flex-col sm:flex-row gap-4">
              <a
                href={campaign.cta.href}
                className="inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-semibold rounded-full bg-stone-900 text-stone-50 hover:bg-stone-800 hover:shadow-lg transition-all shadow active:scale-[0.98] group"
              >
                <span>{campaign.cta.label}</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </a>
            </div>

            {/* Guarantees List */}
            <div className="pt-6 border-t border-stone-200/80 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-stone-600 font-medium">
              {campaign.guarantees.map((guarantee, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>{guarantee}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Hero Visual Imagery */}
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
    </section>
  );
}
