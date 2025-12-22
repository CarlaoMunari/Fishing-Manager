# Script de Restauração do Código - Fishing Manager Web
# Restaura um backup específico do código-fonte

param(
    [Parameter(Mandatory=$false)]
    [string]$BackupName
)

$projectRoot = Split-Path -Parent $PSScriptRoot

Write-Host "🔄 RESTAURAÇÃO DE CÓDIGO - FISHING MANAGER WEB" -ForegroundColor Magenta
Write-Host "===============================================`n" -ForegroundColor Magenta

# Listar backups disponíveis
$backups = Get-ChildItem -Path "$projectRoot\backups\code" -Directory | Sort-Object Name -Descending

if ($backups.Count -eq 0) {
    Write-Host "❌ Nenhum backup encontrado!" -ForegroundColor Red
    exit 1
}

Write-Host "📋 Backups disponíveis:" -ForegroundColor Cyan
for ($i = 0; $i -lt $backups.Count; $i++) {
    $size = (Get-ChildItem -Path $backups[$i].FullName -Recurse | Measure-Object -Property Length -Sum).Sum / 1MB
    Write-Host "  [$($i+1)] $($backups[$i].Name) - $([math]::Round($size, 2)) MB" -ForegroundColor White
}

# Se não foi especificado, perguntar qual backup restaurar
if (-not $BackupName) {
    Write-Host "`nℹ️  Uso: .\restore-code.ps1 -BackupName backup_2024-01-01_120000" -ForegroundColor Yellow
    Write-Host "ou selecione um número da lista acima:" -ForegroundColor Yellow
    $selection = Read-Host "Digite o número do backup para restaurar (ou Enter para cancelar)"
    
    if ([string]::IsNullOrWhiteSpace($selection)) {
        Write-Host "❌ Operação cancelada." -ForegroundColor Red
        exit 0
    }
    
    $index = [int]$selection - 1
    if ($index -lt 0 -or $index -ge $backups.Count) {
        Write-Host "❌ Seleção inválida!" -ForegroundColor Red
        exit 1
    }
    
    $BackupName = $backups[$index].Name
}

$backupPath = "$projectRoot\backups\code\$BackupName"

if (-not (Test-Path $backupPath)) {
    Write-Host "❌ Backup não encontrado: $BackupName" -ForegroundColor Red
    exit 1
}

Write-Host "`n⚠️  ATENÇÃO: Esta operação irá sobrescrever os arquivos atuais!" -ForegroundColor Yellow
$confirm = Read-Host "Deseja continuar? (s/N)"

if ($confirm -ne 's' -and $confirm -ne 'S') {
    Write-Host "❌ Operação cancelada." -ForegroundColor Red
    exit 0
}

Write-Host "`n🔄 Restaurando backup: $BackupName" -ForegroundColor Cyan

# Itens para restaurar
$items = Get-ChildItem -Path $backupPath

foreach ($item in $items) {
    Write-Host "  ✓ Restaurando $($item.Name)..." -ForegroundColor Green
    Copy-Item -Path $item.FullName -Destination $projectRoot -Recurse -Force
}

Write-Host "`n✅ Restauração concluída com sucesso!" -ForegroundColor Green
Write-Host "📂 Backup restaurado: $BackupName" -ForegroundColor Cyan
Write-Host "`n⚠️  Lembre-se de executar 'npm install' se necessário" -ForegroundColor Yellow
