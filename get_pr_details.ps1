#!/usr/bin/env pwsh
param([int]$prNumber)
gh pr view $prNumber --json number,title,body,headRefName,labels,statusCheckRollup,createdAt,state
