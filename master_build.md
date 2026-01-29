# master_build.md — Campaign Compliance & Finances (SOS Upload Module)
**Version:** 1.0 (micro-build spec; “no-guessing”)  
**Last updated:** 2026-01-28
**Repo baseline observed in Blueprints zip:** Next.js 14 App Router + Tailwind; Prisma schema at `db/prisma/schema.prisma`; Postgres schemas supported.

> If a builder follows this file line-by-line, they should finish the entire module without needing clarification.

---
## Blueprints zip alignment notes (confirmed)
- The provided Blueprints zip contains a monorepo skeleton with `apps/public_site/` in a Next.js App Router layout (`apps/campaign_compliance/app/`, `apps/campaign_compliance/components/`, `apps/campaign_compliance/lib/`).
- Several implementation files in the zip are **0 bytes** (placeholders), so we cannot rely on them for DB/Prisma specifics.
- Therefore this build **standardizes** on: Next.js 14 + Tailwind + Postgres + Prisma, while keeping all campaign tables isolated in Postgres schema `campaign`.

> If your existing database adapter is not Prisma, keep the same contracts (tables/columns/API shapes) and swap the DB layer implementation; the schema and exports remain identical.


---


## REQUIRED PATHS (plan_guard)

The plan guard enforces that required files/folders exist exactly as referenced in this plan.

In addition to the build-step paths listed throughout the phases, the following **create-next-app baseline artifacts** are treated as **required** (they are expected to exist in a standard Next.js 14 App Router + Tailwind scaffold under `apps/campaign_compliance/` and must not be flagged as drift):

- `apps/campaign_compliance/.eslintrc.json`
- `apps/campaign_compliance/.gitignore`
- `apps/campaign_compliance/app/favicon.ico`
- `apps/campaign_compliance/app/fonts/GeistMonoVF.woff`
- `apps/campaign_compliance/app/fonts/GeistVF.woff`
- `apps/campaign_compliance/app/globals.css`
- `apps/campaign_compliance/app/layout.tsx`
- `apps/campaign_compliance/components/NavBar.tsx`
- `apps/campaign_compliance/components/PageShell.tsx`
- `apps/campaign_compliance/next-env.d.ts`
- `apps/campaign_compliance/next.config.mjs`
- `apps/campaign_compliance/postcss.config.mjs`
- `apps/campaign_compliance/tailwind.config.ts`
- `apps/campaign_compliance/tsconfig.json`

> Note: If any of these are intentionally removed or renamed, the plan must be updated first (otherwise plan_guard will correctly report drift).


## Locked SOS export schema (DO NOT EDIT)
These arrays are the single source of truth for CSV column names and order.

```json
{
  "header": [
    "FilingEntityName",
    "FilingEntityID",
    "Date"
  ],
  "contributions": [
    "Actions",
    "ExternalContributionID",
    "ContributionDate",
    "ContributionAmount",
    "ContributionType",
    "ElectionType",
    "ContributorType",
    "ExternalContributorID",
    "FilingEntityID",
    "ContributorOrganizationName",
    "ContributorFirstName",
    "ContributorMiddleName",
    "ContributorLastName",
    "ContributorSuffix",
    "ContributorAddressLine1",
    "ContributorAddressLine2",
    "ContributorCity",
    "ContributorState",
    "ContributorZipCode",
    "ContributorEmployer",
    "ContributorOccupation",
    "ContributorOccupationOther",
    "ContributionDescription"
  ],
  "contributionReturns": [
    "Actions",
    "ExternalReturnContributionID",
    "ExternalContributionID",
    "ContributionReturnDate",
    "ContributionReturnAmount",
    "ContributionReturnReason"
  ],
  "expenditures": [
    "Actions",
    "ExternalExpenditureID",
    "ExpenditureDate",
    "ExpenditureAmount",
    "ExpenditureType",
    "ElectionType",
    "ExpenditureCategory",
    "ExpenditureCategoryOtherDescription",
    "PayeeType",
    "ExternalPayeeID",
    "FilingEntityID",
    "PayeeOrganizationName",
    "PayeeFirstName",
    "PayeeMiddleName",
    "PayeeLastName",
    "PayeeSuffix",
    "PayeeAddressLine1",
    "PayeeAddressLine2",
    "PayeeCity",
    "PayeeState",
    "PayeeZipCode",
    "ExpenditureDescription"
  ],
  "expenditureReturns": [
    "Actions",
    "ExternalReturnExpenditureID",
    "ExternalExpenditureID",
    "ExpenditureReturnDate",
    "ExpenditureReturnAmount",
    "ExpenditureReturnReason"
  ]
}
```

---

## Glossary
- **Record status** (data readiness): `DRAFT | READY | FLAGGED`  
- **Travel status**: `DRAFT | READY | FLAGGED | COMMITTED`  
- **Build status** (for the build map): `NOT_STARTED | IN_PROGRESS | BLOCKED | DONE`  
- **SOS External IDs**: fields like `ExternalContributionID` required by templates; generated once and stored.

---

## Prime directive (product behavior)
1) Candidate sees a calm app: **4 actions on home**  
2) Candidate enters **one record at a time** via wizard/flow  
3) Candidate runs **Filing Prep** for a date range  
4) Candidate downloads **HTML review + SOS-ready CSVs**  
5) Nothing else is allowed to clutter the MVP.

---

## Cross-cutting non-negotiables
### UX
- One primary CTA per page
- No dashboards or charts on first open
- Drilldowns exist but are never required

### Data safety
- External IDs generated once; never re-generated
- Travel “commit” is irreversible (except notes/purpose)
- Export runs are logged and immutable

### “Update master_build.md every step”
At the end of every step:
- Update the step status in this file
- Commit with the exact tag shown

---

# PHASE 0 — Lock architecture + SOS contract
**Build Status:** DONE

## P0-01 — Confirm parallel build conventions
**Status:** DONE  
**Evidence:** Blueprints zip contains `apps/public_site` using Next.js app router, Tailwind, and shared Prisma schema.

## P0-02 — Lock SOS column arrays
**Status:** DONE  
**Evidence:** Columns listed above are copied from SOS template spreadsheets.

---


# PHASE G — Governance + Plan Guard (FOUNDATION)
**Build Status:** IN_PROGRESS

## Phase G outcome
The repo can audit itself against the canonical plan and enforce “no drift” rules.

## PG-01 — Plan Guard script exists and runs
**Status:** DONE

**Files**
- `scripts/plan_guard.js`

**Acceptance**
- `node scripts/plan_guard.js` runs and reports:
  - missing required paths (OFF-PLAN)
  - extra unplanned paths (DRIFT)
  - manifest written to `.plan_guard/manifest.json`

**Commit**
- `chore(governance): plan_guard`

---

## PG-02 — Protocols + Phase checklists exist
**Status:** DONE

**Files**
- `PROTOCOLS.md`
- `PHASE_1_FILELIST.md`

**Acceptance**
- Files exist at repo root and define “full-file only / one file at a time / no drift” rules.

**Commit**
- `docs(governance): protocols + phase checklists`

---

## PG-03 — Plan Guard alignment: required baseline artifacts + drift resolution
**Status:** IN_PROGRESS

