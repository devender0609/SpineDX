#requires -Version 5.1
<#
  SpineDx-Tx v30.0 installer.

  Every npm command is followed by an explicit $LASTEXITCODE check. The success banner is the
  last statement in the script and is unreachable unless install, engine tests, regression
  tests, typecheck and the production build have all returned 0.

  Forced dependency remediation is deliberately not performed here: it applies semver-major
  upgrades without review, which is not acceptable in a clinical prototype. Vulnerabilities
  are reviewed and pinned deliberately instead.
#>

$ErrorActionPreference = "Stop"

$release          = "v30.0"
$packageVersion   = "0.30.0"
$appVersion       = "30.0.0"

$source      = Split-Path -Parent $MyInvocation.MyCommand.Path
$destination = "C:\Users\dpsingh\Desktop\AI Machine Learning\SpineDx-TX\SpineDX"

function Assert-LastExitCode([string]$message) {
    if ($LASTEXITCODE -ne 0) {
        Write-Host ""
        Write-Host "INSTALL FAILED: $message" -ForegroundColor Red
        throw $message
    }
}

function Write-Step([string]$message) {
    Write-Host ""
    Write-Host "== $message ==" -ForegroundColor Cyan
}

Write-Host "SpineDx-Tx $release  (package $packageVersion / app $appVersion)"
Write-Host "Source:      $source"
Write-Host "Destination: $destination"

# ---------------------------------------------------------------- preflight
if ([System.IO.Path]::GetFullPath($source).TrimEnd("\") -eq [System.IO.Path]::GetFullPath($destination).TrimEnd("\")) {
    throw "Run the installer from the extracted $release source folder, not from the permanent repository."
}
if (-not (Test-Path "$source\lib\validation.ts"))              { throw "$release validation module is missing." }
if (-not (Test-Path "$source\lib\decisionEngine.ts"))          { throw "$release decision engine is missing." }
if (-not (Test-Path "$source\lib\evidence.ts"))                { throw "$release evidence registry is missing." }
if (-not (Test-Path "$source\lib\modeProjection.ts"))          { throw "$release mode-projection layer is missing." }
if (-not (Test-Path "$source\lib\researchExport.ts"))          { throw "$release research-export module is missing." }
if (-not (Test-Path "$source\lib\rapidRequirements.ts"))       { throw "$release rapid-requirement model is missing." }
if (-not (Test-Path "$source\lib\pathways.ts"))                { throw "$release pathway classifier is missing." }
if (-not (Test-Path "$source\lib\motorSummary.ts"))            { throw "$release canonical motor model is missing." }
if (-not (Test-Path "$source\components\evidence\EvidenceLibrary.tsx")) { throw "$release evidence library is missing." }
if (-not (Test-Path "$source\components\SpineDecisionApp.tsx")) { throw "$release application component is missing." }
if (-not (Test-Path "$source\scripts\engine-tests.mjs"))       { throw "$release engine test suite is missing." }
if (-not (Test-Path "$source\scripts\regression-tests.mjs"))   { throw "$release regression test suite is missing." }
if (-not (Test-Path "$destination\.git"))                      { throw "Destination is not the permanent Git repository." }

# Version agreement between the installer and package.json, checked before anything is copied.
$pkg = Get-Content "$source\package.json" -Raw | ConvertFrom-Json
if ($pkg.version -ne $packageVersion) {
    throw "Version mismatch: package.json is $($pkg.version) but this installer is for $packageVersion."
}

Set-Location $destination
if (git status --porcelain) {
    throw "The destination repository has uncommitted changes. Commit, stash, or discard them before installing $release."
}

Write-Step "Sync repository"
git pull --rebase origin main
Assert-LastExitCode "Git pull failed."

Write-Step "Copy source"
robocopy $source $destination /E /IS /IT /XD .git node_modules .next .vercel
if ($LASTEXITCODE -ge 8) {
    Write-Host ""
    Write-Host "INSTALL FAILED: Robocopy exit code $LASTEXITCODE." -ForegroundColor Red
    throw "Robocopy failed with exit code $LASTEXITCODE."
}

# Obsolete modules removed in earlier releases; harmless if already absent.
Remove-Item "$destination\lib\syntheticEngine.ts" -Force -ErrorAction SilentlyContinue
Remove-Item "$destination\lib\surrogateEngine.ts" -Force -ErrorAction SilentlyContinue
Remove-Item "$destination\install-v28.2.ps1"      -Force -ErrorAction SilentlyContinue
Remove-Item "$destination\install-v28.3.ps1"      -Force -ErrorAction SilentlyContinue
Remove-Item "$destination\install-v28.4.ps1"      -Force -ErrorAction SilentlyContinue
Remove-Item "$destination\install-v29.0.ps1"      -Force -ErrorAction SilentlyContinue
Remove-Item "$destination\install-v29.1.ps1"      -Force -ErrorAction SilentlyContinue
Remove-Item "$destination\tsconfig.tsbuildinfo"   -Force -ErrorAction SilentlyContinue
Remove-Item "$destination\.next" -Recurse -Force  -ErrorAction SilentlyContinue

Write-Step "Install dependencies"
npm install
Assert-LastExitCode "npm install failed."

Write-Step "Engine tests"
npm run test:engine
Assert-LastExitCode "Engine or validation tests failed."

Write-Step "Regression tests"
npm run test:regression
Assert-LastExitCode "Regression tests failed."

Write-Step "TypeScript typecheck"
npm run typecheck
Assert-LastExitCode "TypeScript checking failed."

Write-Step "Production build"
npm run build
Assert-LastExitCode "Next.js production build failed."

Write-Host ""
Write-Host "$release installed and verified." -ForegroundColor Green
Write-Host "  engine tests      passed" -ForegroundColor Green
Write-Host "  regression tests  passed" -ForegroundColor Green
Write-Host "  TypeScript        passed" -ForegroundColor Green
Write-Host "  production build  passed" -ForegroundColor Green
Write-Host ""
Write-Host "Next: git add -A; git commit -m 'v30.0 rapid motor model, export privacy, opt-in drafts, consolidated UI'; git push origin main"
