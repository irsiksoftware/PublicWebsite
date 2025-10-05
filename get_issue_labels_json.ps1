#!/usr/bin/env pwsh
param([int]$issueNumber)
$output = gh issue view $issueNumber --json labels 2>&1
Write-Host $output
