# ⚠️ SOLUÇÃO: Erro de Política de Execução do PowerShell

## O Problema

Você está vendo este erro:
```
O arquivo C:\Program Files\nodejs\npm.ps1 não pode ser carregado porque a execução de scripts foi desabilitada neste sistema.
```

Isso acontece porque o Windows bloqueia a execução de scripts PowerShell por padrão.

## ✅ SOLUÇÃO RÁPIDA (Recomendada)

### Opção 1: Liberar Execução de Scripts (Permanente)

1. **Abra o PowerShell como Administrador**
   - Clique com botão direito no menu Iniciar
   - Escolha "Windows PowerShell (Admin)" ou "Terminal (Admin)"

2. **Execute este comando:**
   ```powershell
   Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
   ```

3. **Confirme** digitando `S` ou `Y` quando perguntado

4. **Feche e abra um novo PowerShell normal** (não precisa mais ser admin)

5. **Agora execute:**
   ```powershell
   cd c:\Users\Carlos\.gemini\antigravity\playground\deep-nadir
   npm install
   ```

### Opção 2: Usar CMD em vez de PowerShell

Se preferir não alterar a política:

1. **Abra o Prompt de Comando (CMD)**
   - Pressione `Win + R`
   - Digite `cmd` e pressione Enter

2. **Execute:**
   ```cmd
   cd c:\Users\Carlos\.gemini\antigravity\playground\deep-nadir
   npm install
   ```

O CMD não tem essa restrição de scripts.

### Opção 3: Usar Git Bash (se tiver instalado)

Se você tem o Git instalado:

1. Abra o **Git Bash**
2. Execute:
   ```bash
   cd /c/Users/Carlos/.gemini/antigravity/playground/deep-nadir
   npm install
   ```

## 🔍 Explicação das Políticas

- **Restricted**: Não permite scripts (padrão Windows)
- **RemoteSigned**: Permite scripts locais + scripts baixados assinados (recomendado)
- **Unrestricted**: Permite todos os scripts (menos seguro)

## ⚙️ Reverter a Mudança (se quiser)

Para voltar à configuração original depois:

```powershell
Set-ExecutionPolicy -ExecutionPolicy Restricted -Scope CurrentUser
```

## 📌 Qual Opção Escolher?

- **Desenvolvedor**: Use a **Opção 1** (RemoteSigned é seguro e prático)
- **Uso pontual**: Use a **Opção 2** (CMD)
- **Tem Git**: Use a **Opção 3** (Git Bash é ótimo para desenvolvimento)

---

**Depois de instalar as dependências, volte ao INSTALACAO.md para continuar!**
