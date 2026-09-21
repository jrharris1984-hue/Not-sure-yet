param(
    [string]$Selection = "",
    [switch]$ListOnly
)

$ErrorActionPreference = "Stop"

$modelsRoot = Join-Path $env:LOCALAPPDATA "Comfy-Desktop\ComfyUI-Shared\models"
$loraRoot = Join-Path $modelsRoot "loras\Z-Image\Curated"

$catalog = @(
    [pscustomobject]@{ Id = 1; Name = "Hands + Feet + Skin"; Category = "Quality"; File = "Hands + Feet + skin v1.1.safetensors"; Strength = "0.30-0.60"; Recommended = $true; Url = "https://huggingface.co/leulfonseca/z-image-turbo-loras/resolve/main/Hands%20%2B%20Feet%20%2B%20skin%20v1.1.safetensors?download=true" },
    [pscustomobject]@{ Id = 2; Name = "Z Detail Slider"; Category = "Quality"; File = "Z-Detail-Slider.safetensors"; Strength = "0.25-0.55"; Recommended = $true; Url = "https://huggingface.co/leulfonseca/z-image-turbo-loras/resolve/main/Z-Detail-Slider.safetensors?download=true" },
    [pscustomobject]@{ Id = 3; Name = "Z-Image Turbo Realism"; Category = "Quality"; File = "Z-Image-Turbo-Realism.safetensors"; Strength = "0.40-0.70"; Recommended = $true; Url = "https://huggingface.co/suayptalha/Z-Image-Turbo-Realism-LoRA/resolve/main/pytorch_lora_weights.safetensors?download=true" },
    [pscustomobject]@{ Id = 4; Name = "NSFW Master"; Category = "Core"; File = "NSFW_master_ZIT_000008766.safetensors"; Strength = "0.60-0.80"; Recommended = $true; Url = "https://huggingface.co/thutes-gbr25/NSFW-MASTER-Z-IMAGE-TURBO/resolve/main/NSFW_master_ZIT_000008766.safetensors?download=true" },
    [pscustomobject]@{ Id = 5; Name = "Ass and Thighs Slider"; Category = "Body"; File = "ass_2_loraholic.safetensors"; Strength = "0.35-0.65"; Recommended = $true; Url = "https://huggingface.co/Alex995647/loras-z-image-turbo/resolve/main/ass-and-thighs-slider-krea-2-zit/ass_2_loraholic.safetensors?download=true" },
    [pscustomobject]@{ Id = 6; Name = "Breast Slider"; Category = "Body"; File = "Z-Breast-Slider.safetensors"; Strength = "0.35-0.65"; Recommended = $true; Url = "https://huggingface.co/Alex995647/loras-z-image-turbo/resolve/main/zit-breast-slider/Z-Breast-Slider.safetensors?download=true" },
    [pscustomobject]@{ Id = 7; Name = "Feet Detail"; Category = "Body"; File = "feet v2.1.safetensors"; Strength = "0.35-0.65"; Recommended = $true; Url = "https://huggingface.co/Alex995647/loras-z-image-turbo/resolve/main/feet-xl-sd-1-5-f1d-pony-illustrious-zit/feet%20v2.1.safetensors?download=true" },
    [pscustomobject]@{ Id = 8; Name = "Porn Master"; Category = "Action"; File = "lora-porn-master.safetensors"; Strength = "0.55-0.80"; Recommended = $false; Url = "https://huggingface.co/qqnyanddld/nsfw-z-image-lora/resolve/main/lora-porn-master.safetensors?download=true" },
    [pscustomobject]@{ Id = 9; Name = "Oiled Skin"; Category = "Effect"; File = "lora-oiled-skin.safetensors"; Strength = "0.40-0.70"; Recommended = $false; Url = "https://huggingface.co/qqnyanddld/nsfw-z-image-lora/resolve/main/lora-oiled-skin.safetensors?download=true" },
    [pscustomobject]@{ Id = 10; Name = "Lingerie"; Category = "Wardrobe"; File = "lora-lingerie.safetensors"; Strength = "0.50-0.75"; Recommended = $false; Url = "https://huggingface.co/qqnyanddld/nsfw-z-image-lora/resolve/main/lora-lingerie.safetensors?download=true" },
    [pscustomobject]@{ Id = 11; Name = "Doggy Pose"; Category = "Action"; File = "lora-doggy.safetensors"; Strength = "0.55-0.85"; Recommended = $false; Url = "https://huggingface.co/qqnyanddld/nsfw-z-image-lora/resolve/main/lora-doggy.safetensors?download=true" },
    [pscustomobject]@{ Id = 12; Name = "Peeing Women"; Category = "Effect"; File = "girls pee.safetensors"; Strength = "0.60-0.85"; Recommended = $false; Url = "https://huggingface.co/Frank196/Pissing_peeing_women_z_image_turbo/resolve/main/girls%20pee.safetensors?download=true" }
)

