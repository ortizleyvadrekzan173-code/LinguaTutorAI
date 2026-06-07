# LinguaTutor AI — Servidor local
# Abre http://localhost:8080 en tu navegador
$port = 8080
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$port/")
$listener.Start()
Write-Host "🚀 LinguaTutor AI corriendo en http://localhost:$port/" -ForegroundColor Cyan
Write-Host "Presiona Ctrl+C para detener" -ForegroundColor Yellow
while ($listener.IsListening) {
  $ctx = $listener.GetContext()
  $req = $ctx.Request
  $res = $ctx.Response
  $path = $req.Url.LocalPath.TrimStart('/') -replace '/', '\'
  if ([string]::IsNullOrEmpty($path)) { $path = "index.html" }
  $file = Join-Path $root $path
  if (Test-Path $file -PathType Leaf) {
    $content = [System.IO.File]::ReadAllBytes($file)
    $ext = [System.IO.Path]::GetExtension($file)
    $mime = @{
      '.html' = 'text/html'; '.css' = 'text/css'; '.js' = 'application/javascript'
      '.png' = 'image/png'; '.svg' = 'image/svg+xml'; '.json' = 'application/json'
      '.ico' = 'image/x-icon'; '.webp' = 'image/webp'
    }
    $res.ContentType = if ($mime.ContainsKey($ext)) { $mime[$ext] } else { 'application/octet-stream' }
    $res.ContentLength64 = $content.Length
    $res.OutputStream.Write($content, 0, $content.Length)
  } else {
    $res.StatusCode = 404
    $msg = [System.Text.Encoding]::UTF8.GetBytes("404 - No encontrado")
    $res.OutputStream.Write($msg, 0, $msg.Length)
  }
  $res.OutputStream.Close()
}
$listener.Stop()
