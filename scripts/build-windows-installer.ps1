[CmdletBinding()]
param([switch]$SkipAppBuild)
$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path -Parent $PSScriptRoot
if ($env:OS -ne 'Windows_NT') { throw 'Build the installer on Windows.' }
if (-not $SkipAppBuild) { & "$PSScriptRoot/build-windows-desktop.ps1" }
$compiler = Get-Command ISCC.exe -ErrorAction SilentlyContinue
$compilerPath = if ($compiler) { $compiler.Source } else {
    Get-ChildItem -Path "${env:ProgramFiles(x86)}/Inno Setup*/ISCC.exe" -ErrorAction SilentlyContinue |
        Sort-Object FullName -Descending | Select-Object -First 1 -ExpandProperty FullName
}
if (-not $compilerPath -or -not (Test-Path $compilerPath)) { throw 'Inno Setup is required only on the build machine.' }
$bootstrapper = Join-Path $repoRoot 'desktop/build/MicrosoftEdgeWebview2Setup.exe'
New-Item -ItemType Directory -Force -Path (Split-Path $bootstrapper) | Out-Null
Invoke-WebRequest -Uri 'https://go.microsoft.com/fwlink/p/?LinkId=2124703' -OutFile $bootstrapper
$signature = Get-AuthenticodeSignature -FilePath $bootstrapper
if ($signature.Status -ne 'Valid' -or $signature.SignerCertificate.Subject -notmatch 'O=Microsoft Corporation') {
    throw 'WebView2 bootstrapper signature verification failed.'
}
& $compilerPath (Join-Path $repoRoot 'desktop/UltraStudio.iss')
if ($LASTEXITCODE -ne 0) { throw "Installer compilation failed: $LASTEXITCODE" }
Write-Host 'Built desktop/dist/installer/UltraStudio-Setup.exe'
