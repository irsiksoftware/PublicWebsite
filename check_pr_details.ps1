$ErrorActionPreference = "Stop"

$prNumbers = @(148, 147, 146)

foreach ($prNum in $prNumbers) {
    Write-Output "=== Checking PR #$prNum ==="

    # Get detailed PR info including checks
    $prData = gh api "repos/irsiksoftware/TestForAI/pulls/$prNum" | ConvertFrom-Json

    Write-Output "Title: $($prData.title)"
    Write-Output "Branch: $($prData.head.ref)"
    Write-Output "Mergeable: $($prData.mergeable)"
    Write-Output "Mergeable State: $($prData.mergeable_state)"
    Write-Output "Draft: $($prData.draft)"

    # Get commit status
    $sha = $prData.head.sha
    $statusData = gh api "repos/irsiksoftware/TestForAI/commits/$sha/status" | ConvertFrom-Json
    Write-Output "Commit Status: $($statusData.state)"

    # Get check runs
    try {
        $checksData = gh api "repos/irsiksoftware/TestForAI/commits/$sha/check-runs" | ConvertFrom-Json
        Write-Output "Check Runs: $($checksData.total_count) total"
        if ($checksData.total_count -gt 0) {
            foreach ($check in $checksData.check_runs) {
                Write-Output "  - $($check.name): $($check.status) / $($check.conclusion)"
            }
        }
    } catch {
        Write-Output "Check Runs: Unable to fetch"
    }

    Write-Output ""
}
