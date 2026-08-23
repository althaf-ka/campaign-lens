export const campaign = {
  eyebrow: "Summer Home Upgrade",

  headline: "Smarter lighting. Simpler living.",

  description: "Everything you need to upgrade your room in under 20 minutes.",

  offer: "Save 30% on the Lumora Starter Kit",

  price: {
    current: 1999,
    previous: 2899,
    currency: "INR",
    qualifier: "Starter Kit",
  },

  cta: {
    label: "Get the Starter Kit",
    href: "#products",
  },

  guarantees: [
    "Free installation support",
    "30-day returns",
    "2-year warranty",
  ],
} as const;

export type Campaign = typeof campaign;

export interface ProductItem {
  id: string;
  name: string;
  tagline: string;
  price: number;
  originalPrice?: number;
  badge?: string;
  features: string[];
  image: string;
  popular?: boolean;
}

export interface BenefitItem {
  title: string;
  description: string;
  iconName: "clock" | "shield" | "refresh-cw" | "headphones";
}

export interface ReviewItem {
  quote: string;
  rating: number;
  authorTag: string;
  location: string;
}

export const announcementData = {
  text: "SUMMER SALE · Save 30% on Starter Kits · Free shipping over ₹1,499",
  badge: "LIMITED OFFER",
} as const;

export const productsData: ProductItem[] = [
  {
    id: "starter-kit",
    name: "Starter Kit",
    tagline: "Everything you need to upgrade your room in under 20 minutes.",
    price: 1999,
    originalPrice: 2899,
    badge: "Most Popular",
    popular: true,
    features: [
      "2 smart bulbs (16M colors & tunable white)",
      "1 wireless magnetic smart controller",
      "Step-by-step installation guide",
    ],
    image: "/products/starter-kit.svg",
  },
  {
    id: "pro-kit",
    name: "Pro Kit",
    tagline: "Multi-room ambient lighting control with automation hub.",
    price: 3499,
    originalPrice: 4999,
    badge: "Best Value",
    popular: false,
    features: [
      "4 smart bulbs with circadian rhythm sync",
      "2 wireless controllers & scene switchers",
      "Automation smart hub (Matter & Thread)",
    ],
    image: "/products/pro-kit.svg",
  },
  {
    id: "outdoor-kit",
    name: "Outdoor Kit",
    tagline: "Weatherproof architectural lights built for gardens & patios.",
    price: 2799,
    originalPrice: 3599,
    badge: "All-Weather",
    popular: false,
    features: [
      "IP67 weatherproof spotlight & pathway fixtures",
      "Smart scheduling & solar sunset sync",
      "Remote control via mobile app",
    ],
    image: "/products/outdoor-kit.svg",
  },
];

export const benefitsData: BenefitItem[] = [
  {
    title: "20-minute setup",
    description:
      "No electrician required. Simply plug in, connect, and enjoy instant smart lighting.",
    iconName: "clock",
  },
  {
    title: "2-year warranty",
    description:
      "Every Lumora light is covered with full replacement assurance.",
    iconName: "shield",
  },
  {
    title: "30-day returns",
    description:
      "Try it in your home. Love it or return it for a complete, hassle-free refund.",
    iconName: "refresh-cw",
  },
  {
    title: "Free setup support",
    description:
      "Our dedicated lighting team helps you get started with zero friction.",
    iconName: "headphones",
  },
];

export const reviewsData = {
  rating: 4.8,
  totalCount: 1240,
  reviews: [
    {
      quote: "The setup was easier than I expected.",
      rating: 5,
      authorTag: "Verified Buyer",
      location: "Bengaluru",
    },
    {
      quote: "Our entire living room was done in about 15 minutes.",
      rating: 5,
      authorTag: "Verified Buyer",
      location: "Mumbai",
    },
    {
      quote: "The automation schedules are the feature we use most.",
      rating: 5,
      authorTag: "Verified Buyer",
      location: "Kerala",
    },
  ] as ReviewItem[],
};
