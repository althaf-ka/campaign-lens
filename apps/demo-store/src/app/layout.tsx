import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Lumora — Smart Home Lighting | Smarter Lighting. Simpler Living.",
  description:
    "Transform your living space with Lumora smart lighting. Save 30% on Starter Kits with 20-minute setup, 30-day returns, and 2-year warranty.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className="min-h-screen bg-[#FAF8F5] text-stone-900 antialiased selection:bg-amber-200 selection:text-stone-900">
        {children}
      </body>
    </html>
  );
}
