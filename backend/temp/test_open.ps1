$word = New-Object -ComObject Word.Application
$word.Visible = $false
$word.DisplayAlerts = 0
try {
    $doc = $word.Documents.Open('C:\Projects\report-app-main\backend\temp\test_fa.docx')
    Write-Output 'Word opened successfully'
    $pdfPath = 'C:\Projects\report-app-main\backend\temp\test_fa.pdf'
    $doc.ExportAsFixedFormat($pdfPath, 17)
    Write-Output 'PDF exported successfully'
    $doc.Close(0)
    $word.Quit()
    Write-Output 'PASS'
} catch {
    Write-Output ('FAIL: ' + $_.Exception.Message)
    try { $word.Quit() } catch {}
}
