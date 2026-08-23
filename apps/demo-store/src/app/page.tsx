import { AnnouncementBar } from "@/components/announcement-bar";
import { Navbar } from "@/components/navbar";
import { HeroV1 } from "@/components/hero-v1";
import { ProductGrid } from "@/components/product-grid";
import { Benefits } from "@/components/benefits";
import { Reviews } from "@/components/reviews";
import { Footer } from "@/components/footer";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#FAF8F5]">
      {/* 1. Announcement Bar */}
      <AnnouncementBar />

      {/* 2. Navbar */}
      <Navbar />

      <main className="flex-grow">
        {/* 3. Hero / Main Campaign (V1) */}
        <HeroV1 />

        {/* 4. Product / Bundle Cards */}
        <ProductGrid />

        {/* 5. Benefits / Guarantees */}
        <Benefits />

        {/* 6. Reviews / Social Proof */}
        <Reviews />
      </main>

      {/* 7. Footer */}
      <Footer />
    </div>
  );
}
