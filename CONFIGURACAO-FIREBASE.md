# 🔥 Guia Completo de Configuração do Firebase

## 📌 IMPORTANTE: Você SÓ precisa de 2 serviços (AMBOS GRATUITOS!)

✅ **Authentication** (Login com email/senha)  
✅ **Firestore Database** (Banco de dados)  

❌ **NÃO PRECISA** do Firebase Storage! (evitamos o upgrade)

---

## 🎯 PARTE 1: Acessar o Console do Firebase

### Passo 1.1: Fazer Login
1. Abra seu navegador
2. Acesse: **https://console.firebase.google.com**
3. **Faça login** com sua conta Google (a mesma que criou o projeto)

### Passo 1.2: Selecionar o Projeto
1. Você verá uma lista de projetos
2. **Clique** no projeto: **pescaesportivamanager**
3. Se aparecer "Este projeto não existe ou você não tem permissão":
   - Verifique se está logado com a conta correta
   - Troque de conta Google no navegador

---

## 🔐 PARTE 2: Configurar Authentication (2 minutos)

### Passo 2.1: Acessar Authentication
1. No menu lateral esquerdo, procure por **"Authentication"**
2. Clique em **Authentication**

### Passo 2.2: Iniciar o Authentication
1. Você verá uma tela de boas-vindas
2. Clique no botão **"Vamos começar"** ou **"Get started"**

### Passo 2.3: Escolher Método de Login
1. Você verá uma lista de provedores (Google, Facebook, Email, etc.)
2. **Clique** na linha **"Email/Password"** ou **"E-mail/senha"**
3. Uma janela lateral vai abrir

### Passo 2.4: Ativar Email/Senha
1. Na janela lateral, você verá duas opções:
   - **Email/Password** ← Ative esta (deslize o botão para a direita)
   - ~~Email link (passwordless sign-in)~~ ← Deixe DESATIVADA
2. Clique no botão **"Salvar"** ou **"Save"**

✅ **Pronto! Authentication configurado!**

---

## 🗄️ PARTE 3: Configurar Firestore Database (3 minutos)

### Passo 3.1: Acessar Firestore
1. No menu lateral esquerdo, procure por **"Firestore Database"**
2. Clique em **Firestore Database**

### Passo 3.2: Criar o Banco de Dados
1. Você verá uma tela inicial
2. Clique no botão **"Criar banco de dados"** ou **"Create database"**

### Passo 3.3: Escolher o Modo de Segurança
**Você verá 2 opções:**

#### Opção A - Modo de Teste (RECOMENDADO para desenvolvimento):
- ✅ Escolha: **"Iniciar no modo de teste"** ou **"Start in test mode"**
- Clique em **"Avançar"** ou **"Next"**

#### Opção B - Modo de Produção:
- ⚠️ Se escolher "Produção", precisará configurar regras depois
- Não recomendado para começar

### Passo 3.4: Selecionar Localização
1. **Localização**: Escolha **"southamerica-east1"** (São Paulo, Brasil)
   - Se não aparecer, escolha a localização mais próxima
2. Clique em **"Ativar"** ou **"Enable"**
3. **Aguarde** ~30-60 segundos enquanto o banco é criado

✅ **Pronto! Firestore criado!**

---

## 👤 PARTE 4: Criar Usuário Administrador (5 minutos)

### ETAPA 4A: Criar o Usuário no Authentication

#### Passo 4A.1: Acessar a Lista de Usuários
1. Menu lateral → **Authentication**
2. No topo, clique na aba **"Users"** ou **"Usuários"**
3. Você verá uma lista vazia (ainda não tem usuários)

#### Passo 4A.2: Adicionar Novo Usuário
1. Clique no botão **"Adicionar usuário"** ou **"Add user"**
2. Uma janela vai abrir

#### Passo 4A.3: Preencher Dados do Usuário
Na janela que abriu:

**Campo 1 - Email:**
- Digite: `admin@pesca.com`
- (ou qualquer email que você preferir)

**Campo 2 - Senha:**
- Digite uma senha que você vai lembrar
- Exemplo: `Admin@123456`
- **⚠️ ANOTE ESTA SENHA!** Você vai usá-la para fazer login

#### Passo 4A.4: Salvar o Usuário
1. Clique em **"Adicionar usuário"** ou **"Add user"**
2. O usuário será criado e aparecerá na lista