**Goal**
- Update the plan’s “REQUIRED PATHS (plan_guard)” so create-next-app baseline artifacts are not treated as drift.
- Remove or document any remaining unplanned files under watched roots.

**Acceptance**
- `node scripts/plan_guard.js` reports:
  - ✅ none missing required paths
  - ✅ no drift OR drift explicitly documented in this plan

**Commit**
- `chore(governance): plan_guard alignment`


---

# PHASE 1 — App shell + DB wiring + progress map (MICRO)
**Build Status:** IN_PROGRESS

## P1-01 — Create app skeleton
**Status:** DONE  
**Do**
1) From repo root:
   - `npx create-next-app@14 apps/campaign_compliance --ts --tailwind --eslint --app --src-dir=false --import-alias "@/*"`
2) Verify `apps/campaign_compliance/app/page.tsx` exists.

**Acceptance**
- `cd apps/campaign_compliance && npm run dev` shows the Next starter page.

**Commit**
- `chore(phase-1): scaffold app`

---

## P1-02 — Mirror baseline conventions from public_site
**Status:** DONE  
**Do**
1) Copy these files from `apps/public_site` into `apps/campaign_compliance` (adjust paths as needed):
   - `tailwind.config.ts`
   - `postcss.config.mjs`
   - `tsconfig.json` (keep `@/*` alias)
2) Ensure `apps/campaign_compliance/app/globals.css` includes Tailwind directives (same as public_site).

**Acceptance**
- Tailwind classes render (e.g., add a colored div and see it render).

**Commit**
- `chore(phase-1): align tailwind+tsconfig`

---

## P1-03 — Create module routes (empty shells)
**Status:** NOT_STARTED  
**Create routes**
- `/` (home)
- `/contributions` `/contributions/new` `/contributions/[id]`
- `/expenses` `/expenses/new` `/expenses/[id]` `/expenses/analysis`
- `/travel` `/travel/new` `/travel/[id]` `/travel/timeline`
- `/filing`
- `/settings`
- `/build-map`

**Implementation rule**
- Every page must render inside `<PageShell title="...">`.

**Commit**
- `feat(phase-1): route scaffolds`

---

## P1-04 — Build core UI components (no design drift)
**Status:** NOT_STARTED  
**Create**
- `apps/campaign_compliance/components/PageShell.tsx`
- `apps/campaign_compliance/components/NavBar.tsx`
- `apps/campaign_compliance/components/Button.tsx` (primary/secondary)
- `apps/campaign_compliance/components/Field.tsx` (label + helper + error)
- `apps/campaign_compliance/components/PrimaryActionCard.tsx`
- `apps/campaign_compliance/components/StatusPill.tsx`

**Exact UX rules**
- NavBar is always visible and quiet.
- No icons required.
- PrimaryActionCard is a clickable surface with title + 1-line description.

**Acceptance**
- All routes show nav + consistent padding + typography.

**Commit**
- `feat(phase-1): core components`

---

## P1-05 — Minimal Home page (exact copy)
**Status:** NOT_STARTED  
**Home must show only**
- Title: “Campaign Compliance”
- Subtitle: “Enter contributions and expenses, track mileage, then download SOS-ready files.”
- Four cards:
  1) Add Contribution → `/contributions/new`
  2) Add Expense → `/expenses/new`
  3) Travel Log → `/travel/timeline`
  4) Prepare Filing → `/filing`

**Acceptance**
- No other panels/tables.

**Commit**
- `feat(phase-1): minimal home`

---

## P1-06 — Enable Postgres schema `campaign` in Prisma datasource
**Status:** NOT_STARTED  
**Edit**
- `db/prisma/schema.prisma`
- In `datasource db` set:
  - `schemas = ["public","private","campaign"]`

**Acceptance**
- `npx prisma generate` succeeds.

**Commit**
- `chore(phase-1): prisma add campaign schema`

---

## P1-07 — Create campaign schema SQL (idempotent)
**Status:** DONE  
**Create**
- `db/sql/006_campaign_schema.sql`

**Must include**
- `CREATE SCHEMA IF NOT EXISTS campaign;`
- Required enum types (idempotent DO blocks):
  - `campaign.record_status` ('draft','ready','flagged')
  - `campaign.travel_status` ('draft','ready','flagged','committed')
  - `campaign.source` ('manual','travel','import')
  - `campaign.contact_type` ('person','organization')
  - `campaign.export_format` ('csv','html')
  - `campaign.export_type` ('contributions','expenditures','both')

**Also create**
- `campaign.settings` singleton table:
  - id text primary key
  - sos_filing_entity_id text
  - sos_filing_entity_name text
  - timezone text default 'America/Chicago'
  - default_election_type text
  - mileage_rate numeric(6,2) default 0.70
  - brand_primary text
  - brand_secondary text
  - brand_logo_url text
  - created_at/updated_at timestamptz

**Acceptance**
- Script runs twice with no errors.

**Commit**
- `chore(phase-1): campaign schema sql`

---

## P1-08 — Add Prisma model CampaignSettings
**Status:** NOT_STARTED  
**Edit**
- `db/prisma/schema.prisma` add model:
  - `CampaignSettings` mapped to `campaign.settings`
  - Use `@@schema("campaign")`
  - Use `@map()` to map snake_case DB columns if needed.

**Rule**
- Row id is always `"singleton"`.

**Commit**
- `feat(phase-1): CampaignSettings model`

---

## P1-09 — Module-local Prisma client wrapper + env helper
**Status:** NOT_STARTED  
**Create**
- `apps/campaign_compliance/lib/prisma.ts`
- `apps/campaign_compliance/lib/env.ts`

**prisma.ts requirements**
- Export one PrismaClient instance (singleton pattern).

**env.ts requirements**
- Read `DATABASE_URL` (required)
- Read `OPENAI_API_KEY` (future)
- Provide `assertEnv()` that throws a user-safe error message.

**Commit**
- `feat(phase-1): prisma wrapper + env`

---

## P1-10 — Settings API + page
**Status:** NOT_STARTED  
**Create API**
- `apps/campaign_compliance/app/api/settings/route.ts`
  - GET: `findUnique("singleton")` else create default row
  - POST: upsert singleton

**Create page**
- `apps/campaign_compliance/app/settings/page.tsx`
Fields:
- Filing Entity Name
- Filing Entity ID
- Default Election Type
- Mileage Rate
- Timezone
- Brand Primary/Secondary/Logo URL

**Commit**
- `feat(phase-1): settings api + ui`

---

## P1-11 — Build Map JSON generator (ties to this file)
**Status:** NOT_STARTED  
**Goal**
- Generate `public/build-status.json` by parsing this markdown.

**Create**
- `scripts/build_status_from_md.js` (plain Node for zero dependencies)

**Parsing rules**
- Phase header: `# PHASE`
- Step header: `## P`
- Step status line: `**Status:** NOT_STARTED`
- Build status line: `**Build Status:** X`

**Output JSON**
- `{"phases":[{"title":"...","buildStatus":"...","steps":[{"id":"P1-01","title":"...","status":"..."}]}]}`

**Wire into build**
- In `apps/campaign_compliance/package.json`:
  - `"build:status": "node scripts/build_status_from_md.js ../../master_build.md"`
  - `"build": "npm run build:status && next build"`

