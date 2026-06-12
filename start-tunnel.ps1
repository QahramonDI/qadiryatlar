# Cloudflare Tunnel — lokal serverni internetga chiqarish
# Avval server ishlashi kerak: npm start

$Cloudflared = "C:\Program Files (x86)\cloudflared\cloudflared.exe"
if (-not (Test-Path $Cloudflared)) {
  Write-Host "cloudflared topilmadi. O'rnatish: winget install Cloudflare.cloudflared" -ForegroundColor Red
  exit 1
}

Write-Host ""
Write-Host "Cloudflare tunnel ishga tushmoqda..." -ForegroundColor Cyan
Write-Host "Server: http://localhost:3000" -ForegroundColor Yellow
Write-Host "Quyida *.trycloudflare.com havola paydo bo'ladi — uni ulashing!" -ForegroundColor Green
Write-Host "To'xtatish: Ctrl+C" -ForegroundColor DarkGray
Write-Host ""

& $Cloudflared tunnel --url http://localhost:3000
