# 🔐 Sistema de Backup e Recuperação - Fishing Manager Web

Este documento descreve como fazer backup e restaurar o código e dados do sistema.

## 📁 Estrutura de Backups

```
backups/
├── code/          # Backups do código-fonte
│   └── backup_YYYY-MM-DD_HHMMSS/
└── database/      # Backups do banco de dados
    └── backup_YYYY-MM-DD_HHMMSS/
```

## 🚀 Scripts Disponíveis

### 1. Backup Completo (Recomendado)

```powershell
.\scripts\backup-full.ps1
```
Executa backup do código E prepara backup do banco de dados.

### 2. Backup Apenas do Código

```powershell
.\scripts\backup-code.ps1
```
Cria backup completo do código-fonte com timestamp.

### 3. Backup do Banco de Dados

```powershell
.\scripts\backup-database.ps1
```
Exibe instruções para backup do Supabase.

### 4. Restaurar Código

```powershell
# Modo interativo (escolha da lista)
.\scripts\restore-code.ps1

# Modo direto
.\scripts\restore-code.ps1 -BackupName backup_2024-01-01_120000
```

## 📊 Backup do Banco de Dados Supabase

### Opção 1: Via Dashboard (Mais Fácil)

1. Acesse: https://app.supabase.com
2. Selecione seu projeto
3. Vá em **Database > Backups**
4. Clique em **Download Backup**
5. Salve o arquivo em `backups/database/backup_TIMESTAMP/`

### Opção 2: Via Supabase CLI (Mais Completo)

```bash
# Instalar Supabase CLI (uma vez)
npm install -g supabase

# Fazer login
npx supabase login

# Backup do schema
npx supabase db dump -f backups/database/backup_TIMESTAMP/schema.sql

# Backup dos dados
npx supabase db dump --data-only -f backups/database/backup_TIMESTAMP/data.sql
```

### Opção 3: Export de Tabelas (Manual)

No Dashboard Supabase:
1. **Table Editor** > Selecione a tabela
2. Clique em **"..."** > **Export as CSV/JSON**
3. Salve em `backups/database/backup_TIMESTAMP/`

## 🔄 Restauração do Banco de Dados

### Via Supabase CLI

```bash
# Restaurar schema
npx supabase db reset
psql -h [SEU_HOST] -U postgres -d postgres -f backups/database/backup_TIMESTAMP/schema.sql

# Restaurar dados
psql -h [SEU_HOST] -U postgres -d postgres -f backups/database/backup_TIMESTAMP/data.sql
```

### Via Dashboard

1. **SQL Editor** no Supabase
2. Copie e cole o conteúdo do arquivo SQL
3. Execute o script

## 📋 Tabelas do Sistema

O sistema utiliza as seguintes tabelas que devem ser backupadas:

- `profiles` - Perfis de usuários
- `company_settings` - Configurações das empresas
- `circuits` - Circuitos de pesca
- `stages` - Etapas dos circuitos
- `teams` - Equipes inscritas
- `team_members` - Membros das equipes
- `results` - Resultados das competições
- `payments` - Pagamentos
- `carousel_images` - Imagens do carrossel

## ⚠️ Boas Práticas

1. **Faça backup ANTES de alterações importantes**
2. **Mantenha pelo menos 5 backups recentes**
3. **Teste a restauração periodicamente**
4. **Guarde backups em local seguro (nuvem)**
5. **Documente o timestamp do último backup estável**

## 🔖 Backup Rápido Antes de Alterações

```powershell
# Execute sempre antes de fazer mudanças importantes
.\scripts\backup-full.ps1

# Anote o timestamp do backup
# Exemplo: backup_2024-12-12_161704
```

## 📝 Arquivo .gitignore

Os backups já estão configurados no `.gitignore`:

```
backups/
```

Isso evita que backups sejam commitados no Git (muito grandes).

## 💾 Backup para Armazenamento Externo

Para copiar backups para local seguro:

```powershell
# Copiar para outra pasta/drive
Copy-Item -Path "backups" -Destination "D:\Backups\FishingManagerWeb" -Recurse

# Ou compactar
Compress-Archive -Path "backups" -DestinationPath "FishingManagerWeb_Backup_$(Get-Date -Format 'yyyy-MM-dd').zip"
```

## 🆘 Recuperação de Emergência

Se algo der errado:

1. **Pare o servidor de desenvolvimento** (Ctrl+C)
2. **Execute o script de restauração**: `.\scripts\restore-code.ps1`
3. **Selecione o backup mais recente estável**
4. **Execute** `npm install` (se necessário)
5. **Restaure o banco de dados** usando um dos métodos acima
6. **Reinicie o servidor**: `npm run dev`

## 📞 Suporte

Para dúvidas sobre backup e recuperação, consulte:
- Documentação do Supabase: https://supabase.com/docs/guides/database/backups
- Issues do projeto no GitHub
