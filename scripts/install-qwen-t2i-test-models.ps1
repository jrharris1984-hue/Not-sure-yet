param(
    [ValidateSet('Both', 'AGQI', 'Rapid')][string]$Mode = 'Both',
    [string]$ModelsRoot,
    [string]$ImportFolder = (Join-Path $env:USERPROFILE 'Downloads'),
    [switch]$IncludeCompanions,
    [switch]$ListOnly
)
$ErrorActionPreference = 'Stop'
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
$manifest = Get-Content (Join-Path $PSScriptRoot 'qwen-t2i-test-downloads.json') -Raw | ConvertFrom-Json
$selected = @($manifest | Where-Object {
    ($_.mode -eq 'companions' -and $IncludeCompanions -and $Mode -ne 'Rapid') -or
    ($_.mode -ne 'companions' -and ($Mode -eq 'Both' -or $_.mode -eq $Mode.ToLower()))
})
if ($ListOnly) { $selected | Select-Object mode, folder, name | Format-Table -AutoSize; exit 0 }
$defaultRoot = Join-Path $env:LOCALAPPDATA 'Comfy-Desktop\ComfyUI-Shared\models'
if (-not $ModelsRoot) {
    Write-Host "ComfyUI models folder (default: $defaultRoot)" -ForegroundColor Cyan
    $answer = Read-Host 'Press Enter for the default, or paste your actual models folder'
    $ModelsRoot = if ($answer.Trim()) { $answer.Trim().Trim('"') } else { $defaultRoot }
}
$ModelsRoot = [IO.Path]::GetFullPath($ModelsRoot)
if (-not (Test-Path -LiteralPath $ModelsRoot -PathType Container)) { throw "Models folder does not exist: $ModelsRoot" }
if (-not (Get-Command curl.exe -ErrorAction SilentlyContinue)) { throw 'curl.exe is required.' }
. (Join-Path $PSScriptRoot 'verified-model-download.ps1')
Write-Host 'Existing models and completed Downloads are reused only after size and SHA-256 verification.'
Write-Host 'AGQI replaces the base Qwen diffusion model. Rapid AIO includes its encoder and VAE.'
Write-Host 'Use -IncludeCompanions only if AGQI needs the shared Qwen encoder or VAE.'
foreach ($entry in $selected) {
    $bytes = [long]$entry.bytes
    $hash = [string]$entry.sha256
    $url = [string]$entry.url
    if ($entry.repository) {
        $repo = Invoke-RestMethod -Uri "https://huggingface.co/api/models/$($entry.repository)?blobs=true"
        $remote = $repo.siblings | Where-Object { $_.rfilename -eq $entry.path } | Select-Object -First 1
        if (-not $remote.lfs.sha256 -or -not $remote.size -or -not $repo.sha) { throw "Cannot verify metadata for $($entry.name)" }
        $bytes = [long]$remote.size; $hash = [string]$remote.lfs.sha256
        $encodedPath = ($entry.path.Split('/') | ForEach-Object { [Uri]::EscapeDataString($_) }) -join '/'
        $url = "https://huggingface.co/$($entry.repository)/resolve/$($repo.sha)/$encodedPath"
    }
    if ($bytes -le 0 -or $hash -notmatch '^[a-fA-F0-9]{64}$' -or $url -notmatch '^https://') { throw "Invalid download metadata for $($entry.name)" }
    $folder = Join-Path $ModelsRoot $entry.folder
    New-Item -ItemType Directory -Path $folder -Force | Out-Null
    $names = @($entry.name) + @($entry.aliases)
    $existing = @(Get-ChildItem -LiteralPath $folder -Recurse -File | Where-Object { $_.Name -in $names })
    $verified = $false
    foreach ($file in $existing) {
        if (Test-VerifiedFile $file.FullName $bytes $hash) { Write-Host "Already installed: $($file.FullName)" -ForegroundColor Green; $verified = $true; break }
    }
    if ($verified) { continue }
    $destination = Join-Path $folder $entry.name
    $partial = "$destination.part"
    if (-not (Test-VerifiedFile $partial $bytes $hash) -and (Test-Path -LiteralPath $ImportFolder -PathType Container)) {
        foreach ($file in @(Get-ChildItem -LiteralPath $ImportFolder -File | Where-Object { $_.Name -in $names -or ($_.Length -eq $bytes -and $_.Extension -in '.crdownload', '.part', '.download') })) {
            if (Test-VerifiedFile $file.FullName $bytes $hash) {
                Copy-Item -LiteralPath $file.FullName -Destination $partial -Force
                Write-Host "Copied verified download: $($file.FullName)"
                break
            }
        }
    }
    if (-not (Test-VerifiedFile $partial $bytes $hash)) {
        Write-Host "Downloading $($entry.name) ($([math]::Round($bytes / 1GB, 2)) GB) ..." -ForegroundColor Cyan
        $headers = @()
        if ($entry.mode -eq 'agqi' -and $env:CIVITAI_API_KEY) { $headers += "Authorization: Bearer $env:CIVITAI_API_KEY" }
        Receive-VerifiedModel -Url $url -Partial $partial -Bytes $bytes -Hash $hash -Headers $headers
    }
    if (Test-Path -LiteralPath $destination) { Move-Item -LiteralPath $destination -Destination "$destination.backup-$(Get-Date -Format 'yyyyMMdd-HHmmss')" }
    Move-Item -LiteralPath $partial -Destination $destination
    Write-Host "Installed: $destination" -ForegroundColor Green
}
Write-Host 'Restart ComfyUI, then Ultra Studio Settings > Refresh bundled workflows.' -ForegroundColor Green
Write-Host 'Choose Qwen 2512 - AGQI V2 FP8 or Qwen Rapid AIO v23 - Text to Image.'
