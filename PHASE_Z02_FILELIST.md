\# PHASE\_Z02\_FILELIST.md — Core UI Components + Minimal Home (ZIP 02)

\*\*Status:\*\* NOT\_STARTED  

\*\*Guard Mode:\*\* STRICT (plan\_guard must remain green)  

\*\*Goal:\*\* Add the minimal reusable UI components and update Home to the exact 4-card spec. No extra UI kits, no charts, no dashboards.



---



\## Scope (what this zip does)

\- Create the core UI components required by the plan:

&nbsp; - Button (primary/secondary)

&nbsp; - Field (label + helper + error)

&nbsp; - PrimaryActionCard (clickable card)

&nbsp; - StatusPill (DRAFT/READY/FLAGGED)

\- Update Home page to show ONLY the required title/subtitle and 4 action cards.



\## Out of scope (do NOT do in Z02)

\- No API routes

\- No DB wiring

\- No validation logic

\- No lists/tables beyond the 4 cards on Home

\- No additional components or design systems



---



\## Allowed paths to create/edit (ONLY these)

\### Create

\- `apps/campaign\_compliance/components/Button.tsx`

\- `apps/campaign\_compliance/components/Field.tsx`

\- `apps/campaign\_compliance/components/PrimaryActionCard.tsx`

\- `apps/campaign\_compliance/components/StatusPill.tsx`



\### Edit (minimal edits only)

\- `apps/campaign\_compliance/components/NavBar.tsx` (only if needed for link/text correctness)

\- `apps/campaign\_compliance/components/PageShell.tsx` (only if needed to support title/subtitle layout)

\- `apps/campaign\_compliance/app/page.tsx`



---



\## Component requirements (exact)



\### Button.tsx

\- Exports: `Button`

\- Props:

&nbsp; - `variant?: "primary" | "secondary"`

&nbsp; - `type?: "button" | "submit"`

&nbsp; - `disabled?: boolean`

&nbsp; - `onClick?: () => void`

&nbsp; - `children: React.ReactNode`

\- Must be usable inside forms.

\- No icons required.



\### Field.tsx

\- Exports: `Field`

\- Props:

&nbsp; - `label: string`

&nbsp; - `helperText?: string`

&nbsp; - `error?: string`

&nbsp; - `children: React.ReactNode` (input/select/textarea passed in)

\- Shows label above, helper below (small), error below (red text).



\### PrimaryActionCard.tsx

\- Exports: `PrimaryActionCard`

\- Props:

&nbsp; - `title: string`

&nbsp; - `description: string`

&nbsp; - `href: string`

\- Entire surface is clickable via Next Link.

\- Title 1 line; description 1 line.



\### StatusPill.tsx

\- Exports: `StatusPill`

\- Input:

&nbsp; - `status: "DRAFT" | "READY" | "FLAGGED" | string`

\- Must display readable pill:

&nbsp; - DRAFT, READY, FLAGGED

\- No fancy colors required; simple border/background ok.



---



\## Home page spec (must match master\_build exactly)



Home must show ONLY:

\- Title: \*\*“Campaign Compliance”\*\*

\- Subtitle: \*\*“Enter contributions and expenses, track mileage, then download SOS-ready files.”\*\*

\- Four cards:

&nbsp; 1) Add Contribution → `/contributions/new`

&nbsp; 2) Add Expense → `/expenses/new`

&nbsp; 3) Travel Log → `/travel/timeline`

&nbsp; 4) Prepare Filing → `/filing`



No other panels/tables.



---



\## Commands (run in this order)

1\) Pre-check plan guard

&nbsp;  - `node scripts/plan\_guard.js`

2\) Run dev server

&nbsp;  - `cd apps/campaign\_compliance \&\& npm run dev`

3\) Manual acceptance check

&nbsp;  - Home shows only 4 cards + title/subtitle

&nbsp;  - Cards navigate correctly

4\) Post-check plan guard

&nbsp;  - `cd ../.. \&\& node scripts/plan\_guard.js`



---



\## Acceptance (must all be true)

\- `node scripts/plan\_guard.js` is ✅ green.

\- Home page matches the 4-card spec with no extra UI.

\- Components compile with TypeScript.

\- No new components exist besides the 4 listed.

\- All pages still render inside PageShell.



---



\## Commit (exact)

\- `feat(phase-1): core components`



---



\## Overlay zip (DO NOT COMMIT ZIP)

Create a zip after commit+push, stored locally under `overlays/`.



```powershell

mkdir -Force overlays | Out-Null

$zip="overlays\\compliance\_Z02\_core\_components\_{0}.zip" -f (Get-Date -Format "yyyyMMdd-HHmmss")

Compress-Archive -DestinationPath $zip -Force -Path @(

&nbsp; "PHASE\_Z02\_FILELIST.md",

&nbsp; "apps/campaign\_compliance/components/Button.tsx",

&nbsp; "apps/campaign\_compliance/components/Field.tsx",

&nbsp; "apps/campaign\_compliance/components/PrimaryActionCard.tsx",

&nbsp; "apps/campaign\_compliance/components/StatusPill.tsx",

&nbsp; "apps/campaign\_compliance/app/page.tsx",

&nbsp; "apps/campaign\_compliance/components/PageShell.tsx",

&nbsp; "apps/campaign\_compliance/components/NavBar.tsx"

)

Write-Host "`n✅ Overlay zip created: $zip"



