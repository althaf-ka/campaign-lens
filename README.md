# CampaignLens

**Continuous Competitor Campaign Intelligence with Guarded Self-Healing Scrapers**

> **"Extraction absence is not business absence. CampaignLens never converts missing scraper data into a campaign change."**

CampaignLens monitors competitors' public marketing campaigns (pricing, headline, promotional offers, guarantees, and primary call-to-action) without confusing website layout drift with genuine market changes. 

When a competitor changes its real business offering, CampaignLens detects and records a semantic campaign event in a chronological timeline. When a competitor redesigns their DOM structure and selectors break, CampaignLens guards historical data, flags the source as degraded, and triggers autonomous Bright Data Scraper Studio Self-Healing to repair the collector without corrupting the historical record.

---

## Live Deployments

- **CampaignLens Web App**: [https://campaign-lens.demostore.workers.dev](https://campaign-lens.demostore.workers.dev)
- **CampaignLens API Worker**: [https://campaign-lens-api.demostore.workers.dev](https://campaign-lens-api.demostore.workers.dev)
- **Demo Storefront (Lumora)**: [https://lumora-58u.pages.dev](https://lumora-58u.pages.dev)

---

## The Core Problem

Most web scraping pipelines for competitor intelligence suffer from a fundamental reliability flaw:

```text
Competitor redesigns website DOM
               ↓
Scraper fails / returns partial nulls
               ↓
Naïve diff engine assumes values dropped to null
               ↓
FAKER ALERTS: "Price dropped from ₹2,299 to $0", "Offer removed"
```

CampaignLens eliminates this flaw through a strict **Extraction Integrity Contract**:
1. **Schema Validation**: Guarantees JSON structure via strict Zod schemas.
2. **Extraction Integrity Layer**: Verifies required campaign fields are physically present.
3. **Deterministic Diff Engine**: Only calculates semantic diffs against verified complete snapshots.
4. **Guarded Self-Healing**: Automatically repairs broken collectors using Bright Data's AI Self-Healing while preserving the same Collector ID and historical timeline.

---

## Architecture

```text
                         Cloudflare Cron (`*/30 * * * *`)
                                       │
                                       ▼
                       runDueSources (Bounded Batch)
                                       │
                                       ▼
                                 monitorSource
                                       │
                        ┌──────────────┴──────────────┐
                        ▼                             ▼
                    runSource                     healSource
                 (Collection)                     (Recovery)
                        │                             │
                        ▼                             ▼
                 Bright Data API               Bright Data AI
                 Scraper Studio                 Self-Healing
                        │                             │
                        ▼                             ▼
              Zod Schema Validation           AI Preview Validation
                        │                             │
                        ▼                             ▼
               Extraction Integrity              Approval Gate
                        │                             │
             ┌──────────┴──────────┐                  ▼
             ▼                     ▼          Rerun Same Collector
          healthy               degraded              │
             │                     │                  ▼
             ▼                     ▼             Source Healed
          Snapshot             Preserve               │
             │                 Baseline               ▼
             ▼                     │          0 Fake Campaign Changes
     Deterministic Diff            ▼
             │               Trigger Repair
             ▼
      Campaign Timeline
```

---

## Monorepo Architecture

CampaignLens is built as a pnpm + Turborepo monorepo:

```text
campaign-lens/
├── apps/
│   ├── api/            # Cloudflare Worker + Hono backend (REST API & Cron Scheduler)
│   ├── web/            # TanStack Start SSR web frontend with shadcn/ui primitives
│   └── demo-store/     # Next.js static e-commerce storefront (Lumora) for live failure testing
├── packages/
│   ├── domain/         # Pure domain schemas, deterministic diff engine, and integrity rules
│   ├── brightdata/     # Clean Bright Data client, real-time polling, and Self-Healing adapter
│   ├── db/             # Drizzle ORM schema, PostgreSQL queries, and database client
│   └── ui/             # Shared UI components styled with Tailwind CSS
```

---

## Key Invariants

1. **Missing extraction $\neq$ campaign change**: A broken or partial scrape never inserts a snapshot and never emits diff events.
2. **Collector ID Stability**: AI self-healing repairs the existing Scraper Studio collector template in place (`c_mt5kun512itlsaiw1s`); it never mutates collector IDs or splits history.
3. **Guarded Recovery Policy**: AI self-healing is triggered only for DOM/selector drift (`wait_element_timeout`, integrity failure). Upstream auth errors, rate limits, or transient 503 outages are handled gracefully as retryable without corrupting state.
4. **Zero-Event Recovery**: When a broken scraper is repaired and extracts the original campaign data, exactly `0` new campaign events are generated.

---

## Automated Test Suite

CampaignLens includes 44 automated unit tests covering all edge cases with zero live API calls:

```bash
pnpm test
```

- **`@campaign-lens/domain`** (19 tests): Zod validation, whitespace normalization, multi-field diffing, source-specific integrity policies.
- **`@campaign-lens/brightdata`** (8 tests): Real-time triggering, polling, template refactoring, HTTP 503 handling, automated approval.
- **`@campaign-lens/db`** (2 tests): Database client creation and format verification.
- **`api`** (15 tests):
  - Recovery policy (`shouldAttemptHealing` with auth, rate limits, timeouts)
  - `monitorSource` lifecycle (healthy, degraded, recovered, unavailable)
  - `healSource` safety gates (preview validation, schema check, approval)
  - `runDueSources` bounded scheduling and fault isolation

---

## Getting Started

### Prerequisites
- Node.js >= 20
- pnpm >= 9
- PostgreSQL database (e.g. Neon)
- Bright Data API Token

### Setup
```bash
# 1. Clone repository
git clone https://github.com/althafka/campaign-lens.git
cd campaign-lens

# 2. Install dependencies
pnpm install

# 3. Configure environment variables in apps/api/.dev.vars
DATABASE_URL=postgresql://...
BRIGHT_DATA_API_TOKEN=...

# 4. Run tests
pnpm test

# 5. Start development servers
pnpm dev
```