**Commit**
- `feat(phase-1): build map generator`

---

## P1-12 — Build Map page UI
**Status:** NOT_STARTED  
**Create**
- `apps/campaign_compliance/app/build-map/page.tsx`
- Fetch `/build-status.json` and render:
  - phase accordion
  - step list with StatusPill

**Acceptance**
- Any time this markdown changes and rebuild occurs, the page updates.

**Commit**
- `feat(phase-1): build map page`

---

## P1-13 — Phase 1 doc update (required)
**Status:** NOT_STARTED  
**Do**
- Update Phase 1 statuses in this file.
- Add screenshot paths (create `apps/campaign_compliance/docs/screens/`).
- Commit:
  - `docs(phase-1): status updates`

---

# PHASE 2 — Contributions + Contacts (MICRO+ / NO-GUESSING)
**Build Status:** NOT_STARTED

## Phase 2 deliverables
1) Candidate can add a contribution with a **5-step wizard** (one thing at a time)
2) Candidate can search/create contributors (contacts) in-flow
3) Contributions show in a calm list (recent 20) with `DRAFT/READY/FLAGGED`
4) Validation runs on “Save Ready” and stores errors in `validation_errors`
5) DB schema matches SOS-mappable structure and preserves External IDs

---

## P2-01 — SQL DDL: contacts + contributions + contribution_returns (COPY/PASTE)
**Status:** NOT_STARTED

**Create file**
- `db/sql/007_campaign_contrib.sql`

**Run order prerequisite**
- Phase 1 `006_campaign_schema.sql` must have created schema `campaign` and enums.

**DDL (idempotent where feasible)**
```sql
-- 007_campaign_contrib.sql
CREATE SCHEMA IF NOT EXISTS campaign;

-- Contacts
CREATE TABLE IF NOT EXISTS campaign.contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_type campaign.contact_type NOT NULL,
  first_name text,
  middle_name text,
  last_name text,
  suffix text,
  org_name text,

  address_line1 text,
  address_line2 text,
  city text,
  state text,
  zip text,

  phone text,
  email text,

  employer text,
  occupation text,
  occupation_other text,

  external_contributor_id text,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Contributions
CREATE TABLE IF NOT EXISTS campaign.contributions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  contribution_date date NOT NULL,
  amount numeric(12,2) NOT NULL CHECK (amount >= 0),

  contribution_type text NOT NULL,
  election_type text NOT NULL,
  contributor_type text NOT NULL,

  description text,

  status campaign.record_status NOT NULL DEFAULT 'draft',
  source campaign.source NOT NULL DEFAULT 'manual',
  validation_errors jsonb NOT NULL DEFAULT '[]'::jsonb,

  contact_id uuid NOT NULL REFERENCES campaign.contacts(id) ON DELETE RESTRICT,

  external_contribution_id text NOT NULL UNIQUE,
  filing_entity_id text,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Contribution Returns (optional in MVP UI, required for schema completeness)
CREATE TABLE IF NOT EXISTS campaign.contribution_returns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  external_return_contribution_id text NOT NULL UNIQUE,
  external_contribution_id text NOT NULL REFERENCES campaign.contributions(external_contribution_id) ON DELETE RESTRICT,

  contribution_return_date date NOT NULL,
  contribution_return_amount numeric(12,2) NOT NULL CHECK (contribution_return_amount >= 0),
  contribution_return_reason text,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_contacts_org_name ON campaign.contacts (org_name);
CREATE INDEX IF NOT EXISTS idx_contacts_last_first ON campaign.contacts (last_name, first_name);
CREATE INDEX IF NOT EXISTS idx_contrib_date ON campaign.contributions (contribution_date);
CREATE INDEX IF NOT EXISTS idx_contrib_status ON campaign.contributions (status);
CREATE INDEX IF NOT EXISTS idx_contrib_contact_id ON campaign.contributions (contact_id);

-- updated_at triggers (if not already created in phase 1, create helper function)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'set_updated_at' AND pg_namespace::regnamespace::text = 'campaign') THEN
    CREATE OR REPLACE FUNCTION campaign.set_updated_at()
    RETURNS TRIGGER AS $fn$
    BEGIN
      NEW.updated_at = now();
      RETURN NEW;
    END;
    $fn$ LANGUAGE plpgsql;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_contacts_updated_at') THEN
    CREATE TRIGGER trg_contacts_updated_at
    BEFORE UPDATE ON campaign.contacts
    FOR EACH ROW EXECUTE FUNCTION campaign.set_updated_at();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_contrib_updated_at') THEN
    CREATE TRIGGER trg_contrib_updated_at
    BEFORE UPDATE ON campaign.contributions
    FOR EACH ROW EXECUTE FUNCTION campaign.set_updated_at();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_contrib_returns_updated_at') THEN
    CREATE TRIGGER trg_contrib_returns_updated_at
    BEFORE UPDATE ON campaign.contribution_returns
    FOR EACH ROW EXECUTE FUNCTION campaign.set_updated_at();
  END IF;
END $$;
```

**Acceptance**
- Running SQL creates 3 tables in `campaign` schema.
- `external_contribution_id` uniqueness enforced.

**Commit**
- `chore(phase-2): contrib ddl`

---

## P2-02 — Prisma models (exact blocks)
**Status:** NOT_STARTED

**Edit**
- `db/prisma/schema.prisma`

**Add**
```prisma
model CampaignContact {
  id               String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  contactType      String   @map("contact_type")
  firstName        String?  @map("first_name")
  middleName       String?  @map("middle_name")
  lastName         String?  @map("last_name")
  suffix           String?
  orgName          String?  @map("org_name")

  addressLine1     String?  @map("address_line1")
  addressLine2     String?  @map("address_line2")
  city             String?
  state            String?
  zip              String?

  phone            String?
  email            String?

  employer         String?
  occupation       String?
  occupationOther  String?  @map("occupation_other")

  externalContributorId String? @map("external_contributor_id")

  createdAt        DateTime @default(now()) @map("created_at")
  updatedAt        DateTime @updatedAt @map("updated_at")

  contributions    CampaignContribution[]

  @@map("contacts")
  @@schema("campaign")
}

model CampaignContribution {
  id                 String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  contributionDate   DateTime @db.Date @map("contribution_date")
  amount             Decimal  @db.Numeric(12,2)

  contributionType   String   @map("contribution_type")
  electionType       String   @map("election_type")
  contributorType    String   @map("contributor_type")
  description        String?

  status             String
  source             String
  validationErrors   Json     @map("validation_errors")

  contactId          String   @db.Uuid @map("contact_id")
  contact            CampaignContact @relation(fields: [contactId], references: [id])

  externalContributionId String @unique @map("external_contribution_id")
  filingEntityId         String? @map("filing_entity_id")

  createdAt          DateTime @default(now()) @map("created_at")
  updatedAt          DateTime @updatedAt @map("updated_at")

  @@map("contributions")
  @@schema("campaign")
}

model CampaignContributionReturn {
  id                        String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  externalReturnContributionId String @unique @map("external_return_contribution_id")
  externalContributionId       String @map("external_contribution_id")

  contributionReturnDate     DateTime @db.Date @map("contribution_return_date")
  contributionReturnAmount   Decimal  @db.Numeric(12,2) @map("contribution_return_amount")
  contributionReturnReason   String?  @map("contribution_return_reason")

  createdAt                DateTime @default(now()) @map("created_at")
  updatedAt                DateTime @updatedAt @map("updated_at")

  @@map("contribution_returns")
  @@schema("campaign")
}
```

