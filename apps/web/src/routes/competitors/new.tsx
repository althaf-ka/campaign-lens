import { useState } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@campaign-lens/ui/components/card";
import { Input } from "@campaign-lens/ui/components/input";
import { Button } from "@campaign-lens/ui/components/button";
import { Badge } from "@campaign-lens/ui/components/badge";
import {
  Alert,
  AlertTitle,
  AlertDescription,
} from "@campaign-lens/ui/components/alert";
import { Separator } from "@campaign-lens/ui/components/separator";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@campaign-lens/ui/components/select";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowLeft01Icon,
  AlertCircleIcon,
  RefreshIcon,
  CheckmarkCircle01Icon,
  PlayIcon,
  Alert02Icon,
} from "@hugeicons/core-free-icons";
import {
  createCompetitor,
  testScraperConnection,
  type TestConnectionResponse,
} from "../../features/competitors/api/competitor.queries.ts";

const SOURCE_TYPE_ITEMS = [
  { label: "Homepage Campaign", value: "homepage" },
  { label: "Pricing Page", value: "pricing" },
];

const INTERVAL_ITEMS = [
  { label: "Every 15 minutes", value: 15 },
  { label: "Every 30 minutes", value: 30 },
  { label: "Every hour", value: 60 },
  { label: "Every 6 hours", value: 360 },
  { label: "Daily", value: 1440 },
];

export const Route = createFileRoute("/competitors/new")({
  component: TrackCompetitorPage,
});

function TrackCompetitorPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [name, setName] = useState("");
  const [domain, setDomain] = useState("");
  const [sourceName, setSourceName] = useState("Homepage Campaign");
  const [sourceUrl, setSourceUrl] = useState("");
  const [sourceType, setSourceType] = useState<"homepage" | "pricing">(
    "homepage",
  );
  const [collectorId, setCollectorId] = useState("");
  const [intervalMinutes, setIntervalMinutes] = useState(60);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Test Scraper Connection state
  const [testStatus, setTestStatus] = useState<
    "idle" | "testing" | "compatible" | "incompatible"
  >("idle");
  const [testResult, setTestResult] = useState<TestConnectionResponse | null>(
    null,
  );
  const [testError, setTestError] = useState<string | null>(null);

  const handleUrlChange = (val: string) => {
    setSourceUrl(val);
    setTestStatus("idle");
    setTestResult(null);
  };

  const handleCollectorIdChange = (val: string) => {
    setCollectorId(val);
    setTestStatus("idle");
    setTestResult(null);
  };

  const handleSourceTypeChange = (val: "homepage" | "pricing") => {
    setSourceType(val);
    setTestStatus("idle");
    setTestResult(null);
  };

  const handleTestConnection = async () => {
    if (!sourceUrl.trim()) {
      setErrorMessage("Please enter a public URL to test.");
      return;
    }
    if (!collectorId.trim() || !collectorId.startsWith("c_")) {
      setErrorMessage(
        "Collector ID must start with 'c_' (e.g. c_mt5kun512itlsaiw1s).",
      );
      return;
    }

    setTestStatus("testing");
    setTestError(null);
    setErrorMessage(null);

    try {
      const res = await testScraperConnection({
        url: sourceUrl.trim(),
        collectorId: collectorId.trim(),
        sourceType,
      });

      setTestResult(res);
      setTestStatus(res.status);
    } catch (err) {
      setTestStatus("incompatible");
      setTestError(
        err instanceof Error ? err.message : "Connection test failed.",
      );
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!name.trim()) {
      setErrorMessage("Competitor name is required.");
      return;
    }
    if (!domain.trim()) {
      setErrorMessage("Competitor website domain is required.");
      return;
    }
    if (!sourceUrl.trim()) {
      setErrorMessage("Public URL to monitor is required.");
      return;
    }
    if (!collectorId.trim() || !collectorId.startsWith("c_")) {
      setErrorMessage(
        "Collector ID must start with 'c_' (e.g. c_mt5kun512itlsaiw1s).",
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await createCompetitor({
        name: name.trim(),
        domain: domain.trim(),
        source: {
          name: sourceName.trim() || "Homepage Campaign",
          url: sourceUrl.trim(),
          type: sourceType,
          collectorId: collectorId.trim(),
          intervalMinutes,
        },
      });

      // Invalidate competitors and attention queries
      await queryClient.invalidateQueries({ queryKey: ["competitors"] });
      await queryClient.invalidateQueries({ queryKey: ["attention"] });

      // Navigate to competitor detail page
      navigate({
        to: "/competitors/$competitorId",
        params: { competitorId: result.competitor.id },
      });
    } catch (err) {
      console.error("Failed to onboard competitor:", err);
      setErrorMessage(
        err instanceof Error
          ? err.message
          : "An unexpected error occurred while onboarding competitor.",
      );
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-12">
      {/* Header & Back link */}
      <div className="space-y-2">
        <Button
          variant="ghost"
          size="sm"
          render={<Link to="/competitors" />}
          className="gap-1.5 text-xs text-muted-foreground hover:text-foreground pl-0"
        >
          <HugeiconsIcon
            icon={ArrowLeft01Icon}
            strokeWidth={2}
            className="size-3.5"
          />
          <span>Back to Competitors</span>
        </Button>

        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Track competitor
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Connect a public competitor page to a Bright Data Scraper Studio
            collector.
          </p>
        </div>
      </div>

      <Separator />

      {errorMessage && (
        <Alert variant="destructive" aria-live="polite">
          <HugeiconsIcon
            icon={AlertCircleIcon}
            strokeWidth={2}
            className="size-4"
          />
          <AlertTitle>Onboarding Error</AlertTitle>
          <AlertDescription className="mt-1 text-xs">
            {errorMessage}
          </AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <Card className="bg-card">
          <CardHeader className="p-6 pb-4">
            <CardTitle className="text-base font-semibold text-foreground">
              Competitor details
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Define the target competitor and its monitoring source.
            </CardDescription>
          </CardHeader>

          <CardContent className="p-6 pt-0 space-y-6">
            {/* Section 1: Competitor Information */}
            <div className="space-y-4">
              <div className="text-xs font-semibold text-foreground uppercase tracking-wider">
                Competitor Information
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="competitor-name"
                  className="text-xs font-medium text-foreground"
                >
                  Competitor Name <span className="text-destructive">*</span>
                </label>
                <Input
                  id="competitor-name"
                  name="competitor-name"
                  autoComplete="organization"
                  placeholder="Lumora Lighting…"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isSubmitting}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="competitor-domain"
                  className="text-xs font-medium text-foreground"
                >
                  Website / Domain <span className="text-destructive">*</span>
                </label>
                <Input
                  id="competitor-domain"
                  name="competitor-domain"
                  inputMode="url"
                  autoComplete="url"
                  placeholder="lumora.example…"
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  disabled={isSubmitting}
                  required
                />
              </div>
            </div>

            <Separator />

            {/* Section 2: Monitoring Source */}
            <div className="space-y-4">
              <div className="text-xs font-semibold text-foreground uppercase tracking-wider">
                Monitoring Source
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="source-name"
                  className="text-xs font-medium text-foreground"
                >
                  Source Label
                </label>
                <Input
                  id="source-name"
                  name="source-name"
                  autoComplete="off"
                  placeholder="Homepage campaign…"
                  value={sourceName}
                  onChange={(e) => setSourceName(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="source-url"
                  className="text-xs font-medium text-foreground"
                >
                  Public URL <span className="text-destructive">*</span>
                </label>
                <Input
                  id="source-url"
                  name="source-url"
                  type="url"
                  autoComplete="url"
                  placeholder="https://lumora.example/…"
                  value={sourceUrl}
                  onChange={(e) => handleUrlChange(e.target.value)}
                  disabled={isSubmitting}
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label
                    htmlFor="source-type"
                    className="text-xs font-medium text-foreground"
                  >
                    Source Type
                  </label>
                  <Select
                    items={SOURCE_TYPE_ITEMS}
                    value={sourceType}
                    onValueChange={(val) => {
                      if (val)
                        handleSourceTypeChange(val as "homepage" | "pricing");
                    }}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger id="source-type" aria-label="Source type">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {SOURCE_TYPE_ITEMS.map((item) => (
                          <SelectItem key={item.value} value={item.value}>
                            {item.label}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="monitoring-interval"
                    className="text-xs font-medium text-foreground"
                  >
                    Monitoring Interval
                  </label>
                  <Select
                    items={INTERVAL_ITEMS}
                    value={intervalMinutes}
                    onValueChange={(val) => {
                      if (val !== null && val !== undefined)
                        setIntervalMinutes(Number(val));
                    }}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger
                      id="monitoring-interval"
                      aria-label="Monitoring interval"
                    >
                      <SelectValue placeholder="Select interval" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {INTERVAL_ITEMS.map((item) => (
                          <SelectItem key={item.value} value={item.value}>
                            {item.label}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <div className="space-y-1.5">
                  <label
                    htmlFor="collector-id"
                    className="text-xs font-medium text-foreground"
                  >
                    Scraper Studio Collector ID{" "}
                    <span className="text-destructive">*</span>
                  </label>
                  <div className="flex gap-2">
                    <Input
                      id="collector-id"
                      name="collector-id"
                      autoComplete="off"
                      spellCheck={false}
                      placeholder="c_mt5kun512itlsaiw1s…"
                      value={collectorId}
                      onChange={(e) => handleCollectorIdChange(e.target.value)}
                      disabled={isSubmitting}
                      className="font-mono flex-1"
                      required
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleTestConnection}
                      disabled={
                        isSubmitting ||
                        testStatus === "testing" ||
                        !collectorId.trim() ||
                        !sourceUrl.trim()
                      }
                      className="gap-1.5 text-xs shrink-0 cursor-pointer h-9 px-3"
                    >
                      {testStatus === "testing" ? (
                        <>
                          <HugeiconsIcon
                            icon={RefreshIcon}
                            strokeWidth={2}
                            className="size-3.5 animate-spin"
                          />
                          <span aria-live="polite">Testing collector…</span>
                        </>
                      ) : (
                        <>
                          <HugeiconsIcon
                            icon={PlayIcon}
                            strokeWidth={2}
                            className="size-3 text-primary"
                          />
                          <span>Test connection</span>
                        </>
                      )}
                    </Button>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Use the Collector ID from your custom Bright Data Scraper
                    Studio scraper.
                  </p>
                </div>

                {/* Test Connection Results Card */}
                {testStatus === "compatible" && testResult?.preview && (
                  <div className="p-3.5 border border-emerald-500/30 bg-emerald-500/5 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-semibold">
                        <HugeiconsIcon
                          icon={CheckmarkCircle01Icon}
                          strokeWidth={2}
                          className="size-4"
                        />
                        <span>Collector connected</span>
                      </div>
                      <Badge
                        variant="outline"
                        className="border-emerald-500/30 text-emerald-400 text-[10px] font-mono"
                      >
                        Valid Schema & Integrity
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                      <div className="flex items-center gap-1 text-foreground">
                        <span className="text-emerald-500">✓</span> Headline
                      </div>
                      <div className="flex items-center gap-1 text-foreground">
                        <span className="text-emerald-500">✓</span> Offer
                      </div>
                      <div className="flex items-center gap-1 text-foreground">
                        <span className="text-emerald-500">✓</span> Price
                      </div>
                      <div className="flex items-center gap-1 text-foreground">
                        <span className="text-emerald-500">✓</span> CTA
                      </div>
                    </div>

                    <div className="pt-2 border-t border-emerald-500/20 text-xs space-y-0.5">
                      <div className="font-bold text-foreground">
                        ₹
                        {testResult.preview.pricing.amount?.toLocaleString(
                          "en-IN",
                        ) ?? "N/A"}
                      </div>
                      <div className="text-muted-foreground truncate">
                        {testResult.preview.offer ??
                          testResult.preview.headline}
                      </div>
                    </div>
                  </div>
                )}

                {testStatus === "incompatible" && (
                  <div className="p-3.5 border border-amber-500/30 bg-amber-500/5 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-amber-400 text-xs font-semibold">
                        <HugeiconsIcon
                          icon={Alert02Icon}
                          strokeWidth={2}
                          className="size-4"
                        />
                        <span>Connection needs attention</span>
                      </div>
                      <Badge
                        variant="outline"
                        className="border-amber-500/30 text-amber-400 text-[10px] font-mono"
                      >
                        Schema / Integrity Gap
                      </Badge>
                    </div>

                    <p className="text-xs text-muted-foreground">
                      {testResult?.message ||
                        testError ||
                        "Scraper output is missing required fields."}
                    </p>

                    {testResult?.missing && testResult.missing.length > 0 && (
                      <div className="space-y-1 text-xs text-amber-400">
                        {testResult.missing.map((m) => (
                          <div key={m} className="flex items-center gap-1">
                            <span>•</span>
                            <span>{formatMissingFieldLabel(m)}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    <p className="text-[11px] text-muted-foreground/80 italic pt-1 border-t border-amber-500/20">
                      Open your Scraper Studio collector and verify its output
                      schema.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>

          <CardFooter className="p-6 pt-0 border-t border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <Button
              variant="outline"
              size="sm"
              render={<Link to="/competitors" />}
              disabled={isSubmitting}
              className="text-xs w-full sm:w-auto"
            >
              Cancel
            </Button>

            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting}
              className="text-xs gap-2 w-full sm:w-auto cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <HugeiconsIcon
                    icon={RefreshIcon}
                    strokeWidth={2}
                    className="size-3.5 animate-spin"
                  />
                  <span aria-live="polite">
                    Connecting source & capturing baseline…
                  </span>
                </>
              ) : (
                <>
                  <HugeiconsIcon
                    icon={CheckmarkCircle01Icon}
                    strokeWidth={2}
                    className="size-3.5"
                  />
                  <span>Start tracking</span>
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}

function formatMissingFieldLabel(field: string): string {
  switch (field) {
    case "pricing.amount":
      return "Price amount was not detected";
    case "primaryCta.label":
      return "Primary CTA label was not detected";
    case "headline":
      return "Headline positioning was not detected";
    case "offer":
      return "Promotional offer was not detected";
    default:
      return `Missing field: ${field}`;
  }
}