#### Passo 4A.5: Copiar o UID (MUITO IMPORTANTE!)
1. Na lista de usuários, você verá o usuário que acabou de criar
2. Clique no usuário para abrir os detalhes
3. **Procure pelo campo "UID"** (User ID)
4. O UID é algo como: `xKj8pL2mN9qRsTuVwXyZ4a1bC2dE3fG4`
5. **COPIE O UID COMPLETO** (clique no ícone de copiar ou selecione e Ctrl+C)

**⚠️ IMPORTANTE: Mantenha o UID copiado! Você vai usar no próximo passo!**

---

### ETAPA 4B: Adicionar Perfil de Admin no Firestore

#### Passo 4B.1: Acessar Firestore
1. Menu lateral → **Firestore Database**
2. Você verá a tela do banco de dados

#### Passo 4B.2: Criar a Coleção "users"
1. Clique no botão **"Iniciar coleção"** ou **"Start collection"**
2. Uma janela vai abrir

#### Passo 4B.3: Nomear a Coleção
1. **ID da coleção:** Digite exatamente → `users` (em minúsculas)
2. Clique em **"Próximo"** ou **"Next"**

#### Passo 4B.4: Criar o Documento do Admin
Agora você vai criar o primeiro documento (o perfil do admin):

**ID do documento:**
- **COLE O UID** que você copiou no Passo 4A.5
- Exemplo: `xKj8pL2mN9qRsTuVwXyZ4a1bC2dE3fG4`

#### Passo 4B.5: Adicionar os Campos do Perfil
Agora você vai adicionar 4 campos. Para cada campo:
1. Clique em **"Adicionar campo"** ou **"Add field"**
2. Preencha Nome, Tipo e Valor conforme a tabela abaixo

**Campo 1:**
- **Nome do campo:** `email`
- **Tipo:** string
- **Valor:** `admin@pesca.com` (o mesmo email que você usou)

**Campo 2:**
- **Nome do campo:** `name`
- **Tipo:** string
- **Valor:** `Administrador`

**Campo 3:**
- **Nome do campo:** `role`
- **Tipo:** string
- **Valor:** `super_admin` (exatamente assim, com underscore)

**Campo 4:**
- **Nome do campo:** `createdAt`
- **Tipo:** timestamp
- **Valor:** (deixe a data/hora atual que aparece automaticamente)

#### Passo 4B.6: Salvar o Documento
1. Clique em **"Salvar"** ou **"Save"**
2. Você verá o documento criado na coleção `users`

✅ **Pronto! Usuário administrador criado com sucesso!**

Agora você tem:
- ✅ Um usuário criado no Authentication
- ✅ Um perfil de admin no Firestore com role `super_admin`

---

## 🎯 PARTE 5: TESTAR O LOGIN (1 minuto)

### Passo 5.1: Abrir a Aplicação
1. Abra seu navegador
2. Acesse: **http://localhost:5173**
3. Você verá a página inicial do sistema

### Passo 5.2: Ir Para a Página de Login
1. No canto superior direito, clique no botão **"Entrar"**
2. Você será levado para a página de login

### Passo 5.3: Fazer Login
1. **Email:** Digite `admin@pesca.com` (ou o email que você criou)
2. **Senha:** Digite a senha que você criou no Passo 4A.3
3. Clique no botão **"Entrar"**

### Passo 5.4: Acessar o Painel Admin
Se tudo deu certo:
- ✅ Você será **redirecionado automaticamente** para o painel administrativo
- ✅ Verá o menu lateral com: Dashboard, Carrossel, Circuitos, Etapas, etc.

🎉 **PARABÉNS! Você está no painel administrativo!**

---

## 📸 PARTE 6: Adicionar Imagens ao Carrossel (SEM UPLOAD!)

Agora o sistema usa **URLs de imagens** em vez de fazer upload!

### Passo 6.1: Conseguir URLs de Imagens Gratuitas

**Opção A - Unsplash (imagens profissionais grátis):**
1. Acesse: https://unsplash.com
2. Procure por: "fishing" ou "pesca"
3. Escolha uma imagem
4. Clique com botão direito na imagem
5. Selecione **"Copiar endereço da imagem"**
6. Cole a URL em um bloco de notas (exemplo: `https://images.unsplash.com/photo-abc...`)

**Opção B - Imgur (fazer upload das suas fotos):**
1. Acesse: https://imgur.com
2. Clique em **"New post"**
3. Faça upload da sua foto
4. Clique na foto enviada
5. Clique com botão direito → **"Copiar endereço da imagem"**

