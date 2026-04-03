$ErrorActionPreference = 'Stop'
$src = Join-Path $PSScriptRoot 'icon-source.png'
if (-not (Test-Path $src)) {
  $src = 'C:\Users\User\.cursor\projects\d-AI-Anki\assets\icon-lingolift-master.png'
}
if (-not (Test-Path $src)) {
  Write-Error "Source icon not found: $src"
  exit 1
}
Add-Type -AssemblyName System.Drawing
$img = [System.Drawing.Image]::FromFile($src)
function Save-Scaled {
  param([int]$Size, [string]$Path)
  $bmp = New-Object System.Drawing.Bitmap $Size, $Size
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
  $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $g.DrawImage($img, 0, 0, $Size, $Size)
  $bmp.Save($Path, [System.Drawing.Imaging.ImageFormat]::Png)
  $g.Dispose()
  $bmp.Dispose()
}
$out = $PSScriptRoot
Save-Scaled -Size 512 -Path (Join-Path $out 'icon-512.png')
Save-Scaled -Size 192 -Path (Join-Path $out 'icon-192.png')
$root = Split-Path $out -Parent
Copy-Item -Force (Join-Path $out 'icon-192.png') (Join-Path $root 'android-chrome-192x192.png')
Copy-Item -Force (Join-Path $out 'icon-512.png') (Join-Path $root 'android-chrome-512x512.png')
$img.Dispose()
Write-Output 'ok'
