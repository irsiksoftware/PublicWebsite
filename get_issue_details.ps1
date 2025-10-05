#!/usr/bin/env pwsh
param([int]$issueNumber)
gh issue view $issueNumber --json number,title,labels,state
