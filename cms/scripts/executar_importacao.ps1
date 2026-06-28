# executar_importacao.ps1
# Copia documentos para o container SAPL e executa a importação.
# Execute de: D:\portal legislativo\scripts\

$container = "taquari-sapl-1"
$base_local = "D:\portal legislativo\docs\docs taquari"
$base_container = "/tmp/taquari"

Write-Host "=== Preparando container ===" -ForegroundColor Cyan

# Criar estrutura no container
docker exec $container mkdir -p `
    "$base_container/decretos" `
    "$base_container/resolucoes" `
    "$base_container/atas" `
    "$base_container/ordemdodia" `
    "$base_container/expediente" `
    "$base_container/requerimentos" `
    "$base_container/indicacoes"

# Copiar pastas
Write-Host "Copiando decretos..." -ForegroundColor Yellow
docker cp "$base_local\decretos\." "${container}:${base_container}/decretos/"

Write-Host "Copiando resolucoes..." -ForegroundColor Yellow
docker cp "$base_local\resolucoes\." "${container}:${base_container}/resolucoes/"

Write-Host "Copiando atas..." -ForegroundColor Yellow
docker cp "$base_local\atas\." "${container}:${base_container}/atas/"

Write-Host "Copiando ordemdodia..." -ForegroundColor Yellow
docker cp "$base_local\ordemdodia\." "${container}:${base_container}/ordemdodia/"

Write-Host "Copiando expediente..." -ForegroundColor Yellow
docker cp "$base_local\expediente\." "${container}:${base_container}/expediente/"

Write-Host "Copiando requerimentos..." -ForegroundColor Yellow
docker cp "$base_local\requerimentos\." "${container}:${base_container}/requerimentos/"

Write-Host "Copiando indicacoes..." -ForegroundColor Yellow
docker cp "$base_local\indicacoes\." "${container}:${base_container}/indicacoes/"

# Copiar script Python
Write-Host "Copiando script de importacao..." -ForegroundColor Yellow
docker cp "$PSScriptRoot\importar_taquari.py" "${container}:/tmp/importar_taquari.py"

# Executar importação
Write-Host "`n=== Executando importacao ===" -ForegroundColor Cyan
docker exec -w /var/interlegis/sapl $container python /tmp/importar_taquari.py

Write-Host "`n=== Concluido ===" -ForegroundColor Green
