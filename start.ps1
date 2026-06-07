$project = Split-Path -Parent $MyInvocation.MyCommand.Path
$env:Path = [Environment]::GetEnvironmentVariable('Path','Machine') + ';' + [Environment]::GetEnvironmentVariable('Path','User')
$env:NODE_PATH = "$env:APPDATA\npm\node_modules"
$log = "$project\server.log"

# Kill any existing node process on port 3000
Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object { $_.Id -ne $pid } | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 1

# Start server in background job
$job = Start-Job -ScriptBlock {
  param($proj, $p, $np)
  $env:Path = $p
  $env:NODE_PATH = $np
  Set-Location $proj
  & "C:\Program Files\nodejs\node.exe" "deploy.js"
} -ArgumentList $project, $env:Path, $env:NODE_PATH

Start-Sleep -Seconds 3

# Show server log
Write-Host "`nServidor iniciado. Job ID: $($job.Id)`n"
Get-Content "$project\server.log" -ErrorAction SilentlyContinue

Write-Host "`nPara ver el estado: Receive-Job -Id $($job.Id)"
Write-Host "Para detener: Stop-Job -Id $($job.Id); Remove-Job -Id $($job.Id)`n"

# Keep the job alive
$job | Wait-Job
