param(
  [string]$Destination = "C:\Users\dpsingh\Desktop\AI Machine Learning\SpineDx-TX\SpineDX"
)

$ErrorActionPreference = "Stop"
$Source = $PSScriptRoot

if (-not (Test-Path "$Source\lib\caseFactory.ts")) { throw "Source is incomplete: caseFactory.ts is missing." }
if (-not (Select-String -Path "$Source\lib\caseFactory.ts" -Pattern "export function createBlankAdjudication" -Quiet)) { throw "Source is incomplete: createBlankAdjudication export is missing." }
if (-not (Test-Path "$Destination\.git")) { throw "Destination is not the permanent Git repository: $Destination" }

Set-Location $Destination
if (git status --porcelain) { throw "Destination has uncommitted changes. Commit or restore them before installing v26.1." }

git pull --rebase origin main
robocopy $Source $Destination /E /IS /IT /XD .git node_modules .next .vercel
if ($LASTEXITCODE -ge 8) { throw "Robocopy failed with exit code $LASTEXITCODE" }

Remove-Item -Recurse -Force "$Destination\.next" -ErrorAction SilentlyContinue
Remove-Item "$Destination\tsconfig.tsbuildinfo" -Force -ErrorAction SilentlyContinue

npm install
npm run test:engine
npm run typecheck
npm run build

Write-Host "v26.1 copied and verified successfully." -ForegroundColor Green
Write-Host "Next: git add -A; git commit -m 'Fix v26 build consistency and adjudication typing'; git push origin main"
