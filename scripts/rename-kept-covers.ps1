# Mavzuga mos saqlanadigan 5 ta rasmni yangi nomga ko'chirish
$dir = Join-Path $PSScriptRoot "..\assets\works"
$renames = @{
  "kitob-dosti.png"      = "kitob-kuch.png"
  "mehribon-qiz.png"     = "keksalarni-hurmat-qil.png"
  "vatan-yoshlari.png"   = "yurt-madhi.png"
}
foreach ($pair in $renames.GetEnumerator()) {
  $src = Join-Path $dir $pair.Key
  $dst = Join-Path $dir $pair.Value
  if (Test-Path $src) {
    Move-Item -Force $src $dst
    Write-Host "OK: $($pair.Key) -> $($pair.Value)"
  } else {
    Write-Host "Skip (yo'q): $($pair.Key)"
  }
}
Write-Host "karim-polvon.png va ona-qarzi.png nomi o'zgarmaydi."
