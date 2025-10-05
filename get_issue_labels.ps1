$issueNum = $args[0]
gh issue view $issueNum --json labels | ConvertFrom-Json | Select-Object -ExpandProperty labels | ForEach-Object { $_.name }
