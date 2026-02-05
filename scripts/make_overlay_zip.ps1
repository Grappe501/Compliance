<#
make_overlay_zip.ps1
Creates an "overlay zip" containing ONLY changed tracked files (plus optional extra files),
preserving their relative paths from repo root.

Usage examples:

# 1) After staging changes
./scripts/make_overlay_zip.ps1 -Segment "Z01_app_shell" -Mode Staged

# 2) From last commit (HEAD) vs previous commit (HEAD~1)
./scripts/make_overlay_zip.ps1 -Segment "Z01_app_shell" -Mode Commit -CommitRef "HEAD~1..HEAD"

# 3) Include a segment checklist file + manifest evidence
./scripts/make_overlay_zip.ps1 -Segment "Z01_app_shell" -Mode Staged -IncludeFiles @("PHASE_Z01_FILELIST.md",".plan_guard/manifest.json")

#>

param(
  [Parameter(Mandatory=$true)]
  [string]$Segment,

  # Mode:
  #  - Staged: uses staged changes (git diff --name-only --cached)
  #  - Working: uses working tree changes (git diff --name-only)
  #  - Commit: uses a commit range (git diff --name-only <CommitRef>)
  [ValidateSet("Staged","Working","Commit")]
  [string]$Mode = "Staged",

  # Used only when Mode=Commit. Example: "HEAD~1..HEAD"
  [string]$CommitRef = "HEAD~1..HEAD",

  # Extra files to include (e.g., PHASE_Z01_FILELIST.md, .plan_guard/manifest.json)
  [string[]]$IncludeFiles = @(),

  # Output folder for zips (relative to repo root)
  [string]$OutDir = "overlays"
)

$ErrorActionPreference = "Stop"

function Require-RepoRoot {
  if (!(Test-Path ".git")) {
    throw "Not at repo root (missing .git). cd to the repo root and retry."
  }
}

function Run-Git([string]$args) {
  $p = Start-Process -FilePath "git" -ArgumentList $args -NoNewWindow -Wait -PassThru -RedirectStandardOutput "NUL" -RedirectStandardError "NUL"
  if ($p.ExitCode -ne 0) {
    # re-run for error text
    $out = & git $args 2>&1
    throw "git $args failed:`n$out"
  }
  return (& git $args)
}

Require-RepoRoot

# Ensure output directory exists
if (!(Test-Path $OutDir)) { New-Item -ItemType Directory -Path $OutDir | Out-Null }

# Determine file list
[string[]]$files = @()

switch ($Mode) {
  "Staged"  { $files = (Run-Git 'diff --name-only --cached') -split "`n" }
  "Working" { $files = (Run-Git 'diff --name-only') -split "`n" }
  "Commit"  { $files = (Run-Git ("diff --name-only " + $CommitRef)) -split "`n" }
}

# Clean + filter
$files = $files |
  ForEach-Object { $_.Trim() } |
  Where-Object { $_ -ne "" } |
  Where-Object { !( $_.StartsWith("overlays/") ) }  # don't zip zips

# Add optional includes
foreach ($inc in $IncludeFiles) {
  if (!(Test-Path $inc)) { throw "Include file not found: $inc" }
  $files += $inc
}

$files = $files | Select-Object -Unique

if ($files.Count -eq 0) {
  throw "No files found to zip for Mode=$Mode. Stage changes or specify -Mode Working/Commit."
}

# Build a temp overlay folder
$tmpRoot = Join-Path $env:TEMP ("overlay_" + $Segment + "_" + [Guid]::NewGuid().ToString("N"))
New-Item -ItemType Directory -Path $tmpRoot | Out-Null

# Copy files, preserving folders
foreach ($f in $files) {
  if (!(Test-Path $f)) {
    # If file was deleted, skip it (overlay zips are additive). Deletions should be handled via git, not overlays.
    Write-Host "Skipping missing (likely deleted): $f"
    continue
  }

  $dest = Join-Path $tmpRoot $f
  $destDir = Split-Path $dest -Parent
  if (!(Test-Path $destDir)) { New-Item -ItemType Directory -Path $destDir -Force | Out-Null }

  Copy-Item -Path $f -Destination $dest -Force
}

# Write manifest
$manifestPath = Join-Path $tmpRoot "OVERLAY_MANIFEST.txt"
@(
  "Segment: $Segment"
  "Mode: $Mode"
  "CommitRef: $CommitRef"
  "Generated: $(Get-Date -Format o)"
  ""
  "Files:"
  $files
) | Set-Content -Encoding UTF8 $manifestPath

# Create zip
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$zipName = "compliance_${Segment}_${timestamp}.zip"
$zipPath = Join-Path $OutDir $zipName

if (Test-Path $zipPath) { Remove-Item $zipPath -Force }
Compress-Archive -Path (Join-Path $tmpRoot "*") -DestinationPath $zipPath -Force

# Cleanup temp
Remove-Item -Recurse -Force $tmpRoot

Write-Host ""
Write-Host "✅ Overlay zip created:"
Write-Host "   $zipPath"
Write-Host ""
Write-Host "Tip: unzip this at repo root to overlay changes."
