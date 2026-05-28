$archivos = Get-ChildItem -Path ".\components",".\pages",".\app",".\scripts" -Recurse -Include "*.tsx","*.ts","*.js" -ErrorAction SilentlyContinue

foreach ($archivo in $archivos) {
    $bytes = [System.IO.File]::ReadAllBytes($archivo.FullName)
    $contenido = [System.Text.Encoding]::GetEncoding("iso-8859-1").GetString($bytes)
    $contenido = $contenido -replace "à³", "ó"
    $contenido = $contenido -replace "à¡", "á"
    $contenido = $contenido -replace "à©", "é"
    $contenido = $contenido -replace "à­", "í"
    $contenido = $contenido -replace "àº", "ú"
    $contenido = $contenido -replace "à±", "ñ"
    $contenido = $contenido -replace "Â°", "°"
    $contenido = $contenido -replace "Â¿", "¿"
    $contenido = $contenido -replace "Â¡", "¡"
    $contenido = $contenido -replace "à‰", "É"
    $utf8 = [System.Text.Encoding]::UTF8.GetBytes($contenido)
    [System.IO.File]::WriteAllBytes($archivo.FullName, $utf8)
    Write-Host "Procesado: $($archivo.Name)"
}
Write-Host "Listo."