**Acceptance**
- `npx prisma generate` succeeds.

**Commit**
- `feat(phase-2): prisma contrib models`

---

## P2-03 — SOS schema module + dropdown sources (single source of truth)
**Status:** NOT_STARTED

**Create**
- `apps/campaign_compliance/lib/sos-schema.ts`
  - exports arrays: `SOS_COLUMNS.contributions`, etc. (copy from “Locked SOS export schema” at top)
- `apps/campaign_compliance/lib/dropdowns.ts`
  - MVP dropdown values (until we ingest official enumerations)
  - must include:
    - contributionType options
    - contributorType options
    - electionType options

**Rule**
- UI dropdowns pull ONLY from `dropdowns.ts` (no hardcoded inline arrays).

**Commit**
- `feat(phase-2): sos schema + dropdown sources`

---

## P2-04 — Contacts API (search + create) + ContactPicker
**Status:** NOT_STARTED

**Create routes**
- `apps/campaign_compliance/app/api/contacts/route.ts`
  - `GET ?q=` returns top 15 matches by:
    - orgName ILIKE
    - lastName ILIKE
    - email ILIKE
  - `POST` creates a contact with minimal validation:
    - person: require first+last
    - org: require orgName

**Create component**
- `apps/campaign_compliance/components/ContactPicker.tsx`
  - input field with debounce search (300ms)
  - dropdown list
  - “Create new” inline panel with:
    - contact type toggle
    - minimum fields
    - address block (line1/city/state/zip)

**Acceptance**
- User can create a new contact and select it in one flow.

**Commit**
- `feat(phase-2): contacts api + picker`

---

## P2-05 — Contributions API + ExternalContributionID generator
**Status:** NOT_STARTED

**Create routes**
- `apps/campaign_compliance/app/api/contributions/route.ts`:
  - GET recent: `?limit=20`
  - POST create
- `apps/campaign_compliance/app/api/contributions/[id]/route.ts`:
  - GET by id
  - PUT update (must not allow changing externalContributionId)

**ExternalContributionID algorithm**
- On create:
  - `EXTCONTRIB-YYYYMMDD-<8char>` where `<8char>` = random base36
- Store it; never change it.

**Commit**
- `feat(phase-2): contributions api + external id`

---

## P2-06 — Validation engine: contributions
**Status:** NOT_STARTED

**Create**
- `apps/campaign_compliance/lib/validators/contributions.ts`

**validateContribution(record, contact, settings)**
Must return:
```ts
type ValidationResult = {
  ok: boolean;
  errors: { field: string; message: string; severity: "blocker" | "warning" }[];
};
```

**Blockers for READY**
- amount > 0
- contribution_date present
- election_type present
- contribution_type present
- contributor_type present
- contact exists and:
  - person: first+last
  - org: org_name
- address_line1/city/state/zip present (treat as blockers for MVP unless SOS confirms otherwise)

**Status transitions**
- Save Draft: status stays draft; store warnings but do not block
- Save Ready:
  - if ok → READY and clear blockers
  - else → FLAGGED and store errors in validation_errors

**Commit**
- `feat(phase-2): contrib validators`

---

## P2-07 — Contribution wizard UI (5-step, minimal)
**Status:** NOT_STARTED

**Implement**
- `apps/campaign_compliance/app/contributions/new/page.tsx`
- `apps/campaign_compliance/components/wizard/WizardFrame.tsx` (shared for expenses later)

**Steps**
1) Amount + Date
2) Contributor (ContactPicker)
3) Classification (dropdowns)
4) Description (optional)
5) Review (checklist) + Save Draft / Save Ready

**Acceptance**
- No step shows more than ~6 fields.
- “Save Ready” triggers validator and returns either success or flags.

**Commit**
- `feat(phase-2): contribution wizard`

---

## P2-08 — Contributions list + detail/edit
**Status:** NOT_STARTED

**List page**
- `apps/campaign_compliance/app/contributions/page.tsx`
  - shows last 20 contributions
  - columns: date | name | amount | status pill
  - clicking row opens detail

**Detail page**
- `apps/campaign_compliance/app/contributions/[id]/page.tsx`
  - read-only view + “Edit” toggle
  - Save Draft / Save Ready buttons
  - validation checklist displayed

**Commit**
- `feat(phase-2): contributions list+detail`

---

## P2-09 — Phase 2 doc update
**Status:** NOT_STARTED  
Commit: `docs(phase-2): status updates`

**Phase 2 Status:** IMPLEMENTATION COMPLETE  
**Runtime Status:** BLOCKED UNTIL DATABASE_URL PROVIDED  
**Notes:** Local SQLite configuration permitted for Phase 2 validation only.


**Build Status:** NOT_STARTED

## Phase 3 outcome
Candidate can:
1) Enter an expense via a 5-step wizard
2) Review/edit expenses
3) View an **Analysis** page with drilldowns:
   - by month
   - by category
   - by type
   - by payee
   - largest line items

System can:
- Accept expenses from Travel commits (Phase 4) and enforce read-only in Expenses UI for those rows.

---

## P3-01 — FILE_AUTHORED (execution deferred) — SQL: expenses + expenditure_returns (full DDL)
**Status:** NOT_STARTED

**Create file**
- `db/sql/008_campaign_expenses.sql`

