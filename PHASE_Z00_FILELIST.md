# PHASE_Z00_FILELIST.md — Recovery Alignment + Green Plan Guard (ZIP 00)
**Status:** IN_PROGRESS  
**Guard Mode:** STRICT (plan_guard must be green at end)  
**Goal:** Repo is recoverable from scratch; plan_guard passes with zero missing required paths and zero drift.

## Scope (what this zip does)
- Create any **missing required baseline paths** demanded by `master_build.md`.
- Do **not** add features, refactors, or new architecture.
- Only make the smallest changes needed to make `node scripts/plan_guard.js` pass.

## Allowed paths to create/edit in this zip
- `apps/campaign_compliance/docs/screens/` (folder only)
- `apps/campaign_compliance/next-env.d.ts`
- `apps/public_site/README.md` (placeholder only)
- (Optional evidence only) `.plan_guard/manifest.json` (auto-generated)

> Do not edit `master_build.md` in Z00.

## Commands (run in this order)
1) Confirm you are at repo root (must contain `.git`, `apps/`, `scripts/`)
   - `pwd` (should end with `...\Compliance\Compliance`)
2) Create required paths (PowerShell)
   ```powershell
   mkdir -Force apps\campaign_compliance\docs\screens | Out-Null

   @'
   /// <reference types="next" />
   /// <reference types="next/image-types/global" />

   // NOTE: This file should not be edited.
   // See https://nextjs.org/docs/basic-features/typescript for more information.
   '@ | Set-Content -Encoding UTF8 apps\campaign_compliance\next-env.d.ts

   mkdir -Force apps\public_site | Out-Null
   "Placeholder. public_site is referenced by master_build.md as baseline alignment." | Set-Content -Encoding UTF8 apps\public_site\README.md
