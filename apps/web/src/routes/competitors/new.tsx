import { useState } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@campaign-lens/ui/components/card";
import { Input } from "@campaign-lens/ui/components/input";
import { Button } from "@campaign-lens/ui/components/button";
import { Alert, AlertTitle, AlertDescription } from "@campaign-lens/ui/components/alert";
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
  Store01Icon,
} from "@hugeicons/core-free-icons";
import { createCompetitor } from "../../features/competitors/api/competitor.queries.ts";

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
  const [sourceType, setSourceType] = useState<"homepage" | "pricing">("homepage");
  const [collectorId, setCollectorId] = useState("");
  const [intervalMinutes, setIntervalMinutes] = useState(60);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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
      setErrorMessage("Collector ID must start with 'c_' (e.g. c_mt5kun512itlsaiw1s).");
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

      // Invalidate competitors list cache
      await queryClient.invalidateQueries({ queryKey: ["competitors"] });

      // Navigate to competitor detail page
      navigate({
        to: "/competitors/$competitorId",
        params: { competitorId: result.competitor.id },
      });
    } catch (err) {
      console.error("Failed to onboard competitor:", err);
      setErrorMessage(
        err instanceof Error ? err.message : "An unexpected error occurred while onboarding competitor.",
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
          <HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={2} className="size-3.5" />
          <span>Back to Competitors</span>
        </Button>

        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Track competitor
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Connect a public competitor page to a Bright Data Scraper Studio collector.
          </p>
        </div>
      </div>

      <Separator />

      {errorMessage && (
        <Alert variant="destructive">
          <HugeiconsIcon icon={AlertCircleIcon} strokeWidth={2} className="size-4" />
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
                <label className="text-xs font-medium text-foreground">
                  Competitor Name <span className="text-destructive">*</span>
                </label>
                <Input
                  placeholder="e.g. Lumora Lighting"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isSubmitting}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">
                  Website / Domain <span className="text-destructive">*</span>
                </label>
                <Input
                  placeholder="e.g. lumora-58u.pages.dev"
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
                <label className="text-xs font-medium text-foreground">
                  Source Label
                </label>
                <Input
                  placeholder="e.g. Homepage Campaign"
                  value={sourceName}
                  onChange={(e) => setSourceName(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">
                  Public URL <span className="text-destructive">*</span>
                </label>
                <Input
                  type="url"
                  placeholder="https://lumora-58u.pages.dev/"
                  value={sourceUrl}
                  onChange={(e) => setSourceUrl(e.target.value)}
                  disabled={isSubmitting}
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">
                    Source Type
                  </label>
                  <Select
                    items={SOURCE_TYPE_ITEMS}
                    value={sourceType}
                    onValueChange={(val) => {
                      if (val) setSourceType(val as "homepage" | "pricing");
                    }}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger>
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
                  <label className="text-xs font-medium text-foreground">
                    Monitoring Interval
                  </label>
                  <Select
                    items={INTERVAL_ITEMS}
                    value={intervalMinutes}
                    onValueChange={(val) => {
                      if (val !== null && val !== undefined) setIntervalMinutes(Number(val));
                    }}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger>
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

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">
                  Scraper Studio Collector ID <span className="text-destructive">*</span>
                </label>
                <Input
                  placeholder="e.g. c_mt5kun512itlsaiw1s"
                  value={collectorId}
                  onChange={(e) => setCollectorId(e.target.value)}
                  disabled={isSubmitting}
                  className="font-mono"
                  required
                />
                <p className="text-[11px] text-muted-foreground">
                  Use the Collector ID from your custom Bright Data Scraper Studio scraper.
                </p>
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
                  <HugeiconsIcon icon={RefreshIcon} strokeWidth={2} className="size-3.5 animate-spin" />
                  <span>Connecting source & capturing baseline...</span>
                </>
              ) : (
                <>
                  <HugeiconsIcon icon={CheckmarkCircle01Icon} strokeWidth={2} className="size-3.5" />
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
