$archivos = Get-ChildItem -Path ".\components",".\pages",".\app" -Recurse -Include "*.tsx","*.ts" -ErrorAction SilentlyContinue

foreach ($archivo in $archivos) {
    $contenido = [System.IO.File]::ReadAllText($archivo.FullName, [System.Text.Encoding]::UTF8)
    
    $contenido = $contenido -replace "Espaà±ol", "Español"
    $contenido = $contenido -replace "FranàƒÂ§ais", "Français"
    $contenido = $contenido -replace "Franà§ais", "Français"
    $contenido = $contenido -replace "Gestià³n", "Gestión"
    $contenido = $contenido -replace "Direccià³n", "Dirección"
    $contenido = $contenido -replace "seccià³n", "sección"
    $contenido = $contenido -replace "Pà¡ramo", "Páramo"
    $contenido = $contenido -replace "Pà±ramo", "Páramo"
    $contenido = $contenido -replace "Descripcià³n", "Descripción"
    $contenido = $contenido -replace "Poblacià³n", "Población"
    $contenido = $contenido -replace "Climà¡tico", "Climático"
    $contenido = $contenido -replace "Estadà­sticas", "Estadísticas"
    $contenido = $contenido -replace "à³", "ó"
    $contenido = $contenido -replace "à¡", "á"
    $contenido = $contenido -replace "à©", "é"
    $contenido = $contenido -replace "à­", "í"
    $contenido = $contenido -replace "àº", "ú"
    $contenido = $contenido -replace "à±", "ñ"
    $contenido = $contenido -replace "à§", "ç"
    $contenido = $contenido -replace "àƒ", "à"
    $contenido = $contenido -replace "Â°", "°"
    $contenido = $contenido -replace "Â¿", "¿"
    $contenido = $contenido -replace "Â¡", "¡"
    
    [System.IO.File]::WriteAllText($archivo.FullName, $contenido, [System.Text.Encoding]::UTF8)
    Write-Host "Procesado: $($archivo.Name)"
}
Write-Host "Listo."
