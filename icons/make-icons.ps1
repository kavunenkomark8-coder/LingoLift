$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing
$color = [System.Drawing.Color]::FromArgb(255, 124, 58, 237)
$outDir = $PSScriptRoot
New-Item -ItemType Directory -Force -Path $outDir | Out-Null
foreach ($size in @(192, 512)) {
  $bmp = New-Object System.Drawing.Bitmap $size, $size
  for ($x = 0; $x -lt $size; $x++) {
    for ($y = 0; $y -lt $size; $y++) {
      $bmp.SetPixel($x, $y, $color)
    }
  }
  $path = Join-Path $outDir "icon-$size.png"
  $bmp.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
  $bmp.Dispose()
}
Write-Output 'ok'
