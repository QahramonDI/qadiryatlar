# Lokal server + brauzerda ochish
$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
$ServerDir = Join-Path $Root "server"

function Test-Server {
  try {
    $r = Invoke-WebRequest -Uri "http://127.0.0.1:3000/api/health" -UseBasicParsing -TimeoutSec 2
    return $r.StatusCode -eq 200
  } catch { return $false }
}

if (-not (Test-Server)) {
  Write-Host "Server ishga tushirilmoqda..." -ForegroundColor Cyan
  Start-Process -FilePath "node" -ArgumentList "index.js" -WorkingDirectory $ServerDir -WindowStyle Minimized
  $deadline = (Get-Date).AddSeconds(15)
  while ((Get-Date) -lt $deadline) {
    Start-Sleep -Milliseconds 500
    if (Test-Server) { break }
  }
}

if (-not (Test-Server)) {
  Write-Host "Server ishga tushmadi. Terminalda: cd server; node index.js" -ForegroundColor Red
  exit 1
}

$url = "http://localhost:3000"
Write-Host ""
Write-Host "Sayt tayyor: $url" -ForegroundColor Green
Write-Host "index.html faylini togri ochmang - faqat shu havoladan kiring." -ForegroundColor Yellow
Write-Host ""
Start-Process $url
