$ErrorActionPreference = "Stop"

$modelsRoot = Join-Path $env:LOCALAPPDATA "Comfy-Desktop\ComfyUI-Shared\models"
$targetFolder = Join-Path $modelsRoot "loras\Z-Image"
$targetFile = Join-Path $targetFolder "girls pee.safetensors"
$downloadUrl = "https://huggingface.co/Frank196/Pissing_peeing_women_z_image_turbo/resolve/main/girls%20pee.safetensors?download=true"

New-Item -ItemType Directory -Force -Path $targetFolder | Out-Null

Write-Host "Downloading the optional Z-Image effect LoRA..." -ForegroundColor Cyan
curl.exe -L --fail --retry 3 $downloadUrl -o $targetFile
if ($LASTEXITCODE -ne 0) {
    throw "Download failed with curl exit code $LASTEXITCODE."
}

$downloaded = Get-Item $targetFile
if ($downloaded.Length -lt 100MB) {
    Remove-Item $targetFile -Force
    throw "The downloaded file was unexpectedly small and was removed."
}

Write-Host "Installed:" $targetFile -ForegroundColor Green
Write-Host "Restart ComfyUI (or rescan models), refresh Ultra Studio, then choose this file in Optional Effect LoRA Slot."