**Opção C - Qualquer URL pública:**
- Google Drive (compartilhado publicamente)
- Seu próprio site
- Qualquer imagem disponível publicamente na web

### Passo 6.2: Adicionar Imagem no Painel Admin
1. No painel admin, clique em **"Carrossel"** no menu lateral
2. Clique no botão **"Adicionar Imagem"**
3. **URL da Imagem:** Cole a URL que você copiou
4. **Texto Alternativo:** Digite uma descrição (ex: "Pesca esportiva no lago")
5. Clique em **"Adicionar Imagem"**

✅ **A imagem aparecerá:**
- No painel de gerenciamento do carrossel
- Na página inicial do site (http://localhost:5173)

---

## 🎮 PARTE 7: Explorar o Sistema

Agora você pode explorar todas as funcionalidades!

### Dashboard
- Ver estatísticas do sistema

### Carrossel
- ✅ Adicionar imagens via URL
- ✅ Excluir imagens

### Circuitos
- ✅ Criar circuitos de pesca (ex: "Circuito Tucunaré 2025")
- ✅ Ativar/Desativar circuitos

### Etapas
- ✅ Criar etapas dentro de circuitos
- ✅ Definir data, local e taxa de inscrição

### Equipes
- ✅ Ver equipes que se inscreveram nas etapas
- (As inscrições são feitas na área pública do site)

### Lançar Medidas
- ✅ Registrar medidas de peixes capturados
- ✅ Sistema calcula automaticamente a pontuação (soma ÷ 6)

### Rankings
- ✅ Ver ranking por etapa
- ✅ Ver ranking geral do circuito
- ✅ Top 3 com ícones de troféu

---

## 🆘 Solução de Problemas

### ❌ "Email already in use"
**Causa:** O email já foi cadastrado  
**Solução:**
1. Use outro email, OU
2. Vá em Authentication → Users → Delete o usuário existente

### ❌ "Invalid email or password"
**Causa:** Email ou senha incorretos  
**Solução:**
- Verifique se digitou o email corretamente
- Certifique-se de usar a senha que você criou
- Lembre-se que senhas são case-sensitive (maiúsculas/minúsculas importam)

### ❌ "Permission denied" ao salvar dados
**Causa:** Regras de segurança do Firestore muito restritivas  
**Solução:**
1. Vá em **Firestore Database** → Aba **"Regras"** ou **"Rules"**
2. Substitua tudo por estas regras de teste:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

3. Clique em **"Publicar"** ou **"Publish"**

⚠️ **ATENÇÃO:** Essas regras são APENAS para teste/desenvolvimento!

### ❌ "Imagem não carrega no carrossel"
**Causa:** URL inválida ou não pública  
**Solução:**
- Verifique se a URL está correta
- Teste a URL diretamente no navegador
- Certifique-se de que a imagem é pública (não precisa login para ver)

### ❌ "Cannot read property 'role' of null"
**Causa:** Você não criou o documento no Firestore com o UID correto  
**Solução:**
- Volte na PARTE 4B e crie o documento novamente
- Certifique-se de que o ID do documento é EXATAMENTE o UID do usuário
- Certifique-se de que o campo `role` tem o valor `super_admin`

---

## ✅ Checklist Final

Marque cada item conforme você completa:

- [ ] Acessei o Firebase Console
- [ ] Habilitei Authentication (Email/Password)
- [ ] Criei o Firestore Database (modo teste)
- [ ] Criei usuário no Authentication
- [ ] Copiei o UID do usuário
- [ ] Criei coleção `users` no Firestore
- [ ] Criei documento com o UID como ID
- [ ] Adicionei campos: email, name, role, createdAt
- [ ] Testei login em http://localhost:5173
- [ ] Consegui acessar o painel admin
- [ ] (Opcional) Adicionei imagens ao carrossel

---

## 🎉 Você Conseguiu!

Se você marcou todos os itens, sua aplicação está **100% funcional e gratuita**!

### 📚 Documentação Adicional:
- `README.md` - Visão geral do projeto
- `INSTALACAO.md` - Como instalar dependências
- `SOLUCAO-ERRO-POWERSHELL.md` - Resolver erros do PowerShell

### 🆘 Precisa de Ajuda?
Se algo não funcionou ou você tem dúvidas, verifique:
1. Todas as credenciais estão corretas
2. Você está usando a mesma conta Google em todo lugar
3. Authentication e Firestore estão habilitados
4. O UID no Firestore corresponde ao UID do Authentication

**Boa pesca! 🎣**
