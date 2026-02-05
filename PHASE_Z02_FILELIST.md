# PHASE_Z02_FILELIST.md — Home + Primary Actions (ZIP 02)
**Status:** IN_PROGRESS  
**Guard Mode:** STRICT (plan_guard must be green at end)  
**Goal:** Home page implements the 4-card primary action hub using `PrimaryActionCard`. No DB wiring yet.

## Scope
- Add `PrimaryActionCard` component.
- Update Home page to render exactly 4 primary action cards.
- Keep NavBar + PageShell consistent (no duplicate NavBars).
- Keep plan_guard green.

## Allowed paths to create/edit in this zip
- `apps/campaign_compliance/app/page.tsx`
- `apps/campaign_compliance/components/PrimaryActionCard.tsx`
- `apps/campaign_compliance/components/NavBar.tsx` (only if needed to prevent duplicates / broken links)
- `apps/campaign_compliance/components/PageShell.tsx` (only if needed to prevent duplicates)

## Home page spec (non-negotiable)
Home renders exactly 4 cards:
1) Contributions → `/contributions`
2) Expenses → `/expenses`
3) Travel → `/travel`
4) Filing → `/filing`

Each card includes:
- title
- short description
- CTA label (“Open” is fine)
- href

## Commands
- `node scripts/plan_guard.js`
- `npm run app:dev` (from repo root) OR `cd apps/campaign_compliance && npm run dev`
- `node scripts/plan_guard.js` (again)

## Acceptance
- Home loads and shows 4 action cards.
- Each card navigates correctly.
- No duplicate NavBars.
- plan_guard green.

## Overlay Zip
- Create zip to apply over repo root (do not commit the zip).
