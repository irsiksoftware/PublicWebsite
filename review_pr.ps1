#!/usr/bin/env pwsh
param([int]$prNumber)
Write-Host "=== PR #$prNumber Diff ==="
gh pr diff $prNumber
Write-Host "`n=== PR #$prNumber Checks ==="
gh pr checks $prNumber
