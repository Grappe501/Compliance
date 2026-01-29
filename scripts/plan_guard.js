#!/usr/bin/env node
/**
 * plan_guard.js — Campaign Compliance "no drift" guard
 *
 * Contract:
 * - master_build.md is the plan of record
 * - if a required path referenced in master_build.md is missing => OFF-PLAN
 * - if extra files exist under watched roots that are not referenced by plan => DRIFT
 *
 * Supports:
 * - --create : create missing dirs + placeholder files
 * - --report : print report
 * - --snapshot <name> : save manifest snapshot
 * - --phase <n> : only enforce paths referenced under "# PHASE n" section
 *
 * Usage examples:
 *   node scripts/plan_guard.js --plan ./master_build.md --repo . --report
 *   node scripts/plan_guard.js --plan ./master_build.md --repo . --create --report
 *   node scripts/plan_guard.js --plan ./master_build.md --repo . --phase 1 --report
 *   node scripts/plan_guard.js --plan ./master_build.md --repo . --snapshot phase-1 --report
 */

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

function die(msg) {
  console.error(`\n❌ ${msg}\n`);
  process.exit(1);
}

function readText(p) {
  return fs.readFileSync(p, "utf8");
}

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function pathExists(p) {
  try {
    fs.accessSync(p, fs.constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

function sha256(s) {
  return crypto.createHash("sha256").update(s).digest("hex");
}

function isProbablyFile(rel) {
  const base = path.basename(rel);
  if (base.includes(".")) return true;

  const known = new Set([
    "package.json",
    "schema.prisma",
    ".gitignore",
    ".npmrc",
    "netlify.toml",
    "README.md",
    "MASTER_BUILD_DIRECTIONS.md",
    "master_build.md",
    "PHASE_LOG.md",
    "PROTOCOLS.md",
  ]);

  return known.has(base);
}

/**
 * Ignore generated/derived files and OS clutter when scanning for drift.
 * We do NOT require these to appear in master_build.md.
 */
function shouldIgnoreRelPath(relPath) {
  const p = relPath.replace(/\\/g, "/");

  // directory segments we always ignore
  const ignoredDirSegments = [
    "/node_modules/",
    "/.next/",
    "/dist/",
    "/build/",
    "/.turbo/",
    "/.cache/",
    "/.vercel/",
    "/.netlify/",
  ];

  for (const seg of ignoredDirSegments) {
    if (p.includes(seg)) return true;
  }

  // file patterns we always ignore
  const base = path.basename(p);
  const ignoredFiles = new Set([
    "package-lock.json",
    "pnpm-lock.yaml",
    "yarn.lock",
    ".DS_Store",
    "Thumbs.db",

    // Local-only environment files (explicitly allowed; never part of plan)
    ".env",
    ".env.local",
    ".env.development",
    ".env.production",
  ]);

  if (ignoredFiles.has(base)) return true;

  return false;
}

/**
 * Extract candidate repo paths from arbitrary markdown text.
 *
 * We intentionally support THREE sources of truth:
 * 1) backticked paths: `apps/campaign_compliance/app/page.tsx`
 * 2) bullet/inline paths: apps/... mentioned in text
 * 3) codeblocks containing paths (rare, but allowed)
 *
 * We only accept paths rooted in known repo roots to avoid false positives.
 */
function extractPlanPaths(mdText, phaseFilter /* number|null */) {
  const roots = [
    "apps/",
    "db/",
    "scripts/",
    "public/",
    ".plan_guard/",
    "master_build.md",
    "MASTER_BUILD_DIRECTIONS.md",
    "PHASE_LOG.md",
    "PROTOCOLS.md",
  ];

  const accept = (s) => {
    if (!s) return null;
    let p = s.trim().replace(/\\/g, "/");

    // Strip trailing punctuation
    p = p.replace(/[),.;:]$/g, "");

    // Reject obvious non-paths
    if (p.includes("://")) return null;
    if (p.includes("`")) return null;
    if (p.includes("{") || p.includes("}") || p.includes(";")) return null;
    if (p.includes(" ") && !p.endsWith(".md")) return null;

    // Keep only recognized roots
    if (!roots.some((r) => p === r || p.startsWith(r))) return null;

    // Normalize leading ./ if present
    if (p.startsWith("./")) p = p.slice(2);

    return p;
  };

  // Optionally scope to a single PHASE section
  const scoped = phaseFilter ? sliceToPhase(mdText, phaseFilter) : mdText;

  const found = new Set();

  // 1) backticked paths
  {
    const re = /`([^`\n\r]+)`/g;
    let m;
    while ((m = re.exec(scoped)) !== null) {
      const candidate = accept(m[1]);
      if (candidate) found.add(candidate);
    }
  }

  // 2) inline/bullets paths
  {
    const re =
      /\b(apps\/[A-Za-z0-9._\-\/]+|db\/[A-Za-z0-9._\-\/]+|scripts\/[A-Za-z0-9._\-\/]+|public\/[A-Za-z0-9._\-\/]+|master_build\.md|MASTER_BUILD_DIRECTIONS\.md|PHASE_LOG\.md|PROTOCOLS\.md)\b/g;
    let m;
    while ((m = re.exec(scoped)) !== null) {
      const candidate = accept(m[1]);
      if (candidate) found.add(candidate);
    }
  }

  return Array.from(found).sort();
}

/**
 * Returns only the markdown slice for "# PHASE <n>" ... until the next "# PHASE" or EOF.
 * This makes phase-specific checks deterministic.
 */
function sliceToPhase(mdText, phaseNumber) {
  const lines = mdText.split(/\r?\n/);

  const phaseHeaderRe = new RegExp(`^#\\s*PHASE\\s+${phaseNumber}\\b`, "i");
  const nextPhaseRe = /^#\s*PHASE\s+\d+\b/i;

  let startIdx = -1;
  for (let i = 0; i < lines.length; i++) {
    if (phaseHeaderRe.test(lines[i].trim())) {
      startIdx = i;
      break;
    }
  }

  if (startIdx === -1) {
    return "";
  }

  let endIdx = lines.length;
  for (let i = startIdx + 1; i < lines.length; i++) {
    if (nextPhaseRe.test(lines[i].trim())) {
      endIdx = i;
      break;
    }
  }

  return lines.slice(startIdx, endIdx).join("\n");
}

function normalizePaths(repoRoot, relPaths) {
  return relPaths.map((rel) => ({
    rel: rel.replace(/\\/g, "/"),
    abs: path.resolve(repoRoot, rel),
  }));
}

function listAllFilesUnder(rootAbs, repoRootAbs) {
  const out = [];

  function walk(dirAbs) {
    const items = fs.readdirSync(dirAbs, { withFileTypes: true });
    for (const it of items) {
      const fullAbs = path.join(dirAbs, it.name);

      const rel = path
        .relative(repoRootAbs, fullAbs)
        .replace(/\\/g, "/");

      // Ignore generated stuff early
      if (shouldIgnoreRelPath(rel)) {
        continue;
      }

      if (it.isDirectory()) walk(fullAbs);
      else out.push(fullAbs);
    }
  }

  if (pathExists(rootAbs)) walk(rootAbs);
  return out;
}

function main() {
  const args = process.argv.slice(2);
  const has = (k) => args.includes(k);
  const get = (k, def) => {
    const idx = args.indexOf(k);
    if (idx === -1) return def;
    return args[idx + 1] ?? def;
  };

  const repoRoot = get("--repo", ".");
  const planPath = get("--plan", "./master_build.md");
  const phaseFilterRaw = get("--phase", null);
  const phaseFilter = phaseFilterRaw ? Number(phaseFilterRaw) : null;

  if (phaseFilterRaw && (!Number.isFinite(phaseFilter) || phaseFilter <= 0)) {
    die(`Invalid --phase value: ${phaseFilterRaw}`);
  }

  const repoRootAbs = path.resolve(repoRoot);

  const planAbs = path.resolve(repoRoot, planPath);
  if (!pathExists(planAbs)) die(`Plan not found: ${planAbs}`);

  const md = readText(planAbs);

  const doCreate = has("--create");
  const doReport = has("--report") || (!doCreate && !has("--snapshot"));
  const snapshotName = get("--snapshot", null);

  const relPaths = extractPlanPaths(md, phaseFilter);

  if (phaseFilter && relPaths.length === 0) {
    die(
      `No paths found under "# PHASE ${phaseFilter}". Either the phase header is missing, or no paths are referenced.`
    );
  }
  if (!phaseFilter && relPaths.length === 0) {
    die("No plan paths were detected in master_build.md. The guard cannot enforce anything.");
  }

  const required = normalizePaths(repoRoot, relPaths);

  // Create missing placeholders
  const created = { dirs: [], files: [] };
  if (doCreate) {
    for (const p of required) {
      const rel = p.rel;

      // Treat explicit trailing slash as directory
      const explicitDir = rel.endsWith("/");
      const file = !explicitDir && isProbablyFile(rel);

      if (file) {
        const parent = path.dirname(p.abs);
        if (!pathExists(parent)) {
          ensureDir(parent);
          created.dirs.push(path.relative(repoRoot, parent).replace(/\\/g, "/"));
        }
        if (!pathExists(p.abs)) {
          fs.writeFileSync(p.abs, "");
          created.files.push(rel);
        }
      } else {
        if (!pathExists(p.abs)) {
          ensureDir(p.abs);
          created.dirs.push(rel);
        }
      }
    }
  }

  // Missing required paths
  const missing = required.filter((p) => !pathExists(p.abs)).map((p) => p.rel);

  // Drift detection: extra files under watched roots not referenced by plan
  const watchedRootsRel = ["apps/campaign_compliance", "db/sql", "scripts"];
  const watchedRootsAbs = watchedRootsRel.map((r) => path.resolve(repoRoot, r));
  const requiredAbsSet = new Set(required.map((p) => p.abs));

  const extra = [];
  for (const rootAbs of watchedRootsAbs) {
    const files = listAllFilesUnder(rootAbs, repoRootAbs);
    for (const f of files) {
      const rel = path.relative(repoRootAbs, f).replace(/\\/g, "/");
      if (shouldIgnoreRelPath(rel)) continue;

      if (!requiredAbsSet.has(f)) {
        extra.push(rel);
      }
    }
  }

  // Manifest
  const manifest = {
    generatedAt: new Date().toISOString(),
    repoRoot: repoRootAbs,
    plan: path.relative(repoRoot, planAbs).replace(/\\/g, "/"),
    planHash: sha256(md),
    phaseFilter: phaseFilter ?? null,
    requiredPaths: required.map((p) => p.rel),
    missingPaths: missing,
    extraPaths: extra.sort(),
    created: doCreate ? created : undefined,
  };

  const guardDir = path.resolve(repoRoot, ".plan_guard");
  ensureDir(guardDir);

  const manifestPath = path.join(guardDir, "manifest.json");
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

  if (snapshotName) {
    const snapPath = path.join(guardDir, `manifest.${snapshotName}.json`);
    fs.writeFileSync(snapPath, JSON.stringify(manifest, null, 2));
  }

  if (doReport) {
    console.log("\n=== PLAN GUARD REPORT ===\n");
    console.log(`Plan: ${manifest.plan}`);
    console.log(`Plan hash: ${manifest.planHash}`);
    if (phaseFilter) console.log(`Phase filter: ${phaseFilter}`);
    console.log(`Required paths detected: ${manifest.requiredPaths.length}`);
    console.log(`Manifest saved: ${path.relative(repoRoot, manifestPath).replace(/\\/g, "/")}\n`);

    if (doCreate) {
      console.log("-- Created --");
      console.log(`Dirs: ${created.dirs.length}`);
      if (created.dirs.length) console.log(created.dirs.sort().map((d) => `  + ${d}`).join("\n"));
      console.log(`Files: ${created.files.length}`);
      if (created.files.length) console.log(created.files.sort().map((f) => `  + ${f}`).join("\n"));
      console.log("");
    }

    console.log("-- Missing required paths (OFF-PLAN) --");
    if (!missing.length) console.log("  ✅ none\n");
    else console.log(missing.map((m) => `  ❌ ${m}`).join("\n") + "\n");

    console.log("-- Extra files under watched roots (POTENTIAL DRIFT) --");
    if (!extra.length) console.log("  ✅ none\n");
    else console.log(extra.map((e) => `  ⚠️  ${e}`).join("\n") + "\n");

    if (missing.length) {
      console.log("Result: ❌ OFF-PLAN (missing required paths)\n");
      process.exitCode = 2;
    } else if (extra.length) {
      console.log("Result: ⚠️  ON-PLAN but drift detected (extra files present)\n");
      process.exitCode = 3;
    } else {
      console.log("Result: ✅ ON-PLAN (no missing, no drift)\n");
      process.exitCode = 0;
    }
  }
}

main();
