# PHASE 4 FILELIST
## Strict Enforcement + Hardening (Epoch 2)

This file is the **authoritative ordered checklist** for Phase 4.

Rules:
- One file at a time, in the order listed here.
- Full-file rewrites only (no snippets / diffs).
- Run plan_guard before and after each step.
- No unplanned files under watched roots.

Watched roots:
- apps/campaign_compliance/
- db/sql/
- scripts/

---

## Step 1 — master_build.md (Phase 4 strict epoch contract)
**File:** `master_build.md`

**Acceptance criteria:**
- Declares Epoch 1 vs Epoch 2 governance.
- Defines watched roots + always-plan-bound root docs.
- Includes Phase-scoped enforcement contract (missing is scoped; drift uses full plan allowlist).
- Contains full allowlist index for watched roots (Appendix A).

**Verification:**
- `node scripts/plan_guard.js --repo . --all --report` reports:
  - ✅ none missing
  - ✅ none drift

**Commit:**
- `docs(phase-4): rewrite master_build as strict epoch contract + full plan index`

---

## Step 2 — PROTOCOLS.md (strict enforcement rules)
**File:** `PROTOCOLS.md`

**Acceptance criteria:**
- Includes Epoch model (Phase 4+ strict enforcement).
- Phase-scoped enforcement default is documented.
- Legacy handling (LEGACY_READONLY unless claimed) is documented.
- No-snippets + full-file rewrite rule is documented.

**Verification:**
- `node scripts/plan_guard.js --repo . --all --report` is green.

**Commit:**
- `docs(phase-4): restore full protocols + add strict epoch/guard rules`

---

## Step 3 — PHASE_LOG.md (Phase 3 preserved; Phase 4 started)
**File:** `PHASE_LOG.md`

**Acceptance criteria:**
- Phase 3 is preserved as historical record.
- Phase 4 start is recorded without rewriting Phase 0–3 history.

**Verification:**
- Manual sanity check (append-only intent preserved).

**Commit:**
- `docs(phase-4): normalize PHASE_LOG, preserve Phase 3 history, start Phase 4`

---

## Step 4 — scripts/plan_guard.js (v2 enforcement behavior)
**File:** `scripts/plan_guard.js`

**Acceptance criteria:**
- Supports `--phase N` where:
  - missing-path enforcement is scoped to that phase slice only
  - drift detection is always checked against the full plan allowlist
- Supports `--all` to enforce missing-paths across the full plan.
- Writes `.plan_guard/manifest.json` on each run.
- Does not falsely report drift for planned files in other phases.

**Verification:**
- `node scripts/plan_guard.js --repo . --phase 4 --report` => ✅ ON-PLAN
- `node scripts/plan_guard.js --repo . --all --report` => ✅ ON-PLAN

**Commit:**
- `chore(plan-guard): v2 phase-scoped missing + full-plan drift allowlist`

---

## Step 5 — scripts/build_status_from_md.js (Phase 4 check)
**File:** `scripts/build_status_from_md.js`

**Purpose:**
- Ensure it still parses the current `master_build.md` format deterministically.

**Acceptance criteria:**
- Script produces stable JSON output from `master_build.md`.
- No crashes when parsing new Phase/Appendix structures.

**Verification:**
- Run:
  - `node scripts/build_status_from_md.js ./master_build.md`
- Confirm it exits 0 and prints/writes valid JSON (per repo behavior).

**Commit:**
- If modified: `chore(phase-4): harden build_status parser for strict master_build format`
- If unchanged: no commit required; record “verified unchanged” note in PHASE_LOG when you close the subphase.

---

## Step 6 — Phase 4 closeout snapshot (when Phase 4 is declared complete)
**File:** `.plan_guard/manifest.json` (generated)

**Acceptance criteria:**
- plan_guard is green for `--phase 4` and `--all`.

**Verification:**
- `node scripts/plan_guard.js --repo . --phase 4 --report`
- `node scripts/plan_guard.js --repo . --all --report`

**Commit policy:**
- Do NOT commit `.plan_guard/manifest.json` unless Phase 4 closeout explicitly requires it.

---

## END OF PHASE 4 FILELIST
#END
