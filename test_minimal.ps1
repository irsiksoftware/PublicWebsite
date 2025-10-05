$mergeable = "MERGEABLE"

switch ($mergeable) {
    "CONFLICTING" {
        Write-Host "Conflict"
    }
    "MERGEABLE" {
        Write-Host "Mergeable"
    }
}

Write-Host "Done"
