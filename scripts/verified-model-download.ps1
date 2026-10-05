# Shared verified transfer logic. Dot-source this file; importing it has no side effects.
function Test-VerifiedFile([string]$Path, [long]$Bytes, [string]$Hash) {
    if (-not (Test-Path -LiteralPath $Path -PathType Leaf)) { return $false }
    if ((Get-Item -LiteralPath $Path).Length -ne $Bytes) { return $false }
    Write-Host "Download complete. Checking SHA-256: $Path (this can take several minutes) ..."
    return (Get-FileHash -LiteralPath $Path -Algorithm SHA256).Hash -eq $Hash
}

function Receive-VerifiedModel {
    param(
        [string]$Url, [string]$Partial, [long]$Bytes, [string]$Hash,
        [string[]]$Headers = @(),
        [ValidateRange(1, 10)][int]$MaxAttempts = 5,
        [ValidateRange(0, 30)][int]$RetryDelaySeconds = 2,
        [scriptblock]$Transfer
    )
    if (-not $Transfer) {
        $Transfer = {
            param($TransferUrl, $TransferPath, $TransferHeaders)
            # Retry outside curl so every attempt reads the current file length
            # and obtains a fresh redirect. Do not discard downloaded bytes.
            $arguments = @('--fail', '--location', '--connect-timeout', '30', '--speed-limit', '1024', '--speed-time', '120', '--continue-at', '-', '--output', $TransferPath)
            foreach ($header in $TransferHeaders) { $arguments += @('--header', $header) }
            & curl.exe @arguments $TransferUrl
            return $LASTEXITCODE
        }
    }
    for ($attempt = 1; $attempt -le $MaxAttempts; $attempt++) {
        # A previous transfer may have returned an error after writing every byte.
        # Trust verified content, rather than the transport's exit status.
        if (Test-VerifiedFile $Partial $Bytes $Hash) { return }
        if ((Test-Path -LiteralPath $Partial -PathType Leaf) -and (Get-Item -LiteralPath $Partial).Length -ge $Bytes) {
            $invalid = "$Partial.invalid-$([Guid]::NewGuid().ToString('N'))"
            Move-Item -LiteralPath $Partial -Destination $invalid
            Write-Host "Size or checksum mismatch. Invalid file retained: $invalid"
        }
        $offset = if (Test-Path -LiteralPath $Partial -PathType Leaf) { (Get-Item -LiteralPath $Partial).Length } else { 0 }
        Write-Host "Transfer attempt $attempt/$MaxAttempts; resuming from $offset of $Bytes bytes."
        $transferExit = & $Transfer $Url $Partial $Headers
        if (Test-VerifiedFile $Partial $Bytes $Hash) {
            if ($transferExit -ne 0) { Write-Host 'The connection reported an error, but the complete file passed SHA-256 verification.' -ForegroundColor Green }
            return
        }
        if ($transferExit -eq 23) { throw "Cannot write the download. Check free space and folder permissions. Partial file retained: $Partial" }
        if ($transferExit -eq 33) { throw "Server refused to resume the download. Partial file retained without restarting: $Partial" }
        if ($attempt -lt $MaxAttempts) {
            Write-Host 'Transfer incomplete or checksum failed. Retrying with the existing partial file.'
            if ($RetryDelaySeconds) { Start-Sleep -Seconds $RetryDelaySeconds }
        }
    }
    throw "Download did not pass verification after $MaxAttempts attempts. Partial file retained: $Partial. Run again to resume. HTTP authentication errors may require CIVITAI_API_KEY or a completed website download."
}