**DDL (copy/paste; keep idempotent where practical)**
```sql
-- 008_campaign_expenses.sql
CREATE SCHEMA IF NOT EXISTS campaign;

-- Expenses
CREATE TABLE IF NOT EXISTS campaign.expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  expenditure_date date NOT NULL,
  amount numeric(12,2) NOT NULL CHECK (amount >= 0),

  expenditure_type text NOT NULL,
  election_type text,

  expenditure_category text NOT NULL,
  expenditure_category_other_description text,

  -- SOS fields / mapping helpers
  payee_type text,                  -- PERSON | ORGANIZATION (kept as text to match SOS dropdowns)
  external_payee_id text,           -- optional SOS external payee id
  filing_entity_id text,            -- pulled from settings on export

  description text,

  status campaign.record_status NOT NULL DEFAULT 'draft',
  source campaign.source NOT NULL DEFAULT 'manual',
  validation_errors jsonb NOT NULL DEFAULT '[]'::jsonb,

  contact_id uuid REFERENCES campaign.contacts(id) ON DELETE SET NULL,

  external_expenditure_id text UNIQUE, -- generated once on create

  linked_travel_trip_id uuid,          -- set when source='travel'

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Update timestamp trigger (reuse pattern if repo already has one; otherwise create a local one)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'set_updated_at_campaign') THEN
    CREATE FUNCTION set_updated_at_campaign()
    RETURNS trigger AS $f$
    BEGIN
      NEW.updated_at = now();
      RETURN NEW;
    END
    $f$ LANGUAGE plpgsql;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'tg_campaign_expenses_updated_at'
  ) THEN
    CREATE TRIGGER tg_campaign_expenses_updated_at
    BEFORE UPDATE ON campaign.expenses
    FOR EACH ROW EXECUTE FUNCTION set_updated_at_campaign();
  END IF;
END $$;

-- Expenditure returns (future SOS sheet; minimal now)
CREATE TABLE IF NOT EXISTS campaign.expenditure_returns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  external_return_expenditure_id text UNIQUE,
  external_expenditure_id text NOT NULL,

  expenditure_return_date date NOT NULL,
  expenditure_return_amount numeric(12,2) NOT NULL CHECK (expenditure_return_amount >= 0),
  expenditure_return_reason text,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'tg_campaign_expenditure_returns_updated_at'
  ) THEN
    CREATE TRIGGER tg_campaign_expenditure_returns_updated_at
    BEFORE UPDATE ON campaign.expenditure_returns
    FOR EACH ROW EXECUTE FUNCTION set_updated_at_campaign();
  END IF;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_campaign_expenses_date ON campaign.expenses(expenditure_date);
CREATE INDEX IF NOT EXISTS idx_campaign_expenses_status ON campaign.expenses(status);
CREATE INDEX IF NOT EXISTS idx_campaign_expenses_category ON campaign.expenses(expenditure_category);
CREATE INDEX IF NOT EXISTS idx_campaign_expenses_type ON campaign.expenses(expenditure_type);
CREATE INDEX IF NOT EXISTS idx_campaign_expenses_contact ON campaign.expenses(contact_id);
CREATE INDEX IF NOT EXISTS idx_campaign_expenses_source ON campaign.expenses(source);
```

**Acceptance**
- Script runs twice with no errors.
- `campaign.expenses` exists and accepts inserts.
- Indexes appear in `pg_indexes`.

**Commit**
- `chore(phase-3): expenses sql`
# PHASE 3 — Expenses + Spending Drilldowns (MICRO+)
**Build Status:** NOT_STARTED  
**Guard Mode:** STRICT (plan_guard must remain green at every step)

---

## Phase 3 outcome
Candidate can:
1) Enter an expense via a 5-step wizard  
2) Review/edit expenses  
3) View an **Analysis** page with drilldowns:
   - by month
   - by category
   - by type
   - by payee
   - largest line items

System can:
- Accept expenses from Travel commits (Phase 4)
- Enforce **read-only** behavior in Expenses UI for travel-sourced rows

---

## Phase 3 operating rules (non-negotiable)
- Execute **one P3 item at a time**
- Only touch files explicitly listed in that P3 item
- Run `node scripts/plan_guard.js`:
  - before starting each P3 item
  - after completing each P3 item
- `.env` is local-only and never committed
- If runtime is blocked prior to P3-01 — FILE_AUTHORED (execution deferred), that is acceptable

---

## P3-01 — FILE_AUTHORED (execution deferred) — SQL: expenses + expenditure_returns (full DDL)
**Status:** NOT_STARTED

### Files
- `db/sql/008_campaign_expenses.sql`

### Steps
1) Run plan guard (must be clean)
   ```bash
   node scripts/plan_guard.js
## P3-01 — FILE_AUTHORED (execution deferred) — SQL: expenses + expenditure_returns (full DDL)
**Status:** FILE_AUTHORED (execution deferred)

--**Notes:**
- SQL file authored and verified on disk
- Execution deferred until database initialization (P3-01 — FILE_AUTHORED (execution deferred) execution step)
-

## P3-02 — DONE — Prisma models: CampaignExpense + CampaignExpenditureReturn (exact blocks)
**Status:** NOT_STARTED

**Edit**
- `db/prisma/schema.prisma`

**Add**
```prisma
model CampaignExpense {
  id                                 String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid

  expenditureDate                    DateTime @map("expenditure_date") @db.Date
  amount                             Decimal  @db.Decimal(12, 2)

  expenditureType                    String   @map("expenditure_type")
  electionType                       String?  @map("election_type")

  expenditureCategory                String   @map("expenditure_category")
  expenditureCategoryOtherDescription String? @map("expenditure_category_other_description")

  payeeType                          String?  @map("payee_type")
  externalPayeeId                    String?  @map("external_payee_id")
  filingEntityId                     String?  @map("filing_entity_id")

  description                        String?

  status                             String   @default("draft") @map("status")
  source                             String   @default("manual") @map("source")
  validationErrors                   Json     @default("[]") @map("validation_errors")

  contactId                          String?  @map("contact_id") @db.Uuid
  contact                            CampaignContact? @relation(fields: [contactId], references: [id])

  externalExpenditureId              String?  @unique @map("external_expenditure_id")

  linkedTravelTripId                 String?  @map("linked_travel_trip_id") @db.Uuid

  createdAt                          DateTime @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt                          DateTime @updatedAt @map("updated_at") @db.Timestamptz(6)

  @@map("expenses")
  @@schema("campaign")
}

