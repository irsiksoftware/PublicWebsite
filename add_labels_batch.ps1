# Add type labels to issues

$issues = @(
    @{num=138; label="testing"},
    @{num=137; label="feature"},
    @{num=136; label="feature"},
    @{num=135; label="feature"},
    @{num=134; label="feature"},
    @{num=133; label="feature"},
    @{num=132; label="feature"},
    @{num=131; label="feature"},
    @{num=130; label="feature"},
    @{num=129; label="feature"},
    @{num=128; label="feature"},
    @{num=127; label="feature"},
    @{num=126; label="feature"},
    @{num=125; label="feature"},
    @{num=124; label="feature"},
    @{num=123; label="feature"},
    @{num=122; label="feature"},
    @{num=121; label="feature"},
    @{num=120; label="feature"},
    @{num=119; label="feature"},
    @{num=118; label="feature"},
    @{num=117; label="feature"},
    @{num=116; label="feature"},
    @{num=115; label="feature"},
    @{num=114; label="feature"},
    @{num=113; label="feature"},
    @{num=112; label="feature"},
    @{num=111; label="feature"},
    @{num=110; label="feature"},
    @{num=109; label="feature"},
    @{num=108; label="feature"},
    @{num=107; label="feature"},
    @{num=106; label="feature"},
    @{num=105; label="feature"},
    @{num=104; label="feature"},
    @{num=103; label="feature"},
    @{num=102; label="feature"},
    @{num=101; label="feature"},
    @{num=100; label="feature"},
    @{num=99; label="feature"},
    @{num=98; label="feature"},
    @{num=97; label="feature"},
    @{num=96; label="feature"},
    @{num=95; label="feature"},
    @{num=94; label="feature"},
    @{num=93; label="feature"},
    @{num=92; label="feature"},
    @{num=91; label="feature"},
    @{num=90; label="feature"},
    @{num=89; label="feature"},
    @{num=88; label="feature"},
    @{num=87; label="feature"},
    @{num=86; label="feature"},
    @{num=85; label="feature"},
    @{num=84; label="feature"},
    @{num=83; label="feature"},
    @{num=82; label="feature"},
    @{num=81; label="feature"},
    @{num=80; label="feature"},
    @{num=79; label="feature"},
    @{num=78; label="feature"},
    @{num=77; label="feature"},
    @{num=76; label="feature"},
    @{num=75; label="feature"},
    @{num=74; label="feature"}
)

$success = 0
$failed = 0

foreach ($issue in $issues) {
    Write-Host "Adding '$($issue.label)' to issue #$($issue.num)..." -NoNewline
    $result = gh issue edit $issue.num --add-label $issue.label 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host " Success" -ForegroundColor Green
        $success++
    } else {
        Write-Host " Failed: $result" -ForegroundColor Red
        $failed++
    }
}

Write-Host ""
Write-Host "============================================================"
Write-Host "SUMMARY"
Write-Host "============================================================"
Write-Host "Success: $success"
Write-Host "Failed: $failed"
