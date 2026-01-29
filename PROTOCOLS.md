# PROJECT PROTOCOLS
## Campaign Compliance Build System

This document defines the **non-negotiable operating rules** for building, modifying, and validating this repository.

These protocols exist to:
- prevent architectural drift
- ensure the filesystem reflects the plan
- allow deterministic, phase-based progress
- enable the system to monitor itself over time

If the repo and the plan disagree, **the repo is wrong**.

---

## 1. PLAN AUTHORITY

### 1.1 Canonical Planning Documents
The following files are authoritative:

- `master_build.md` — the canonical build plan
- `MASTER_BUILD_DIRECTIONS.md` — narrative + intent guidance
- `PROTOCOLS.md` — *this document*

All build decisions must trace back to these files.

No file may be added, moved, or modified without alignment to the plan.

---

## 2. NO-DRIFT PRINCIPLE

> If a file is referenced in the plan and does not exist in the repo, the project is **OFF-PLAN**.

> If a file exists in the repo and is not referenced in the plan, **DRIFT HAS OCCURRED**.

The filesystem is treated as a **living enforcement layer** for the plan.

---

## 3. PHASE-BASED BUILD MODEL

Development is organized into **explicit phases** (Phase 1, Phase 2, etc.).

Each phase follows the same lifecycle:

### 3.1 Phase Kickoff
At the start of each phase, a file is generated:

- `PHASE_X_FILELIST.md`

This file contains:
- the **ordered list of files** to be built
- one file per step
- acceptance criteria for each file
- references back to sections of `master_build.md`

This file becomes the **checklist for the entire phase**.

---

### 3.2 Scaffolding Before Building
Before any file work begins, the repository is scaffolded so that:
- all required directories exist
- all required files exist at least as placeholders

This is enforced via the plan guard script.

If a required path is missing, the phase **cannot proceed**.

---

### 3.3 One-File-At-A-Time Rule
Files are built **one at a time**, in the order listed in `PHASE_X_FILELIST.md`.

No skipping.  
No parallel edits.  
No “while we’re here” changes.

Each file is completed, verified, and checked off before moving on.

---

## 4. FILE AUTHORING RULES (CRITICAL)

### 4.1 No Snippets — Ever
- When creating a **new file**, the entire file contents are written at once.
- Partial files, snippets, or diffs are not allowed.

### 4.2 Rewrites Require the Full Existing File
- If a file already exists and needs changes:
  - The current full file must be provided first.
  - The file is then rewritten **in full**.
- No inline edits.
- No patch-style responses.

This ensures clarity, traceability, and prevents accidental regression.

---

## 5. SYSTEM SELF-MONITORING

The system must be able to **audit itself** at any time.

### 5.1 Plan Guard
A plan guard script is used to:

- parse `master_build.md`
- extract required file and folder paths
- compare them to the actual filesystem
- report:
  - missing required paths (OFF-PLAN)
  - extra unplanned paths (DRIFT)

The guard must be run:
- at the start of each phase
- periodically during development
- at the end of each phase

---

### 5.2 Phase Snapshots
At the end of each phase:
- a manifest snapshot is saved
- this snapshot represents the “phase-complete” state
- future phases may be compared against prior snapshots

This creates a durable audit trail across the project lifecycle.

---

## 6. PHASE COMPLETION AND THREAD RESET

When a phase is complete:
1. All files in `PHASE_X_FILELIST.md` are checked off
2. The plan guard reports no missing required paths
3. Any drift is either justified and documented or removed
4. A snapshot is taken

Only then does development move to:
- a **new phase**
- a **new working thread**

Each phase is treated as a clean, deliberate build cycle.

---

## 7. OPERATIONAL END GOAL

The final goal of this system is:

> The developer can request a file, receive a complete file, paste it into the repo, and move on —  
> while the system itself guarantees correctness, alignment, and forward progress.

Human memory is not relied upon.  
Discipline is enforced by structure.

---

## 8. ENFORCEMENT

If a requested action violates these protocols:
- the action must pause
- the plan or protocol must be updated
- or the filesystem must be corrected

No silent exceptions.

These protocols are binding for all future work on this repository.
---

## 9. PHASE TIMING, VERSIONING, AND RELEASE ARTIFACTS

### 9.1 Phase End Timestamp (Required)
At the close of every phase, the project must record a **Phase End Time** in plain language.

- The Phase End Time will be provided by the project owner (user) at the moment the phase is declared complete.
- This timestamp must be written into:
  - `PHASE_X_FILELIST.md` (Phase End Time line at bottom)
  - and/or a central log file if one exists (optional, but recommended later)

No phase is considered “closed” until the Phase End Time is recorded.

---

## 10. CURSOR + GIT + NETLIFY WORKFLOW (AUTHORITATIVE)

### 10.1 Editing Workflow
The canonical build loop is:

1. A single file is produced (full file, no snippets).
2. The file is pasted into the correct location using Cursor.
3. Cursor saves the file in-place.
4. Cursor’s Git integration is used to commit changes.

This workflow is mandatory to keep the build deterministic and traceable.

### 10.2 Source Control as System Memory
Git is treated as the system’s history and enforcement layer.

- Work must be committed in a disciplined way.
- Commits should align to file completion and/or phase completion rules below.

---

## 11. LOCAL DATABASE REQUIREMENT AND DATA BOUNDARIES

### 11.1 Local Database Must Run
The system must support running a **local database** during development and testing.

### 11.2 Financial Records Must Not Leave Local
Financial records (real donor/payment/financial data) must not be stored in any hosted database or third-party persistence layer.

- The hosted environment (Netlify or any remote services) must operate using:
  - non-sensitive demo data, seeded test data, or mocked data
  - environment-based configuration that prevents accidental persistence of financial records remotely

### 11.3 Pass-Through Architecture Requirement
The system must support a secure workflow where:
- development and testing can run locally against a local database
- hosted deployments can function without requiring production financial records
- configuration can switch safely between environments without risking data leakage

This is a hard boundary: real financial records remain local.

---

## 12. PHASE VERSIONING, TAGGING, AND ZIP ARCHIVES

### 12.1 Version After Every Phase
At the end of each phase:
- the repo is versioned (Git commit discipline + optional Git tag)
- and a ZIP archive is created as a phase artifact

### 12.2 ZIP Artifact Location (Outside Repo Root)
ZIP archives must be saved **outside** the repository root, at:

- `C:\dev\`

This prevents build artifacts from polluting the repo and avoids accidental commits of archives.

### 12.3 ZIP Naming Convention
Each phase ZIP should use a consistent naming format, for example:

- `campaign_compliance_phase-1_YYYY-MM-DD_HHMM.zip`

(Exact format may be adjusted later, but the phase number and timestamp are required.)

---
