$ErrorActionPreference = "Stop"

# Get repo info
$repoInfo = gh repo view --json nameWithOwner | ConvertFrom-Json
$repo = $repoInfo.nameWithOwner

# Get all open issues via API
$issuesJson = gh api "repos/$repo/issues?state=open&per_page=100" | ConvertFrom-Json

# Filter and process
$availableIssues = @()
foreach ($issue in $issuesJson) {
    # Skip PRs
    if ($issue.pull_request) { continue }

    # Check for WIP label
    $hasWip = $false
    $priority = "NONE"
    $deps = @()

    foreach ($label in $issue.labels) {
        $labelName = $label.name
        if ($labelName -eq "wip") {
            $hasWip = $true
            break
        }
        if ($labelName -match "^(CRITICAL|URGENT|HIGH|MEDIUM|LOW)$") {
            $priority = $labelName.ToUpper()
        }
        if ($labelName -match "^d\d+$") {
            $deps += $labelName
        }
    }

    if (-not $hasWip) {
        $availableIssues += @{
            number = $issue.number
            title = $issue.title
            priority = $priority
            dependencies = $deps
            createdAt = $issue.created_at
        }
    }
}

# Priority mapping
$priorityMap = @{
    "CRITICAL" = 5
    "URGENT" = 4
    "HIGH" = 3
    "MEDIUM" = 2
    "LOW" = 1
    "NONE" = 0
}

# Sort by priority (desc) then by createdAt (asc)
$sorted = $availableIssues | Sort-Object -Property @{
    Expression = { $priorityMap[$_.priority] }
    Descending = $true
}, @{
    Expression = { $_.createdAt }
    Descending = $false
}

# Output as JSON
$sorted | ConvertTo-Json -Depth 10