model CampaignExpenditureReturn {
  id                         String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid

  externalReturnExpenditureId String? @unique @map("external_return_expenditure_id")
  externalExpenditureId       String  @map("external_expenditure_id")

  expenditureReturnDate       DateTime @map("expenditure_return_date") @db.Date
  expenditureReturnAmount     Decimal  @map("expenditure_return_amount") @db.Decimal(12,2)
  expenditureReturnReason     String?  @map("expenditure_return_reason")

  createdAt                   DateTime @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt                   DateTime @updatedAt @map("updated_at") @db.Timestamptz(6)

  @@map("expenditure_returns")
  @@schema("campaign")
}
```

**Acceptance**
- `npx prisma generate` succeeds.
- You can `prisma.campaignExpense.findMany()`.

**Commit**
- `feat(phase-3): prisma expense models`

---

## P3-03 — DONE — Expenses API (create/list/update) + ExternalExpenditureID generator
**Status:** NOT_STARTED

### Files
- `apps/campaign_compliance/app/api/expenses/route.ts`
- `apps/campaign_compliance/app/api/expenses/[id]/route.ts`

### API contract
**GET /api/expenses?limit=20**
Returns:
```json
{ "items": [ { "id": "...", "expenditureDate": "YYYY-MM-DD", "amount": "123.45", "payeeName": "...", "expenditureCategory": "...", "status": "draft" } ] }
```

**POST /api/expenses**
Body:
```json
{
  "expenditureDate":"YYYY-MM-DD",
  "amount":123.45,
  "contactId":"uuid",
  "expenditureType":"string",
  "expenditureCategory":"string",
  "expenditureCategoryOtherDescription":"string|null",
  "electionType":"string|null",
  "description":"string|null",
  "saveAs":"draft|ready"
}
```

### ExternalExpenditureID generator (create-time only)
- Format: `EXTEXP-YYYYMMDD-XXXXXXXX` (8 chars base36)
- Stored in `external_expenditure_id`
- Never changes

### Update rules (PUT)
- If `source == "travel"` then reject edits with 409 and message: “Travel-created expenses must be edited from Travel.”

**Commit**
- `feat(phase-3): expenses api`

---

## P3-04 — DONE — Expense validator + status transitions (exact rules)
**Status:** NOT_STARTED

**Edit**
- `apps/campaign_compliance/lib/validators.ts`

**Implement**
`validateExpense(expense, contact, settings) -> { ok: boolean, errors: {field,message}[] }`

**READY requires**
- `amount > 0`
- `expenditureDate` present
- `expenditureType` present
- `expenditureCategory` present
- If category == "Other": `expenditureCategoryOtherDescription` present
- Payee:
  - if contactType == person: first+last
  - if org: org_name
- Address minimum (if SOS requires for payee):
  - line1, city, state, zip

**Status transition logic**
- `saveAs=draft` → status `draft`, store `validation_errors=[]`
- `saveAs=ready`:
  - if ok → status `ready`, `validation_errors=[]`
  - else → status `flagged`, `validation_errors=[...]`

**Commit**
- `feat(phase-3): expense validators`

---

## P3-05 — IN_PROGRESS (wizard deferred) — Expense UI: wizard + recent list + detail
**Status:** NOT_STARTED

### Files
- `apps/campaign_compliance/app/expenses/page.tsx` (Recent 20)
- `apps/campaign_compliance/app/expenses/new/page.tsx` (Wizard)
- `apps/campaign_compliance/app/expenses/[id]/page.tsx` (Detail/Edit)

### Expenses home UI (minimal)
- Primary button: Add Expense
- Recent list columns (not a big table; simple list rows):
  - Date, Payee, Amount, Category, StatusPill

### Wizard (5 screens; same structure as contributions)
1) Amount + Date
2) Payee (ContactPicker)
3) Classification (type/category/election)
4) Description
5) Review + Save Draft/Ready

### Detail/Edit page
- Shows all fields
- Shows validation checklist
- Edit allowed only if `source != travel`

**Commit**
- `feat(phase-3): expense ui`

---

## P3-06 — DONE — Spending Analysis Drilldown page (full spec)
**Status:** NOT_STARTED

### Files
- `apps/campaign_compliance/app/expenses/analysis/page.tsx`
- `apps/campaign_compliance/app/api/expenses/analysis/route.ts`
- `apps/campaign_compliance/lib/analysis.ts` (shared calculations)

### API request
`GET /api/expenses/analysis?start=YYYY-MM-DD&end=YYYY-MM-DD`

### API response shape (exact)
```json
{
  "range": { "start":"YYYY-MM-DD", "end":"YYYY-MM-DD" },
  "totals": { "count": 0, "amount": 0 },
  "byMonth": [ { "month":"2025-11", "count": 0, "amount": 0 } ],
  "byCategory": [ { "key":"Travel", "count": 0, "amount": 0 } ],
  "byType": [ { "key":"Reimbursement", "count": 0, "amount": 0 } ],
  "byPayee": [ { "key":"Acme Printing", "count": 0, "amount": 0 } ],
  "largestItems": [ { "id":"...", "date":"YYYY-MM-DD", "payee":"...", "category":"...", "amount": 0 } ]
}
```

### SQL aggregation (server-side; use Prisma raw or groupBy)
Recommended SQL for Postgres:
```sql
-- byMonth
SELECT to_char(expenditure_date, 'YYYY-MM') AS month,
       count(*)::int AS count,
       sum(amount)::numeric(12,2) AS amount
FROM campaign.expenses
WHERE expenditure_date BETWEEN $1 AND $2
GROUP BY 1
ORDER BY 1;

-- byCategory
SELECT expenditure_category AS key,
       count(*)::int AS count,
       sum(amount)::numeric(12,2) AS amount
FROM campaign.expenses
WHERE expenditure_date BETWEEN $1 AND $2
GROUP BY 1
ORDER BY amount DESC;

-- largestItems
SELECT e.id, e.expenditure_date, e.amount, e.expenditure_category,
       COALESCE(c.org_name, trim(c.first_name || ' ' || c.last_name)) AS payee
FROM campaign.expenses e
LEFT JOIN campaign.contacts c ON c.id = e.contact_id
WHERE e.expenditure_date BETWEEN $1 AND $2
ORDER BY e.amount DESC
LIMIT 50;
```

### UI requirements (drilldown)
- Date range picker (default: current month)
- Summary cards: Total spend, Count
- Tabs/sections:
  - By Month (click month → filters list)
  - By Category (click category → filters list)
  - By Payee (click payee → filters list)
  - Largest Items list with search
- “Export analysis as CSV” (optional in Phase 3; allowed if easy)

**Commit**
- `feat(phase-3): spending analysis`

---

## P3-07 — NOT_STARTED — Phase 3 doc update
**Status:** NOT_STARTED
Commit: `docs(phase-3): status updates`

# PHASE 4 — Travel log + timeline + commit (MICRO+)
**Build Status:** NOT_STARTED

## Phase 4 outcome
Candidate can:
- Enter a trip (odometer-based)
- See a clean chronological **Timeline**
- Click **Commit as Expense** to create a locked, linked expense row

---

## P4-01 — SQL: travel_trips (full DDL)
**Status:** NOT_STARTED

**Create file**
- `db/sql/009_campaign_travel.sql`

```sql
-- 009_campaign_travel.sql
CREATE SCHEMA IF NOT EXISTS campaign;

