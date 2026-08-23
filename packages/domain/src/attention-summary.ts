export interface PriceChangeMetric {
  title: string;
  diffFormatted: string;
  percentFormatted: string;
  isIncrease: boolean;
  summary: string;
}

export function formatPriceChangeSummary(
  beforeAmount: number | null | undefined,
  afterAmount: number | null | undefined,
  currency = "INR",
): PriceChangeMetric {
  const symbol = currency === "INR" ? "₹" : `${currency} `;

  if (beforeAmount === null || beforeAmount === undefined || beforeAmount === 0) {
    const afterNum = afterAmount ?? 0;
    return {
      title: `Price updated to ${symbol}${afterNum.toLocaleString("en-IN")}`,
      diffFormatted: `${symbol}${afterNum.toLocaleString("en-IN")}`,
      percentFormatted: "New",
      isIncrease: true,
      summary: `Price updated to ${symbol}${afterNum.toLocaleString("en-IN")}`,
    };
  }

  if (afterAmount === null || afterAmount === undefined) {
    return {
      title: "Price unlisted",
      diffFormatted: "Removed",
      percentFormatted: "N/A",
      isIncrease: false,
      summary: "Price unlisted or not detected",
    };
  }

  const diff = afterAmount - beforeAmount;
  const isIncrease = diff >= 0;
  const percent = ((diff / beforeAmount) * 100).toFixed(1);

  const diffFormatted = isIncrease
    ? `+${symbol}${diff.toLocaleString("en-IN")}`
    : `-${symbol}${Math.abs(diff).toLocaleString("en-IN")}`;

  const percentFormatted = isIncrease ? `+${percent}%` : `${percent}%`;

  const title = isIncrease
    ? `Price increased by ${symbol}${diff.toLocaleString("en-IN")}`
    : `Price decreased by ${symbol}${Math.abs(diff).toLocaleString("en-IN")}`;

  const summary = `${title} (${symbol}${beforeAmount.toLocaleString("en-IN")} → ${symbol}${afterAmount.toLocaleString("en-IN")} · ${percentFormatted})`;

  return {
    title,
    diffFormatted,
    percentFormatted,
    isIncrease,
    summary,
  };
}

export function formatOfferChangeSummary(
  beforeOffer: string | null | undefined,
  afterOffer: string | null | undefined,
): string {
  if (!beforeOffer && afterOffer) {
    return `New promotion launched: "${afterOffer}"`;
  }
  if (beforeOffer && !afterOffer) {
    return "Promotional offer ended";
  }
  return `Promotion updated: "${afterOffer ?? "None"}"`;
}

export function formatHeadlineChangeSummary(
  beforeHeadline: string | null | undefined,
  afterHeadline: string | null | undefined,
): string {
  return `Positioning updated: "${afterHeadline ?? "None"}"`;
}

export function formatCtaChangeSummary(
  beforeCta: string | null | undefined,
  afterCta: string | null | undefined,
): string {
  return `Primary call-to-action updated: "${afterCta ?? "None"}"`;
}
