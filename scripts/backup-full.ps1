# Script de Backup Completo - Fishing Manager Web
# Executa backup do código e do banco de dados

$projectRoot = Split-Path -Parent $PSScriptRoot

Write-Host "🚀 BACKUP COMPLETO - FISHING MANAGER WEB" -ForegroundColor Magenta
Write-Host "========================================`n" -ForegroundColor Magenta

# Executar backup do código
Write-Host "1️⃣  Executando backup do código-fonte..." -ForegroundColor Cyan
& "$projectRoot\scripts\backup-code.ps1"

Write-Host "`n----------------------------------------`n" -ForegroundColor Gray

# Executar backup do banco de dados
Write-Host "2️⃣  Preparando backup do banco de dados..." -ForegroundColor Cyan
& "$projectRoot\scripts\backup-database.ps1"

Write-Host "`n========================================" -ForegroundColor Magenta
Write-Host "✅ PROCESSO DE BACKUP CONCLUÍDO!" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Magenta