CREATE TABLE IF NOT EXISTS campaign.travel_trips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  trip_date date NOT NULL,

  start_odometer numeric(12,2) NOT NULL,
  end_odometer numeric(12,2) NOT NULL,
  miles numeric(12,2) NOT NULL,
  rate_per_mile numeric(6,2) NOT NULL DEFAULT 0.70,
  amount numeric(12,2) NOT NULL,

  start_location text NOT NULL,
  end_location text NOT NULL,

  purpose text,
  notes text,

  status campaign.travel_status NOT NULL DEFAULT 'draft',

  committed_expense_id uuid, -- link after commit

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT chk_odometer_order CHECK (end_odometer >= start_odometer),
  CONSTRAINT chk_miles_nonneg CHECK (miles >= 0),
  CONSTRAINT chk_amount_nonneg CHECK (amount >= 0)
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'tg_campaign_travel_trips_updated_at'
  ) THEN
    CREATE TRIGGER tg_campaign_travel_trips_updated_at
    BEFORE UPDATE ON campaign.travel_trips
    FOR EACH ROW EXECUTE FUNCTION set_updated_at_campaign();
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_campaign_travel_date ON campaign.travel_trips(trip_date);
CREATE INDEX IF NOT EXISTS idx_campaign_travel_status ON campaign.travel_trips(status);
```

**Acceptance**
- Insert works.
- Constraints block end < start.

**Commit**
- `chore(phase-4): travel sql`

---

## P4-02 — Prisma model: CampaignTravelTrip
**Status:** NOT_STARTED

**Add**
```prisma
model CampaignTravelTrip {
  id               String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid

  tripDate          DateTime @map("trip_date") @db.Date
  startOdometer     Decimal  @map("start_odometer") @db.Decimal(12,2)
  endOdometer       Decimal  @map("end_odometer") @db.Decimal(12,2)
  miles             Decimal  @db.Decimal(12,2)
  ratePerMile       Decimal  @map("rate_per_mile") @db.Decimal(6,2)
  amount            Decimal  @db.Decimal(12,2)

  startLocation     String   @map("start_location")
  endLocation       String   @map("end_location")

  purpose           String?
  notes             String?

  status            String   @default("draft")
  committedExpenseId String? @map("committed_expense_id") @db.Uuid

  createdAt         DateTime @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt         DateTime @updatedAt @map("updated_at") @db.Timestamptz(6)

  @@map("travel_trips")
  @@schema("campaign")
}
```

**Commit**
- `feat(phase-4): prisma travel model`

---

## P4-03 — Travel API + commit endpoint (exact)
**Status:** NOT_STARTED

### Files
- `apps/campaign_compliance/app/api/travel/route.ts` (GET list, POST create)
- `apps/campaign_compliance/app/api/travel/[id]/route.ts` (GET/PUT)
- `apps/campaign_compliance/app/api/travel/[id]/commit/route.ts` (POST commit)

### Create rules
- Calculate:
  - `miles = endOdometer - startOdometer`
  - `ratePerMile = settings.mileageRate`
  - `amount = miles * ratePerMile`
- If end < start, return 400 with validation errors.

### Commit rules (POST /commit)
1) Load trip
2) Validate trip (see P4-04)
3) Create expense in `campaign.expenses`:
   - source = 'travel'
   - linked_travel_trip_id = trip.id
   - amount = trip.amount
   - expenditure_date = trip.trip_date
   - expenditure_category = 'Travel'
   - expenditure_type = 'Reimbursement' (or from dropdown; MVP hardcode ok)
   - description = `Mileage reimbursement: {from} → {to} ({miles} mi @ ${rate})`
   - status = 'ready' **only if** payee is valid (see Settings requirement below)
4) Update trip:
   - status = 'committed'
   - committed_expense_id = expense.id
5) Return {trip, expense}

### Settings requirement for commit
We need a payee contact to reimburse (candidate/committee).
MVP rule:
- Add to settings (Phase 1 or here if missing):
  - `defaultMileagePayeeContactId` (uuid)
If missing, commit returns 409 “Set Mileage Payee in Settings”.

**Commit**
- `feat(phase-4): travel api + commit`

---

## P4-04 — Travel validation
**Status:** NOT_STARTED

**Add**
- `validateTravelTrip(trip, settings)`

READY requires:
- trip_date present
- start/end present
- end >= start
- miles > 0
- start_location and end_location present

COMMITTED requires:
- committed_expense_id present

**Commit**
- `feat(phase-4): travel validators`

---

## P4-05 — Travel hub page
**Status:** NOT_STARTED

**File**
- `apps/campaign_compliance/app/travel/page.tsx`

Must show:
- Primary: Add Trip → `/travel/new`
- Secondary: View Timeline → `/travel/timeline`
- Small stats row:
  - Trips this month
  - Miles this month
  - Amount this month
  - Uncommitted count

**Commit**
- `feat(phase-4): travel hub`

---

## P4-06 — Travel intake page (live calc; single screen)
**Status:** NOT_STARTED

**File**
- `apps/campaign_compliance/app/travel/new/page.tsx`

Fields:
- trip_date (default today)
- start_odometer
- end_odometer
- miles (read-only live)
- start_location
- end_location
- purpose (optional)
- amount (read-only live)
Buttons:
- Save Draft
- Save Ready
- Commit as Expense (enabled only if valid + settings has mileage payee)

**Commit**
- `feat(phase-4): travel intake`

---

## P4-07 — Travel timeline page (beautiful chronological)
**Status:** NOT_STARTED

**File**
- `apps/campaign_compliance/app/travel/timeline/page.tsx`

Must include:
- Date range filter
- Status filter
- Group by month toggle
- Totals bar (count, miles, amount, uncommitted)

Timeline cards show:
- Date + StatusPill
- From → To (prominent)
- Odometer start→end
- Miles + Amount (bold)
- Actions:
  - Edit (if not committed)
  - Commit as Expense (if not committed)
  - View linked Expense (if committed)

**Commit**
- `feat(phase-4): travel timeline`

---

## P4-08 — Commit mapping verification (unit tests)
**Status:** NOT_STARTED

**Create**
- `apps/campaign_compliance/lib/__tests__/travelCommit.test.ts` (or repo’s testing approach)

Test cases:
- commit fails without mileage payee set
- commit creates expense with correct amount/date/description
- committed trip becomes read-only

**Commit**
- `test(phase-4): travel commit tests`

---

## P4-09 — Phase 4 doc update
**Status:** NOT_STARTED
Commit: `docs(phase-4): status updates`

# PHASE 5 — Filing prep + HTML + CSV export (MICRO+)
**Build Status:** NOT_STARTED

## Phase 5 outcome
Candidate can:
- Pick a date range
- See readiness summary
- See **Fix Queue** of blockers (only)
- Generate **Final Review HTML**
- Download **SOS-ready CSVs** (exact schema)
- Exports are logged with a hash

---

## P5-01 — SQL: exports + audit_log (full DDL)
**Status:** NOT_STARTED

**Create file**
- `db/sql/010_campaign_exports_audit.sql`

```sql
-- 010_campaign_exports_audit.sql
CREATE SCHEMA IF NOT EXISTS campaign;

-- Export runs
CREATE TABLE IF NOT EXISTS campaign.exports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  export_type campaign.export_type NOT NULL,
  export_format campaign.export_format NOT NULL,

  date_range_start date NOT NULL,
  date_range_end date NOT NULL,

  record_count int NOT NULL DEFAULT 0,
  total_amount numeric(12,2) NOT NULL DEFAULT 0,

  export_hash text NOT NULL, -- sha256 over canonical export payload
  generated_at timestamptz NOT NULL DEFAULT now(),
  notes text
);

CREATE INDEX IF NOT EXISTS idx_campaign_exports_generated_at ON campaign.exports(generated_at);

