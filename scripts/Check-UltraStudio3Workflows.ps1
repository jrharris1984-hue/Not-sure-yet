[CmdletBinding()]
param(
    [string]$StudioApi = "http://127.0.0.1:8013",
    [string]$ComfyUrl = "http://127.0.0.1:8188",
    [ValidateRange(5, 120)]
    [int]$TimeoutSeconds = 30
)

$ErrorActionPreference = "Stop"
$RepoRoot = Split-Path -Parent $PSScriptRoot
$ComposeFile = Join-Path $RepoRoot "docker-compose.studio3-test.yml"

Write-Host "Ultra Studio 3 read-only workflow QC" -ForegroundColor Cyan
Write-Host "Repository: $RepoRoot"
Write-Host "Studio API: $StudioApi"
Write-Host "ComfyUI:    $ComfyUrl"
Write-Host ""

if (Test-Path $ComposeFile) {
    if (Get-Command docker -ErrorAction SilentlyContinue) {
        Write-Host "Test stack containers:"
        Push-Location $RepoRoot
        try {
            & docker compose -p ultra-studio3-test -f $ComposeFile ps
            if ($LASTEXITCODE -ne 0) {
                Write-Warning "Docker Compose status returned exit code $LASTEXITCODE."
            }
        }
        finally {
            Pop-Location
        }
        Write-Host ""
    }
    else {
        Write-Warning "Docker CLI was not found; skipping the container status check."
    }
}
else {
    Write-Warning "Test Compose file was not found at $ComposeFile."
}

try {
    $null = Invoke-RestMethod -Method Get -Uri "$StudioApi/health" -TimeoutSec $TimeoutSeconds
    Write-Host "Studio backend health: reachable" -ForegroundColor Green
}
catch {
    Write-Host "Studio backend health: FAILED - $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Start the isolated Studio 3 test stack, then run this script again."
    exit 1
}

try {
    $null = Invoke-RestMethod -Method Get -Uri "$ComfyUrl/system_stats" -TimeoutSec $TimeoutSeconds
    Write-Host "ComfyUI system stats: reachable" -ForegroundColor Green
}
catch {
    Write-Warning "Direct ComfyUI check failed ($($_.Exception.Message)); saved-workflow checks will still be attempted through the backend."
}

try {
    $workflows = @(Invoke-RestMethod -Method Get -Uri "$StudioApi/workflows" -TimeoutSec $TimeoutSeconds)
}
catch {
    Write-Host "Could not read saved workflows: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

if ($workflows.Count -eq 0) {
    Write-Warning "The backend returned no saved workflows."
    exit 0
}

Write-Host ""
Write-Host "Checking $($workflows.Count) saved workflows against connected ComfyUI..."
$results = @()
$index = 0

foreach ($workflow in $workflows) {
    $index++
    $name = [string]$workflow.name
    $id = [string]$workflow.id
    if ([string]::IsNullOrWhiteSpace($id)) {
        $results += [pscustomobject]@{
            Name = $name
            Compatible = $false
            Nodes = 0
            Issues = 1
            Details = "Workflow has no ID."
        }
        continue
    }

    $encodedId = [uri]::EscapeDataString($id)
    $uri = "$StudioApi/workflows/$encodedId/validate"

    Write-Progress -Activity "Validating ComfyUI workflows" -Status "$index of $($workflows.Count): $name" -PercentComplete ([int](100 * $index / $workflows.Count))

    try {
        # This endpoint only compares the saved graph to ComfyUI /object_info.
        $validation = Invoke-RestMethod -Method Post -Uri $uri -TimeoutSec $TimeoutSeconds
        $issues = @($validation.issues)
        $errors = @($issues | Where-Object { $_.severity -eq "error" })
        $details = ($errors | Select-Object -First 4 | ForEach-Object {
            $node = if ($_.node_id) { " node $($_.node_id)" } else { "" }
            "$($_.code)$node : $($_.message)"
        }) -join " | "

        $results += [pscustomobject]@{
            Name = $name
            Compatible = [bool]$validation.compatible
            Nodes = [int]$validation.checked_nodes
            Issues = $issues.Count
            Details = $details
        }
    }
    catch {
        $results += [pscustomobject]@{
            Name = $name
            Compatible = $false
            Nodes = 0
            Issues = 1
            Details = "Validation request failed: $($_.Exception.Message)"
        }
    }
}

Write-Progress -Activity "Validating ComfyUI workflows" -Completed

Write-Host ""
$results |
    Sort-Object Compatible, Name |
    Format-Table -Property Compatible, Nodes, Issues, Name -AutoSize

$failed = @($results | Where-Object { -not $_.Compatible })
$passed = $results.Count - $failed.Count

Write-Host ""
Write-Host "Schema-compatible: $passed / $($results.Count)" -ForegroundColor Green
Write-Host "Needs review:       $($failed.Count)" -ForegroundColor $(if ($failed.Count) { "Yellow" } else { "Green" })

foreach ($item in $failed) {
    Write-Host ""
    Write-Host "FAILED: $($item.Name)" -ForegroundColor Yellow
    if ($item.Details) {
        Write-Host "  $($item.Details)"
    }
    else {
        Write-Host "  Validator returned $($item.Issues) issue(s); inspect the workflow in Settings."
    }
}

Write-Host ""
Write-Host "This is a schema preflight only. It does not load models or prove a render will succeed."
Write-Host "No workflow, prompt, setting, or container state was changed."
