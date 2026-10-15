[CmdletBinding()]
param()
$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path -Parent $PSScriptRoot
$desktopPython = Join-Path $repoRoot 'desktop/.venv/Scripts/python.exe'

function Invoke-Checked {
    param([string]$Program, [string[]]$Arguments)
    & $Program @Arguments
    if ($LASTEXITCODE -ne 0) { throw "$Program failed with exit code $LASTEXITCODE" }
}

if ($env:OS -ne 'Windows_NT') { throw 'Build this Windows executable on Windows.' }
Push-Location $repoRoot
$previousBackend = $env:REACT_APP_BACKEND_URL
$previousPublic = $env:PUBLIC_URL
$previousCI = $env:CI
try {
    if (-not (Test-Path $desktopPython)) {
        Invoke-Checked -Program 'py' -Arguments @('-3.11', '-m', 'venv', 'desktop/.venv')
    }
    Invoke-Checked -Program $desktopPython -Arguments @('-m', 'pip', 'install', '-r', 'desktop/build-requirements.txt')
    # Install frontend resolutions using the same Yarn version as package.json.
    # corepack invocation avoids changing the user's globally configured shims.
    Push-Location frontend
    try {
        Invoke-Checked -Program 'corepack' -Arguments @('yarn', 'install', '--non-interactive')
        $env:REACT_APP_BACKEND_URL = ''
        $env:PUBLIC_URL = ''
        # Existing lint warnings should not prevent creating a testing preview.
        $env:CI = 'false'
        Invoke-Checked -Program 'corepack' -Arguments @('yarn', 'build')
    } finally { Pop-Location }
    Invoke-Checked -Program $desktopPython -Arguments @('-m', 'PyInstaller', '--clean', '--noconfirm', '--distpath', 'desktop/dist', '--workpath', 'desktop/build', 'desktop/UltraStudio.spec')
    Copy-Item 'desktop/PORTABLE_README.txt' 'desktop/dist/UltraStudio/README.txt'
    Write-Host 'Built desktop/dist/UltraStudio/UltraStudio.exe. Keep the entire UltraStudio folder together.'
} finally {
    $env:REACT_APP_BACKEND_URL = $previousBackend
    $env:PUBLIC_URL = $previousPublic
    $env:CI = $previousCI
    Pop-Location
}
