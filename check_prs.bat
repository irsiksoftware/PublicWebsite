@echo off
echo === Checking Open PRs ===
echo.

gh pr list --state open --json number,title,mergeable,headRefName

echo.
echo === PR #156 Details ===
gh pr view 156 --json number,title,mergeable,headRefName,createdAt

echo.
echo === PR #155 Details ===
gh pr view 155 --json number,title,mergeable,headRefName,createdAt
