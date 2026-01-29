# PHASE_2_FILELIST.md — Authoritative Checklist (Freeze List)
**Phase:** 2 — Contributions + Contacts  
**Rule:** Only create/update files listed here during Phase 2. Anything else is drift.

## P2-01 — SQL DDL
- db/sql/007_campaign_contrib.sql

## P2-02 — Prisma models
- db/prisma/schema.prisma

## P2-03 — SOS schema + dropdown sources
- apps/campaign_compliance/lib/sos-schema.ts
- apps/campaign_compliance/lib/dropdowns.ts

## P2-04 — Contacts API + ContactPicker
- apps/campaign_compliance/app/api/contacts/route.ts
- apps/campaign_compliance/components/ContactPicker.tsx

## P2-05 — Contributions API + ExternalContributionID generator
- apps/campaign_compliance/app/api/contributions/route.ts
- apps/campaign_compliance/app/api/contributions/[id]/route.ts

## P2-06 — Validation engine: contributions
- apps/campaign_compliance/lib/validators/contributions.ts
- apps/campaign_compliance/lib/validators.ts

## P2-07 — Contribution wizard UI (5-step)
- apps/campaign_compliance/app/contributions/new/page.tsx
- apps/campaign_compliance/components/wizard/WizardFrame.tsx

## P2-08 — Contributions list + detail/edit
- apps/campaign_compliance/app/contributions/page.tsx
- apps/campaign_compliance/app/contributions/[id]/page.tsx

## P2-09 — Doc update
- master_build.md
