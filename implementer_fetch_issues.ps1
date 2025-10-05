$issues = & "C:\Program Files\GitHub CLI\gh.bat" api repos/:owner/:repo/issues --paginate -X GET -F state=open -F per_page=100 --jq '[.[] | select(.pull_request == null) | {number: .number, title: .title, labels: [.labels[].name], createdAt: .created_at, state: .state}]'
$issues | Out-File -Encoding UTF8 issues_api_implementer.json
