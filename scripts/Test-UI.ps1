param(
    [string]$BaseUrl = "http://localhost:3000",
    [ValidateSet("msedge", "chrome")][string]$Browser = "msedge"
)
$ErrorActionPreference = "Stop"
$repoPath = Split-Path $PSScriptRoot -Parent
$previousUrl = $env:ULTRA_UI_URL
$previousBrowser = $env:ULTRA_UI_BROWSER
Push-Location $repoPath
try {
    if (-not (Get-Command node -ErrorAction SilentlyContinue)) { throw "Install Node.js 22 or newer, then reopen PowerShell." }
    $nodeMajor = [int](node -p "process.versions.node.split('.')[0]")
    if ($nodeMajor -lt 22) { throw "Node.js 22 or newer is required." }
    $env:ULTRA_UI_URL = $BaseUrl
    $env:ULTRA_UI_BROWSER = $Browser
    npm --prefix tests/ui ci --ignore-scripts
    if ($LASTEXITCODE -ne 0) { throw "UI test dependency installation failed." }
    npm --prefix tests/ui test
    if ($LASTEXITCODE -ne 0) { throw "UI checks failed. See tests/ui/artifacts/report.json and screenshots when available." }
    Write-Host "UI checks passed. Screenshots and traces: tests/ui/artifacts"
} finally {
    $env:ULTRA_UI_URL = $previousUrl
    $env:ULTRA_UI_BROWSER = $previousBrowser
    Pop-Location
}
