param(
    [ValidateSet('Both', 'Pose', 'Camera')][string]$Mode = 'Both',
    [string]$ModelsRoot,
    [switch]$IncludeBaseModels,
    [switch]$ListOnly
)
$ErrorActionPreference = 'Stop'
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
$manifest = Get-Content (Join-Path $PSScriptRoot 'qwen-reference-downloads.json') -Raw | ConvertFrom-Json
$selected = @($manifest | Where-Object { ($_.mode -eq 'base' -and $IncludeBaseModels) -or ($_.mode -ne 'base' -and ($Mode -eq 'Both' -or $_.mode -eq $Mode.ToLower())) })
if ($ListOnly) { $selected | Select-Object mode, folder, path | Format-Table -AutoSize; exit 0 }
$defaultRoot = Join-Path $env:LOCALAPPDATA 'Comfy-Desktop\ComfyUI-Shared\models'
if (-not $ModelsRoot) {
    Write-Host "ComfyUI models folder (default: $defaultRoot)" -ForegroundColor Cyan
    $answer = Read-Host 'Press Enter for the default, or paste your actual models folder'
    $ModelsRoot = if ($answer.Trim()) { $answer.Trim().Trim('"') } else { $defaultRoot }
}
$ModelsRoot = [IO.Path]::GetFullPath($ModelsRoot)
if (-not (Test-Path -LiteralPath $ModelsRoot -PathType Container)) {
    throw "Models folder does not exist: $ModelsRoot. Pass -ModelsRoot with the folder ComfyUI actually uses."
}
if (-not (Get-Command curl.exe -ErrorAction SilentlyContinue)) { throw 'curl.exe is required (included with current Windows releases).' }
Write-Host "Installing $Mode reference tools into $ModelsRoot" -ForegroundColor Cyan
Write-Host 'Existing files are reused only after size and SHA-256 verification. Subfolders are checked too.'
Write-Host 'This does not download another Qwen base model unless -IncludeBaseModels is supplied.'
$metadata = @{}
function Test-VerifiedFile([string]$Path, [long]$ExpectedBytes, [string]$ExpectedHash) {
    if (-not (Test-Path -LiteralPath $Path -PathType Leaf)) { return $false }
    if ((Get-Item -LiteralPath $Path).Length -ne $ExpectedBytes) { return $false }
    Write-Host "Verifying $Path ..."
    return (Get-FileHash -LiteralPath $Path -Algorithm SHA256).Hash -eq $ExpectedHash
}
foreach ($entry in $selected) {
    if (-not $metadata.ContainsKey($entry.repository)) {
        $metadata[$entry.repository] = Invoke-RestMethod -Uri "https://huggingface.co/api/models/$($entry.repository)?blobs=true"
    }
    $repoInfo = $metadata[$entry.repository]
    $remote = $repoInfo.siblings | Where-Object { $_.rfilename -eq $entry.path } | Select-Object -First 1
    if (-not $remote -or -not $remote.lfs.sha256 -or -not $remote.size -or -not $repoInfo.sha) {
        throw "Could not verify download metadata for $($entry.repository)/$($entry.path). No unverified file will be installed."
    }
    $fileName = [IO.Path]::GetFileName($entry.path)
    $folder = Join-Path $ModelsRoot $entry.folder
    New-Item -ItemType Directory -Path $folder -Force | Out-Null
    $candidates = @(Get-ChildItem -LiteralPath $folder -Recurse -File -Filter $fileName)
    $existing = $null
    foreach ($candidate in $candidates) {
        if (Test-VerifiedFile $candidate.FullName $remote.size $remote.lfs.sha256) { $existing = $candidate; break }
    }
    if ($existing) {
        Write-Host "Already installed: $($existing.FullName)" -ForegroundColor Green
        continue
    }
    $destination = Join-Path $folder $fileName
    $partial = "$destination.part"
    if (-not (Test-VerifiedFile $partial $remote.size $remote.lfs.sha256)) {
        Write-Host "Downloading $fileName ($([math]::Round($remote.size / 1GB, 2)) GB) ..." -ForegroundColor Cyan
        $encodedPath = ($entry.path.Split('/') | ForEach-Object { [Uri]::EscapeDataString($_) }) -join '/'
        $url = "https://huggingface.co/$($entry.repository)/resolve/$($repoInfo.sha)/$encodedPath"
        & curl.exe --fail --location --retry 3 --continue-at - --output $partial $url
        if ($LASTEXITCODE -ne 0) { throw "Download failed for $fileName. Run again to resume the .part file." }
        if (-not (Test-VerifiedFile $partial $remote.size $remote.lfs.sha256)) {
            $invalid = "$partial.invalid-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
            Move-Item -LiteralPath $partial -Destination $invalid
            throw "Checksum failed for $fileName. The invalid download was saved as $invalid. Run again for a fresh download."
        }
    }
    if (Test-Path -LiteralPath $destination) {
        Move-Item -LiteralPath $destination -Destination "$destination.backup-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
    }
    Move-Item -LiteralPath $partial -Destination $destination
    Write-Host "Installed: $destination" -ForegroundColor Green
}
Write-Host ''
Write-Host 'Downloads verified. Restart ComfyUI, then Settings > Refresh bundled workflows in Ultra Studio.' -ForegroundColor Green
Write-Host 'Select Qwen Change Pose - AnyPose or Qwen Camera Angle - Multiple Angles.'
