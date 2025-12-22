# Script de Backup do Código - Fishing Manager Web
# Cria um backup completo do código-fonte com timestamp

$timestamp = Get-Date -Format "yyyy-MM-dd_HHmmss"
$backupDir = "backups\code\backup_$timestamp"
$projectRoot = Split-Path -Parent $PSScriptRoot

Write-Host "🔄 Iniciando backup do código-fonte..." -ForegroundColor Cyan

# Criar diretório de backup
New-Item -ItemType Directory -Path "$projectRoot\$backupDir" -Force | Out-Null

# Itens para fazer backup
$itemsToBackup = @(
    "src",
    "public",
    "database",
    "scripts",
    "package.json",
    "package-lock.json",
    "tsconfig.json",
    "tsconfig.node.json",
    "vite.config.ts",
    "tailwind.config.js",
    "postcss.config.js",
    "index.html",
    "README.md",
    ".env.example"
)

# Copiar cada item
foreach ($item in $itemsToBackup) {
    $sourcePath = Join-Path $projectRoot $item
    if (Test-Path $sourcePath) {
        Write-Host "  ✓ Copiando $item..." -ForegroundColor Green
        Copy-Item -Path $sourcePath -Destination "$projectRoot\$backupDir" -Recurse -Force
    } else {
        Write-Host "  ⚠ $item não encontrado, pulando..." -ForegroundColor Yellow
    }
}

Write-Host "`n✅ Backup concluído com sucesso!" -ForegroundColor Green
Write-Host "📂 Local: $backupDir" -ForegroundColor Cyan
Write-Host "📊 Timestamp: $timestamp" -ForegroundColor Cyan

# Listar backups existentes
Write-Host "`n📋 Backups disponíveis:" -ForegroundColor Cyan
Get-ChildItem -Path "$projectRoot\backups\code" -Directory | Sort-Object Name -Descending | Select-Object -First 5 | ForEach-Object {
    $size = (Get-ChildItem -Path $_.FullName -Recurse | Measure-Object -Property Length -Sum).Sum / 1MB
    Write-Host "  • $($_.Name) - $([math]::Round($size, 2)) MB" -ForegroundColor White
}
