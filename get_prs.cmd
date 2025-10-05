@echo off
gh pr list --state open --json number,title,headRefName,labels,body > open_prs.json
type open_prs.json
