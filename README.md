# Ads Manager - Frontend

Next.js 16 (App Router) and Tailwind CSS frontend for the AI-Powered Amazon Ads Management Platform.

## Prerequisites
- Node.js (v18 or higher)
- [pnpm](https://pnpm.io/) package manager

## Environment Variables
Create `.env.local` or copy `.env.example`:
```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
```
- `NEXT_PUBLIC_API_URL`: Base URL of the FastAPI backend.

## Running Locally

1. Install dependencies:
```bash
pnpm install
```

2. Start the development server:
```bash
pnpm dev
```
The application will be accessible at `http://localhost:3000`.

3. Production build & type check:
```bash
pnpm build
```

4. Run unit tests:
```bash
pnpm dlx tsx --test components/campaigns/wizard/__tests__/toPayload.test.ts
```

## Features & Architecture

### Rebuilt Campaigns Page (`/campaigns`)
- **Header & Filters**: Date range presets (Today, Yesterday, Last 7/14/30 days, Month, Custom) with comparison mode; interactive filter popovers (Status, Health, Targeting type, Spend, Budget, ROAS, ACOS, etc.); named filter presets saved to `localStorage`.
- **KPI Metrics Cards**: Configurable 4–6 KPI cards with period-over-period delta comparisons, direction-aware color coding, and metric selector.
- **Collapsible Performance Chart**: Recharts dual-axis chart supporting Daily, Weekly, and Monthly aggregations, previous period comparison lines, Table view toggle, and CSV export.
- **Data Table**: Sticky headers, inline budget editing with instant Enter/Esc controls and minimum budget validation, optimistic status toggles, expandable row viewing ad group metrics, column chooser, and bulk operations (Enable, Pause, Archive, Set budget, Adjust budget %).
- **Drafts Panel**: Saved drafts drawer with resume and delete capabilities.

### 5-Step Campaign Creation Wizard (`/campaigns/new`)
1. **Step 1 — Details**: Live campaign name availability check, country, daily budget with marketplace suggestion and monthly planning calculator, start/end dates, target ACOS %, ad group name, sites (`AMAZON_AND_BEYOND` / `AMAZON_BUSINESS`), targeting type, bidding strategies (`AUTO_FOR_SALES`, `LEGACY_FOR_SALES`, `MANUAL`), and placement adjustments (0–900%).
2. **Step 2 — Products**: Search by title, ASIN, or SKU with relevance sorting, active campaign cannibalisation indicators, Enter list textarea, and CSV file upload.
3. **Step 3 — Targeting**: Automatic mode with default bid or targeting group bids (Close match, Loose match, Substitutes, Complements); Manual mode with match types (Broad, Phrase, Exact), suggested product keywords, and competitor ASIN targets.
4. **Step 4 — Negative Targeting**: Negative keyword targeting (Exact & Phrase) with suggested wasteful terms, negative brand exclusions, and product exclusions with conflict checking.
5. **Step 5 — Review & Launch**: Read-only review cards with jump-to-step links, live dry-run validation against backend rules, optimization warnings, and launch controls.
- **Right Rail**: Live campaign summary and heuristic weekly forecast (clicks, orders, spend).

### Campaign Detail (`/campaigns/[id]`)
- Real-time campaign performance KPIs and charts scoped to the campaign.
- Five dedicated management tabs: Ad Groups (with inline default bid edit), Keywords (state toggle and new keyword modal), Search Terms (with "Add as keyword" and "Add as negative" modal actions), Negatives (add and remove negative keywords), and Settings (bidding strategy, placements, end date, target ACOS).

### Campaign Settings (`/campaigns/settings`)
- Global target ACOS and bid-limit thresholds.
- Dynamic Health Score Rules manager: toggle rules, drag/reorder priority, add custom rules with condition builder (`acos`, `roas`, `spend`, `orders`, etc.), and reset to defaults.