-- Audit log (minimal but critical)
CREATE TABLE IF NOT EXISTS campaign.audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action text NOT NULL,               -- e.g., CREATE_CONTRIBUTION, UPDATE_EXPENSE, COMMIT_TRAVEL, EXPORT
  entity_type text NOT NULL,          -- contributions | expenses | travel_trips | exports | settings
  entity_id text,                     -- uuid or singleton
  before_state jsonb,
  after_state jsonb,
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_campaign_audit_created ON campaign.audit_log(created_at);
CREATE INDEX IF NOT EXISTS idx_campaign_audit_entity ON campaign.audit_log(entity_type, entity_id);
```

**Commit**
- `chore(phase-5): exports+audit sql`

---

## P5-02 — Preflight engine (blocked queue) (exact algorithm)
**Status:** NOT_STARTED

### Files
- `apps/campaign_compliance/lib/preflight.ts`
- `apps/campaign_compliance/app/api/filing/preflight/route.ts`

### Inputs
```json
{ "start":"YYYY-MM-DD", "end":"YYYY-MM-DD", "include":"contributions|expenditures|both" }
```

### Algorithm
1) Query candidate records in range:
   - Contributions: contribution_date between start/end
   - Expenses: expenditure_date between start/end
2) For each record:
   - If status != ready → blocked
   - Else run validator again (defensive) → if fails → blocked
3) Build summary counts:
   - total, ready, blocked
4) Build Fix Queue list with:
   - entityType (contribution|expense)
   - id
   - date
   - name
   - amount
   - reasons[] (validation errors)
   - fixUrl (route to record detail)
5) Return response:

### Response (exact)
```json
{
  "range": { "start":"YYYY-MM-DD", "end":"YYYY-MM-DD" },
  "readyToExport": false,
  "contributions": { "total":0, "ready":0, "blocked":0, "blockedItems":[] },
  "expenditures": { "total":0, "ready":0, "blocked":0, "blockedItems":[] }
}
```

**Commit**
- `feat(phase-5): preflight`

---

## P5-03 — Filing page UI (linear flow)
**Status:** NOT_STARTED

### File
- `apps/campaign_compliance/app/filing/page.tsx`

### Sections (must appear in this order)
1) Date Range
2) Readiness Summary (after check)
3) Fix Queue (only if blocked > 0)
4) Final Review (only if readyToExport)
5) Download Buttons

### Fix queue interaction
- Clicking “Fix Now” opens record in same tab.
- After fix, user returns and clicks “Check Readiness” again.

**Commit**
- `feat(phase-5): filing ui`

---

## P5-04 — CSV exporters (exact columns/order + mapping table)
**Status:** NOT_STARTED

### Files
- `apps/campaign_compliance/lib/export/csv.ts`
- `apps/campaign_compliance/lib/export/mappers.ts`
- `apps/campaign_compliance/app/api/filing/export/contributions/route.ts`
- `apps/campaign_compliance/app/api/filing/export/expenditures/route.ts`

### Canonical mapping rule
- Exporters must use the locked arrays at top of this file to:
  - define columns
  - define order

### Mapping table: SOS Contributions columns
For each row, define:
- column name
- source field
- transform

**Implement in code as a mapping object**
Example (partial):
```ts
const contributionMap = {
  Actions: () => "I",
  ExternalContributionID: (r) => r.externalContributionId,
  ContributionDate: (r) => formatDate(r.contributionDate),
  ContributionAmount: (r) => num(r.amount),
  ContributorOrganizationName: (r, c) => c.orgName ?? "",
  ContributorFirstName: (r, c) => c.firstName ?? "",
  ...
}
```

### Expense export mapping must include Travel-linked expenses (no special handling beyond source)
- If category == Other, include OtherDescription.

### Export endpoints
- Accept query: `start`, `end`
- Return `text/csv` with filename:
  - `sos_contributions_YYYYMMDD-YYYYMMDD.csv`
  - `sos_expenditures_YYYYMMDD-YYYYMMDD.csv`

**Commit**
- `feat(phase-5): csv exporters`

---

## P5-05 — HTML final review generator (must match dataset exactly)
**Status:** NOT_STARTED

### Files
- `apps/campaign_compliance/lib/export/html.ts`
- `apps/campaign_compliance/app/api/filing/review/route.ts`

### Rule
- The same query and filter used for CSV must be used for HTML.

### HTML requirements
- Print-friendly, clean typography
- Sections:
  - Header: Filing Entity + Date Range
  - Contributions table (if included)
  - Expenditures table (if included)
  - Totals per section
  - Footer: generated timestamp + export hash

**Commit**
- `feat(phase-5): html review`

---

## P5-06 — Export logging + hash (exact)
**Status:** NOT_STARTED

### Files
- `apps/campaign_compliance/lib/export/hash.ts`
- integrate into export endpoints

### Hash algorithm
- Create a canonical JSON payload:
  - selected range
  - sorted records (stable sort: date asc, externalId asc)
  - mapped export rows (arrays of strings)
- SHA-256 over UTF-8 bytes of that JSON string

Store export run:
- export_type
- export_format
- date_range_start/end
- record_count
- total_amount
- export_hash

**Commit**
- `feat(phase-5): export logging+hash`

---

## P5-07 — Phase 5 doc update
**Status:** NOT_STARTED
Commit: `docs(phase-5): status updates`

# PHASE 6 — Hardening + packaging (MICRO+)
**Build Status:** NOT_STARTED

## Phase 6 outcome
- The tool is safe to use for real compliance work.
- It is calm, forgiving, and sellable.
- It has an audit trail and clear error handling.
- It can be dropped into another repo/db with minimal changes.

---

## P6-01 — Audit helper + wiring (exact)
**Status:** NOT_STARTED

### Files
- `apps/campaign_compliance/lib/audit.ts`
- Wire into:
  - settings save
  - contribution create/update
  - expense create/update
  - travel create/update/commit
  - exports (CSV/HTML)

### API
`logAudit({action, entityType, entityId, before, after, meta})`

**Acceptance**
- Every create/update/commit/export writes one row to `campaign.audit_log`.

**Commit**
- `feat(phase-6): audit helper`

---

## P6-02 — Confirmation prompts for commit/export (exact UX)
**Status:** NOT_STARTED

### Add confirm modal component
- `apps/campaign_compliance/components/ConfirmDialog.tsx`

### Required confirmations
- Travel commit:
  - “This will create an expense and lock this trip. Continue?”
- Export:
  - “This will generate an SOS file for upload. Continue?”

**Commit**
- `feat(phase-6): confirmations`

---

## P6-03 — Empty states + friendly errors (every page)
**Status:** NOT_STARTED

### Empty states
- contributions: “No contributions yet” + CTA Add
- expenses: “No expenses yet” + CTA Add
- travel: “No trips yet” + CTA Add
- filing: “No records found in range” + CTA adjust range

### Errors
- Replace thrown errors with user-safe messages:
  - “Database connection not configured.”
  - “Could not save your changes. Please retry.”

**Commit**
- `feat(phase-6): empty states`

---

## P6-04 — Performance pass (pagination + indexes)
**Status:** NOT_STARTED

### Pagination rules
- recent lists: limit 20
- timeline: limit 200 with load-more
- analysis: aggregated queries only (no heavy row fetch unless user clicks through)

### DB index checklist
- expenses: date, category, type, status, contact_id
- contributions: date, status, contact_id
- travel: date, status
- exports: generated_at
- audit_log: created_at, (entity_type, entity_id)

**Commit**
- `perf(phase-6): pagination+indexes`

---

## P6-05 — Packaging docs for sale (install + env + schema)
**Status:** NOT_STARTED

### Create
- `apps/campaign_compliance/README.md`

Must include:
- Requirements (Postgres, Prisma)
- How to run locally
- How to deploy (Netlify)
- Required env vars:
  - DATABASE_URL
  - (future) OPENAI_API_KEY
- DB bootstrap steps:
  - run SQL scripts 006–010 in order
  - run prisma generate

**Commit**
- `docs(phase-6): packaging`

---

## P6-06 — Finalize master_build statuses
**Status:** NOT_STARTED

- All steps marked DONE/BLOCKED accurately
- Build map shows 100% DONE
- No undocumented deviations

**Commit**
- `docs: finalize master_build`

---

# FUTURE (planned; not MVP)
## Phase 7 — SOS paperwork library + local search + OpenAI assistant
- Ingest PDFs + forms into local searchable library
- RAG “Ask compliance” panel
- Store only embeddings + doc references (no PII sent unless user triggers)

## Phase 8 — CAB export (if SOS portal requires)
- Confirm SOS portal requirements and implement CAB builder