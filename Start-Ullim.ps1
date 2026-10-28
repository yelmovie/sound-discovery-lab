$env:TEMP = 'D:\DevTemp'
$env:TMP = 'D:\DevTemp'
Set-Location -LiteralPath $PSScriptRoot
node scripts/server.mjs
