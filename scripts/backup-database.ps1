# Script de Backup do Banco de Dados - Fishing Manager Web
# Exporta dados das tabelas do Supabase para JSON

$timestamp = Get-Date -Format "yyyy-MM-dd_HHmmss"
$backupDir = "backups\database\backup_$timestamp"
$projectRoot = Split-Path -Parent $PSScriptRoot

Write-Host "🔄 Iniciando backup do banco de dados..." -ForegroundColor Cyan

# Criar diretório de backup
New-Item -ItemType Directory -Path "$projectRoot\$backupDir" -Force | Out-Null

Write-Host "`n📝 INSTRUÇÕES PARA BACKUP DO SUPABASE:" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Yellow
Write-Host "`nPara fazer backup completo dos dados do Supabase:" -ForegroundColor White
Write-Host "`n1️⃣  BACKUP MANUAL via Dashboard:" -ForegroundColor Cyan
Write-Host "   • Acesse: https://app.supabase.com" -ForegroundColor White
Write-Host "   • Vá em seu projeto" -ForegroundColor White
Write-Host "   • Database > Backups" -ForegroundColor White
Write-Host "   • Clique em 'Download Backup'" -ForegroundColor White
Write-Host "`n2️⃣  BACKUP VIA CLI (Recomendado):" -ForegroundColor Cyan
Write-Host "   Execute os seguintes comandos:" -ForegroundColor White
Write-Host "   npx supabase db dump -f $backupDir\schema.sql" -ForegroundColor Gray
Write-Host "   npx supabase db dump --data-only -f $backupDir\data.sql" -ForegroundColor Gray
Write-Host "`n3️⃣  EXPORT DE TABELAS ESPECÍFICAS:" -ForegroundColor Cyan
Write-Host "   No Dashboard Supabase, para cada tabela:" -ForegroundColor White
Write-Host "   • Table Editor > Selecione a tabela" -ForegroundColor White
Write-Host "   • Clique em '...' > Export as CSV/JSON" -ForegroundColor White
Write-Host "   • Salve em: $backupDir" -ForegroundColor White

# Criar arquivo de metadados
$metadata = @{
    timestamp = $timestamp
    datetime = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    project = "Fishing Manager Web"
    tables = @(
        "profiles",
        "company_settings", 
        "circuits",
        "stages",
        "teams",
        "team_members",
        "results",
        "payments",
        "carousel_images"
    )
    instructions = "Use Supabase Dashboard ou CLI para restaurar o backup"
} | ConvertTo-Json -Depth 10

$metadata | Out-File -FilePath "$projectRoot\$backupDir\metadata.json" -Encoding UTF8

Write-Host "`n📋 Tabelas para backup:" -ForegroundColor Cyan
$metadata | ConvertFrom-Json | Select-Object -ExpandProperty tables | ForEach-Object {
    Write-Host "  • $_" -ForegroundColor White
}

Write-Host "`n✅ Estrutura de backup criada!" -ForegroundColor Green
Write-Host "📂 Local: $backupDir" -ForegroundColor Cyan
Write-Host "`n⚠️  Importante: Execute o backup real usando as instruções acima" -ForegroundColor Yellow
