$body = Get-Content pr_body_99.txt -Raw
& 'C:\Program Files\GitHub CLI\gh.bat' pr create --title 'Fixes #99: Create search bar with icon and focus glow' --body $body --head feature/issue-99 --base main
