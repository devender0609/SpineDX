$ErrorActionPreference = "Stop"

$source = Split-Path -Parent $MyInvocation.MyCommand.Path
$destination = "C:\Users\dpsingh\Desktop\AI Machine Learning\SpineDx-TX\SpineDX"

function Assert-LastExitCode([string]$message) {
    if ($LASTEXITCODE -ne 0) { throw $message }
}

Write-Host "Source: $source"
Write-Host "Destination: $destination"

if (-not (Test-Path "$source\lib\validation.ts")) { throw "v27.6 validation module is missing." }
if (-not (Test-Path "$source\components\SpineDecisionApp.tsx")) { throw "v27.6 application component is missing." }
if (-not (Test-Path "$destination\.git")) { throw "Destination is not the permanent Git repository." }

Set-Location $destination
if (git status --porcelain) { throw "The destination repository has uncommitted changes. Commit, stash, or discard them before installing v27.6." }

git pull --rebase origin main
Assert-LastExitCode "Git pull failed."

robocopy $source $destination /E /IS /IT /XD .git node_modules .next .vercel
if ($LASTEXITCODE -ge 8) { throw "Robocopy failed with exit code $LASTEXITCODE." }

Remove-Item "$destination\lib\syntheticEngine.ts" -Force -ErrorAction SilentlyContinue
Remove-Item "$destination\lib\surrogateEngine.ts" -Force -ErrorAction SilentlyContinue
Remove-Item "$destination\tsconfig.tsbuildinfo" -Force -ErrorAction SilentlyContinue
Remove-Item "$destination\.next" -Recurse -Force -ErrorAction SilentlyContinue

npm install
Assert-LastExitCode "npm install failed."

npm run test:engine
Assert-LastExitCode "Engine or validation tests failed."

npm run typecheck
Assert-LastExitCode "TypeScript checking failed."

npm run build
Assert-LastExitCode "Next.js production build failed."

Write-Host "v27.6 copied and verified successfully." -ForegroundColor Green
Write-Host "Next: git add -A; git commit -m 'Add v27.6 outcomes, evidence, and UI refinement'; git push origin main"
