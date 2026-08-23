# CampaignLens

**Competitor campaign intelligence that knows the difference between the competitor changing and the scraper breaking.**

CampaignLens monitors competitors' public marketing websites and turns changes to pricing, promotional offers, headlines, and primary calls-to-action into verified campaign intelligence. When a competitor redesigns their website and CSS selectors break, CampaignLens guards historical data, flags the source as degraded, and initiates guarded Self-Healing rather than corrupting campaign history with false alerts.

---

## Live Demo

- **CampaignLens Web App**: [https://campaign-lens.demostore.workers.dev](https://campaign-lens.demostore.workers.dev)
- **CampaignLens API**: [https://campaign-lens-api.demostore.workers.dev](https://campaign-lens-api.demostore.workers.dev)
- **Controlled Lumora Demo Target**: [https://lumora-58u.pages.dev](https://lumora-58u.pages.dev)
- **Demo Video**: `<add after upload>`

---

## Why CampaignLens?

Most competitor intelligence tools connect scrapers directly to a diff engine. When a website redesigns its markup, the scraper fails or returns partial nulls, causing the system to broadcast false alerts: *"Price dropped to $0"* or *"Competitor removed their hero offer."*

CampaignLens separates **market intelligence** from **scraper infrastructure**:

| Scenario | What Happened | Naïve Scraper Alert | CampaignLens Verified Result |
|---|---|---|---|
| **Genuine Campaign Change** | Competitor raised price from ₹1,999 to ₹2,299 and updated promo from *30% Off* to *Free Pro Upgrade*. | `price_changed`, `offer_changed` | `price_changed` (₹1,999 → ₹2,299)<br>`offer_changed` (*Free Pro Upgrade*) recorded to timeline. |
| **Website Redesign (DOM Drift)** | Competitor changed HTML layout; price and offer remain unchanged on page, but CSS selectors break. | `price_changed` (₹2,299 → null)<br>`offer_changed` (removed) | **Source Degraded**.<br>Baseline preserved.<br>**0 false campaign events**.<br>Self-Healing recovery initiated. |

> **"Extraction absence is not business absence."**
>
> Missing scraper fields are never interpreted as a competitor removing a price, promotion, or call-to-action. CampaignLens only calculates semantic diffs against verified complete extractions.

---

## What It Does

- **Overview & Attention Queue**: A prioritized feed that highlights actionable competitor campaign moves and flags degraded sources needing operational attention.
- **Competitor Onboarding**: Track any competitor by domain and connect custom Scraper Studio collectors.
- **Test Connection Diagnostics**: Test Scraper Studio collectors against target URLs in real time before connecting, validating schema compatibility and field extraction.
- **Verified Campaign Baselines**: Tracks headline, promotional offer, pricing (amount, currency, qualifier), primary CTA (label, href), and guarantees in a structured schema.
- **Deterministic Change Timeline**: Computes semantic diffs (with whitespace normalization) and records field-level events (`price_changed`, `offer_changed`, `cta_changed`, `headline_changed`).
- **Side-by-Side Snapshot Comparison**: Inspect exact before-and-after campaign states side by side with highlighted field changes.
- **Activity & Recovery Center**: Unified operational stream combining business campaign events and scraper lifecycle events (`monitor_started`, `extraction_degraded`, `healing_started`, `healing_unavailable`).
- **Non-Blocking Asynchronous Monitoring**: Monitoring requests return **HTTP 202 Accepted** immediately, polling and advancing bounded scrape steps with responsive shimmering UI feedback.

---

## Bright Data Scraper Studio

CampaignLens is powered by **Bright Data Scraper Studio** using a custom browser-based collector (`c_mt5kun512itlsaiw1s`) specifically configured to extract commercial campaign signals from ecommerce storefronts.

### Developer Infrastructure Workflow

```text
Coding Agent  ──►  Bright Data CLI  ──►  Custom Scraper Studio Collector  ──►  Stable c_* Collector ID  ──►  CampaignLens Production API
```

*Note: The Bright Data CLI is used exclusively for developer infrastructure and collector provisioning. End users manage competitors and run monitoring directly through the CampaignLens web application.*

### Structured Campaign Contract

The Scraper Studio collector outputs structured campaign records validated against a strict Zod contract:

```json
{
  "headline": "Smarter lighting. Simpler living.",
  "offer": "Free Pro Upgrade with every Starter Kit",
  "pricing": {
    "amount": 2299,
    "currency": "INR",
    "qualifier": "Starter Kit"
  },
  "primaryCta": {
    "label": "Get the Starter Kit",
    "href": "#products"
  },
  "guarantees": [
    "Free installation support",
    "30-day returns",
    "2-year warranty"
  ],
  "sourceUrl": "https://lumora-58u.pages.dev/"
}
```

---

## Controlled Website-Change Experiment

To prove resilience against real-world DOM drift, CampaignLens is evaluated against **Lumora** (`https://lumora-58u.pages.dev`), a controlled ecommerce storefront:

1. **Phase 1 (Healthy Baseline)**: Lumora launched with a 30% discount at ₹1,999. The custom Scraper Studio collector verified the baseline.
2. **Phase 2 (Genuine Campaign Change)**: Lumora updated its offering to ₹2,299 with a *"Free Pro Upgrade"*. CampaignLens detected the change and recorded `price_changed` and `offer_changed` events.
3. **Phase 3 (DOM Drift Redesign)**: Lumora redesigned its hero section HTML markup while keeping the ₹2,299 price and promotion intact.
4. **Result**: The old collector returned `wait_element_timeout`. CampaignLens marked the source **Degraded**, preserved the previous verified campaign snapshot, generated **zero false campaign events**, and initiated autonomous Self-Healing.

---

## Guarded Self-Healing & Provider Resilience

CampaignLens integrates with Bright Data's Self-Healing API (`/dca/refactor_template`) using a strict verification gate:

```text
Bright Data Proposed Repair
             │
             ▼
   Zod Schema Validation
             │
             ▼
Extraction Integrity Layer
             │
      ┌──────┴──────┐
      ▼             ▼
   [Valid]      [Invalid]
      │             │
Approve Repair  Reject -> Flag Needs Review
      │
Rerun SAME Collector ID
(Preserves historical timeline)
```

### Real-World Provider Outage Handling

During final live hackathon testing, Bright Data's Self-Healing API endpoint was temporarily unavailable and returned HTTP 503 (`Self healing tool is temporarily disabled`). 

CampaignLens handled this provider outage gracefully:
- Classified the 503 error as a temporary, retryable condition.
- Kept the source in a protected **Degraded** state with the last verified campaign preserved.
- Scheduled an automatic retry in the background without corrupting historical data or throwing unhandled errors.

---

## Architecture

```mermaid
flowchart TD
    UI[CampaignLens Web\nTanStack Start SSR]
    CRON[Cloudflare Cron\nScheduled Runner]
    API[Hono REST API\nCloudflare Workers]
    MONITOR[Monitoring Orchestration\nHTTP 202 Accepted]
    BD[Bright Data Scraper Studio\nCollector c_mt5kun512itlsaiw1s]
    VALIDATE[Zod Schema +\nExtraction Integrity]
    DB[(Neon PostgreSQL\nDrizzle ORM)]
    DIFF[Deterministic\nDiff Engine]
    ATTENTION[Attention Queue\n& Campaign Timeline]
    RECOVERY[Guarded Self-Healing\nState Machine]

    UI -->|Poll & Advance| API
    CRON -->|Background Batch| API
    API --> MONITOR
    MONITOR --> BD
    BD --> VALIDATE
    VALIDATE -->|Healthy Snapshot| DB
    DB --> DIFF
    DIFF --> ATTENTION
    VALIDATE -->|Degraded DOM| RECOVERY
    RECOVERY -->|Refactor Prompt| BD
```

### Asynchronous Monitoring Flow

1. **Trigger**: User clicks *"Monitor now"*. `POST /sources/:id/monitor` triggers Bright Data once and immediately returns **HTTP 202 Accepted** with a persisted `scrape_run` ID.
2. **Polling & Advance**: The frontend polls `GET /scrape-runs/:id` (read-only) and invokes `POST /scrape-runs/:id/advance` (bounded single step).
3. **Cron Resilience**: Cloudflare Scheduled Cron runs in the background (`*/30 * * * *`), advancing active scrape runs and recovery runs even if the user navigates away.

---

## Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Frontend** | TanStack Start (SSR) + React 19 | Full-stack server-rendered dashboard |
| **State & Polling** | TanStack Query v5 | Reactive data fetching, caching, and bounded polling |
| **Styling & UI** | Tailwind CSS v4 + shadcn/ui + Hugeicons | Design system with accessible UI primitives |
| **API Framework** | Hono v4 | Lightweight, type-safe REST API |
| **Serverless Runtime** | Cloudflare Workers | Edge runtime hosting API and web frontend |
| **Scheduler** | Cloudflare Cron Triggers | Automated background monitoring and recovery |
| **Database** | Neon Serverless PostgreSQL | Relational storage for snapshots, events, and audit logs |
| **ORM** | Drizzle ORM | Type-safe SQL query builder and schema management |
| **Validation** | Zod v3 | Strict runtime schema validation at system boundaries |
| **Web Scraping** | Bright Data Scraper Studio | Headless browser data collection and AI Self-Healing |
| **Monorepo Tooling** | pnpm workspaces + Turborepo | Fast monorepo task orchestration and build caching |
| **Testing** | Node.js Test Runner (`node:test`) | Fast, zero-dependency unit and integration test suite |

---

## Repository Structure

```text
campaign-lens/
├── apps/
│   ├── web/            # TanStack Start SSR frontend application
│   ├── api/            # Hono REST API deployed on Cloudflare Workers
│   └── demo-store/     # Next.js static e-commerce storefront (Lumora)
└── packages/
    ├── domain/         # Pure domain contracts, schemas, diff engine, and integrity rules
    ├── brightdata/     # Bright Data Scraper Studio & Self-Healing client SDK
    ├── db/             # Drizzle ORM schemas, Neon PostgreSQL client, and queries
    └── ui/             # Shared shadcn/ui components and Tailwind CSS styles
```

---

## Engineering Principles

- **Clear Domain Boundaries**: Scraping transport is strictly decoupled from domain validation. Provider schemas never leak into business entities.
- **Extraction Integrity Layer**: Structural JSON validity is distinguished from semantic extraction completeness (`schema_valid !== extraction_complete`).
- **Deterministic Diffing**: Snapshots are compared field by field with whitespace normalization, preventing cosmetic reformatting from triggering false events.
- **Bounded State Advancement**: Long-running scraper jobs and multi-step AI repairs are modeled as resumable state machines advancing one step per request.
- **Zero-Network Unit Testing**: All 76 automated tests execute in under 1 second without making live network requests.
- **Server-Only Credentials**: Bright Data API tokens and database connection strings exist exclusively in server worker bindings.

---

## Automated Test Suite

CampaignLens includes **76 automated unit and integration tests** across all monorepo packages:

```bash
pnpm test
```

```text
✔ @campaign-lens/domain    (27 tests) — Zod schemas, whitespace normalization, multi-field diffing, extraction integrity rules, attention formatters
✔ @campaign-lens/brightdata (9 tests) — Collector trigger, poll results, error classification, Self-Healing trigger/progress/approval, 503 handling
✔ @campaign-lens/db         (2 tests) — Database client initialization and format validation
✔ api                      (38 tests) — Onboarding validation, Test Connection diagnostics, 202 monitor flow, bounded scrape advancement, recovery safety gates, cron scheduling
```

---

## Local Development

### Prerequisites

- Node.js >= 20
- pnpm >= 9
- PostgreSQL database (e.g. [Neon](https://neon.tech))
- Bright Data account & API Token

### Setup

```bash
# 1. Clone the repository
git clone https://github.com/althafka/campaign-lens.git
cd campaign-lens

# 2. Install dependencies
pnpm install

# 3. Configure environment variables in apps/api/.dev.vars
DATABASE_URL=postgresql://user:password@ep-xyz.neon.tech/campaign_lens?sslmode=require
BRIGHT_DATA_API_TOKEN=your_bright_data_api_token

# 4. Run database migrations
pnpm --filter @campaign-lens/db run migrate

# 5. Run the complete test suite
pnpm test

# 6. Start development servers
pnpm dev
```

---

## Security & Data Privacy

- **Server-Side Credentials**: All Bright Data tokens and database credentials are stored in Cloudflare Worker secrets (`.dev.vars` / Wrangler secrets).
- **Zero Client Token Exposure**: The frontend never receives, stores, or transmits third-party API credentials.
- **Sanitized Upstream Errors**: Upstream scraper errors are parsed and sanitized into typed error codes before presentation, ensuring internal tokens or infrastructure URLs are never leaked.

---

## Scrape-Verse Hackathon Tracks

### WEB-SLINGER — Best Use of Bright Data
- Uses custom **Bright Data Scraper Studio** browser collector (`c_mt5kun512itlsaiw1s`) tailored for marketing intelligence.
- Automated developer infrastructure workflow via Bright Data CLI.
- Integrated **AI Self-Healing** lifecycle with automated template refactoring and safety approval gates.
- Controlled DOM-drift experiment demonstrating resilient recovery from crawler selector timeout.

### SUIT-UP — Best UI
- **Attention Queue**: High-level dashboard surfacing actionable competitor campaign changes and degraded scrapers.
- **Competitor Onboarding & Diagnostics**: Clean onboarding flow with live Scraper Studio connection testing.
- **Semantic Campaign Timeline**: Chronological event feed with badges and field change highlights.
- **Side-by-Side Comparison Dialog**: Visual inspection of historical snapshot differences.
- **Activity & Recovery Center**: Operational transparency with real-time text shimmering during active collection and repair cycles.

### SPIDER-SENSE — Best Clean Code
- Strict separation of concerns across a 7-package Turborepo monorepo.
- Pure deterministic domain logic with zero external side effects in `@campaign-lens/domain`.
- Resumable, bounded state machine architecture returning HTTP 202 Accepted.
- 76 automated tests with 100% pass rate, 0 lint warnings, and strict TypeScript types across all workspaces.
