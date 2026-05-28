$archivos = Get-ChildItem -Path ".\components",".\pages",".\app" -Recurse -Include "*.tsx","*.ts" -ErrorAction SilentlyContinue

foreach ($archivo in $archivos) {
    $contenido = [System.IO.File]::ReadAllText($archivo.FullName, [System.Text.Encoding]::UTF8)
    $contenido = $contenido -replace "Mise à  jour", "Mise à jour"
    $contenido = $contenido -replace "mise à  jour", "mise à jour"
    $contenido = $contenido -replace "à ", "à"
    [System.IO.File]::WriteAllText($archivo.FullName, $contenido, [System.Text.Encoding]::UTF8)
    Write-Host "Procesado: $($archivo.Name)"
}
Write-Host "Listo."
