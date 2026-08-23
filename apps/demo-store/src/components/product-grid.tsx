import Image from "next/image";
import { Check, Sparkles } from "lucide-react";
import { productsData } from "@/data/campaign";

export function ProductGrid() {
  return (
    <section id="products" className="py-20 sm:py-28 bg-[#FAF8F5]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-stone-200/70 text-stone-700 text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Curated Hardware</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-stone-900 tracking-tight">
            Engineered for pure ambiance
          </h2>
          <p className="text-base text-stone-600">
            Choose the ideal Lumora system for single rooms, entire residences,
            or outdoor architecture.
          </p>
        </div>

        {/* Product Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {productsData.map((product) => (
            <div
              key={product.id}
              className={`relative rounded-3xl bg-white border p-6 sm:p-8 flex flex-col justify-between transition-all duration-300 hover:shadow-xl ${
                product.popular
                  ? "border-amber-400 ring-2 ring-amber-400/20 shadow-lg"
                  : "border-stone-200/90 shadow-sm"
              }`}
            >
              {/* Badge */}
              {product.badge && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <span
                    className={`inline-block px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-sm ${
                      product.popular
                        ? "bg-amber-400 text-stone-950"
                        : "bg-stone-900 text-stone-100"
                    }`}
                  >
                    {product.badge}
                  </span>
                </div>
              )}

              {/* Product Top */}
              <div>
                {/* Product Image */}
                <div className="relative aspect-[4/3] rounded-2xl bg-stone-50 overflow-hidden mb-6 border border-stone-100 flex items-center justify-center p-4">
                  <Image
                    src={product.image}
                    alt={product.name}
                    width={400}
                    height={300}
                    className="w-full h-full object-contain"
                  />
                </div>

                {/* Title & Tagline */}
                <h3 className="text-2xl font-serif font-bold text-stone-900 tracking-tight mb-2">
                  {product.name}
                </h3>
                <p className="text-sm text-stone-600 mb-6 min-h-[40px]">
                  {product.tagline}
                </p>

                {/* Price */}
                <div className="flex items-baseline gap-2.5 mb-6 pb-6 border-b border-stone-100">
                  <span className="text-3xl font-serif font-bold text-stone-950">
                    ₹{product.price.toLocaleString()}
                  </span>
                  {product.originalPrice && (
                    <span className="text-base text-stone-400 line-through">
                      ₹{product.originalPrice.toLocaleString()}
                    </span>
                  )}
                </div>

                {/* Features List */}
                <div className="space-y-3 mb-8">
                  <span className="text-xs font-bold uppercase tracking-wider text-stone-400">
                    Included in kit:
                  </span>
                  <ul className="space-y-2.5 text-sm text-stone-700">
                    {product.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2.5">
                        <div className="w-5 h-5 rounded-full bg-amber-100/80 text-amber-800 flex items-center justify-center shrink-0 mt-0.5">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                        <span className="leading-snug">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Action Button */}
              <div>
                <button
                  type="button"
                  className={`w-full py-3.5 px-6 rounded-full text-sm font-semibold transition-all active:scale-[0.98] cursor-pointer ${
                    product.popular
                      ? "bg-stone-900 text-stone-50 hover:bg-stone-800 shadow-sm"
                      : "bg-stone-100 text-stone-800 hover:bg-stone-200"
                  }`}
                >
                  Select {product.name}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
