param(
    [string]$Folder,
    [string]$Output = (Join-Path (Get-Location) 'ultra-studio-lora-hashes.json')
)
$ErrorActionPreference = 'Stop'
if (-not $Folder) {
    Add-Type -AssemblyName System.Windows.Forms
    $picker = New-Object System.Windows.Forms.FolderBrowserDialog
    $picker.Description = 'Select the ComfyUI models\loras folder (not an individual model folder)'
    if ($picker.ShowDialog() -ne [System.Windows.Forms.DialogResult]::OK) { return }
    $Folder = $picker.SelectedPath
    $picker.Dispose()
}
$rootPath = (Resolve-Path -LiteralPath $Folder).Path.TrimEnd('\', '/')
if (-not (Test-Path -LiteralPath $rootPath -PathType Container)) { throw 'Choose a LoRA folder.' }
$files = @(Get-ChildItem -LiteralPath $rootPath -Recurse -File | Where-Object { $_.Extension -in '.safetensors', '.ckpt', '.pt' })
if ($files.Count -gt 5000) { throw 'Select a folder with at most 5000 LoRAs.' }
$results = @()
$index = 0
foreach ($file in $files) {
    $index++
    Write-Progress -Activity 'Hashing LoRAs locally (no uploads)' -Status "$index of $($files.Count): $($file.Name)" -PercentComplete (100 * $index / $files.Count)
    $beforeLength = $file.Length
    $beforeWrite = $file.LastWriteTimeUtc
    $digest = (Get-FileHash -LiteralPath $file.FullName -Algorithm SHA256).Hash.ToLowerInvariant()
    $file.Refresh()
    if ($file.Length -ne $beforeLength -or $file.LastWriteTimeUtc -ne $beforeWrite) { throw "File changed during hashing: $($file.Name). Retry after downloads finish." }
    $relative = $file.FullName.Substring($rootPath.Length + 1).Replace('\', '/')
    $results += @{ name = $relative; sha256 = $digest }
}
Write-Progress -Activity 'Hashing LoRAs locally (no uploads)' -Completed
$json = @{ version = 1; files = @($results) } | ConvertTo-Json -Depth 5
[System.IO.File]::WriteAllText($Output, $json, (New-Object System.Text.UTF8Encoding($false)))
Write-Host "Saved $($results.Count) file hashes to $Output. Import this JSON in Ultra Studio's LoRA scanner."
