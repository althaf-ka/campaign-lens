import { Star, ShieldCheck } from "lucide-react";
import { reviewsData } from "@/data/campaign";

export function Reviews() {
  return (
    <section
      id="reviews"
      className="py-20 sm:py-28 bg-[#FAF8F5] border-b border-stone-200/80"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Rating Summary Header */}
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
          <div className="flex items-center justify-center gap-1.5 text-amber-500">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />
            ))}
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-stone-900 tracking-tight">
            {reviewsData.rating} / 5
          </h2>
          <p className="text-sm font-medium text-stone-600">
            Based on {reviewsData.totalCount.toLocaleString()} verified
            purchases
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {reviewsData.reviews.map((review, idx) => (
            <div
              key={idx}
              className="bg-white rounded-3xl p-8 border border-stone-200/90 shadow-sm flex flex-col justify-between space-y-6"
            >
              <div className="space-y-4">
                <div className="flex gap-1 text-amber-400">
                  {[...Array(review.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400" />
                  ))}
                </div>
                <p className="text-lg font-serif text-stone-800 leading-snug italic">
                  &ldquo;{review.quote}&rdquo;
                </p>
              </div>

              <div className="flex items-center gap-2 pt-4 border-t border-stone-100 text-xs text-stone-500">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span className="font-semibold text-stone-700">
                  {review.authorTag}
                </span>
                <span>·</span>
                <span>{review.location}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