$qqFiles = @(
    "lora-anal.safetensors", "lora-bbc-penis.safetensors", "lora-blowjob.safetensors",
    "lora-blowjob2.safetensors", "lora-bukkake.safetensors", "lora-cum-kiss.safetensors",
    "lora-cum.safetensors", "lora-doggy.safetensors", "lora-facial.safetensors",
    "lora-fisting.safetensors", "lora-foot.safetensors", "lora-footing.safetensors",
    "lora-fucking-penis.safetensors", "lora-lick-ass.safetensors", "lora-lick.safetensors",
    "lora-lingerie.safetensors", "lora-nipple-clamp.safetensors", "lora-oiled-skin.safetensors",
    "lora-open-pussy.safetensors", "lora-panty.safetensors", "lora-penis-blowjob.safetensors",
    "lora-penis.safetensors", "lora-porn-master.safetensors", "lora-pov-doggy.safetensors",
    "lora-pussy.safetensors", "lora-sex-machine.safetensors", "lora-sex.safetensors",
    "lora-tattoo.safetensors", "lora-tentacled.safetensors", "lora-women.safetensors"
)
$qqCollection = @()
for ($index = 0; $index -lt $qqFiles.Count; $index++) {
    $file = $qqFiles[$index]
    $qqCollection += [pscustomobject]@{
        Id = "Q{0:D2}" -f ($index + 1)
        Name = [IO.Path]::GetFileNameWithoutExtension($file).Replace("lora-", "").Replace("-", " ")
        Category = "QQ Collection"
        File = $file
        Strength = "0.50-0.80"
        Recommended = $false
        Url = "https://huggingface.co/qqnyanddld/nsfw-z-image-lora/resolve/main/${file}?download=true"
    }
}

function Show-Catalog {
    Write-Host ""
    Write-Host "Curated Z-Image Turbo LoRAs" -ForegroundColor Cyan
    Write-Host "Files are installed into: $loraRoot"
    Write-Host ""
    $catalog | Select-Object Id, Name, Category, Strength, @{Name = "Recommended"; Expression = { if ($_.Recommended) { "Yes" } else { "" } } } | Format-Table -AutoSize
    Write-Host "R = recommended set (1-7), A = all 12 curated items" -ForegroundColor DarkGray
    Write-Host "B = complete qqnyanddld collection (30 files), or enter numbers such as 1,2,4,9" -ForegroundColor DarkGray
}

Show-Catalog
if ($ListOnly) { exit 0 }

if (-not $Selection) {
    $Selection = Read-Host "Choose downloads [R]"
}
if ([string]::IsNullOrWhiteSpace($Selection)) { $Selection = "R" }

switch ($Selection.Trim().ToUpperInvariant()) {
    "R" { $selected = @($catalog | Where-Object Recommended) }
    "A" { $selected = @($catalog) }
    "B" { $selected = @($qqCollection) }
    default {
        $ids = @()
        foreach ($piece in ($Selection -split "[, ]+" | Where-Object { $_ })) {
            $parsed = 0
            if (-not [int]::TryParse($piece, [ref]$parsed)) {
                throw "'$piece' is not a valid catalog number."
            }
            $ids += $parsed
        }
        $selected = @($catalog | Where-Object { $ids -contains $_.Id })
        if ($selected.Count -ne ($ids | Select-Object -Unique).Count) {
            throw "One or more selected catalog numbers do not exist."
        }
    }
}

if ($selected.Count -eq 0) { throw "No LoRAs were selected." }

Write-Host ""
Write-Host "Selected:" -ForegroundColor Cyan
$selected | ForEach-Object { Write-Host ("  [{0}] {1}" -f $_.Id, $_.Name) }
$answer = Read-Host "Continue? [Y/n]"
if ($answer -and $answer -notmatch "^[Yy]") {
    Write-Host "Cancelled."
    exit 0
}

$installed = 0
$skipped = 0
foreach ($item in $selected) {
    $categoryFolder = Join-Path $loraRoot $item.Category
    New-Item -ItemType Directory -Force -Path $categoryFolder | Out-Null
    $target = Join-Path $categoryFolder $item.File
    $partial = "$target.part"

    $existing = Get-ChildItem -Path $loraRoot -Filter $item.File -File -Recurse -ErrorAction SilentlyContinue | Where-Object { $_.Length -ge 1MB } | Select-Object -First 1
    if ($existing) {
        Write-Host ("SKIP  [{0}] already installed: {1}" -f $item.Id, $existing.FullName) -ForegroundColor DarkYellow
        $skipped++
        continue
    }

    Write-Host ""
    Write-Host ("GET   [{0}] {1}" -f $item.Id, $item.Name) -ForegroundColor Cyan
    if (Test-Path $partial) {
        curl.exe -L --fail --retry 3 --continue-at - $item.Url -o $partial
    } else {
        curl.exe -L --fail --retry 3 $item.Url -o $partial
    }
    if ($LASTEXITCODE -ne 0) {
        throw "Download failed for $($item.Name) with curl exit code $LASTEXITCODE. The partial file was retained for resume."
    }
    if ((Get-Item $partial).Length -lt 1MB) {
        Remove-Item $partial -Force
        throw "The download for $($item.Name) was unexpectedly small and was removed."
    }
    Move-Item $partial $target -Force
    Write-Host ("DONE  {0}" -f $target) -ForegroundColor Green
    $installed++
}

Write-Host ""
Write-Host ("Complete: {0} installed, {1} already present." -f $installed, $skipped) -ForegroundColor Green
Write-Host "Restart ComfyUI (or rescan models), then refresh Ultra Studio."
Write-Host "Use one main/effect LoRA plus at most one or two correction LoRAs initially; do not enable every downloaded LoRA together."
