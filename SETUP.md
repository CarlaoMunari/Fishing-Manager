# 🚀 Guia Rápido de Configuração

## Passo 1: Instalar Dependências

Você precisará ter o Node.js instalado. Depois, execute:

```bash
npm install
```

## Passo 2: Configurar Firebase

### 2.1 Criar Projeto Firebase

1. Acesse [console.firebase.google.com](https://console.firebase.google.com)
2. Clique em "Adicionar projeto"
3. Dê um nome ao projeto (ex: "circuitos-pesca")
4. Siga os passos de criação

### 2.2 Habilitar Autenticação

1. No menu lateral, vá em **Authentication**
2. Clique em "Começar"
3. Ative o método **E-mail/senha**

### 2.3 Criar Firestore Database

1. No menu lateral, vá em **Firestore Database**
2. Clique em "Criar banco de dados"
3. Escolha modo de **produção** ou **teste**
4. Selecione a localização (ex: southamerica-east1)

### 2.4 Habilitar Storage

1. No menu lateral, vá em **Storage**
2. Clique em "Começar"
3. Aceite as regras padrão

### 2.5 Copiar Credenciais

1. Vá em **Configurações do projeto** (ícone de engrenagem)
2. Role até "Seus apps"
3. Clique no ícone `</>`  (Web)
4. Registre o app
5. Copie o objeto `firebaseConfig`

### 2.6 Configurar no Projeto

Abra o arquivo `src/lib/firebase.ts` e substitua:

```typescript
const firebaseConfig = {
  apiKey: "COLE_SUA_API_KEY_AQUI",
  authDomain: "COLE_SEU_AUTH_DOMAIN_AQUI",
  projectId: "COLE_SEU_PROJECT_ID_AQUI",
  storageBucket: "COLE_SEU_STORAGE_BUCKET_AQUI",
  messagingSenderId: "COLE_SEU_MESSAGING_SENDER_ID_AQUI",
  appId: "COLE_SEU_APP_ID_AQUI"
};
```

## Passo 3: Criar Usuário Administrador

### 3.1 Criar no Firebase Authentication

1. Vá em **Authentication** → **Users**
2. Clique em "Adicionar usuário"
3. E-mail: `admin@exemplo.com`
4. Senha: escolha uma senha forte
5. Clique em "Adicionar usuário"
6. **Copie o UID do usuário criado**

### 3.2 Adicionar Perfil no Firestore

1. Vá em **Firestore Database**
2. Clique em "Iniciar coleção"
3. ID da coleção: `users`
4. ID do documento: **cole o UID copiado**
5. Adicione os campos:

```
email: "admin@exemplo.com"
name: "Administrador"
role: "super_admin"
createdAt: (timestamp atual)
```

## Passo 4: Executar o Projeto

```bash
npm run dev
```

Acesse: `http://localhost:5173`

## Passo 5: Fazer Login

1. Clique em "Entrar" no topo da página
2. Use as credenciais criadas:
   - E-mail: `admin@exemplo.com`
   - Senha: a senha que você definiu
3. Você será redirecionado para o Dashboard

## 🎯 Próximos Passos

### Cadastrar Conteúdo

1. **Carrossel**: Faça upload de 3-5 imagens para a home
2. **Circuitos**: Crie um circuito (ex: "Circuito Tucunaré 2025")
3. **Etapas**: Adicione etapas ao circuito criado
4. **Teste**: Volte à home e veja os circuitos listados

### Testar Inscrição

1. Saia do admin (logout)
2. Na home, clique em "Inscrever Equipe" em uma etapa
3. Preencha os dados do capitão
4. Adicione 3 ou 4 integrantes
5. Complete o checkout com PIX ou Cartão

### Lançar Resultados

1. Faça login novamente como admin
2. Vá em "Lançar Medidas"
3. Selecione a etapa e a equipe
4. Insira as medidas dos peixes (até 6)
5. Veja o cálculo em tempo real: (soma) / 6
6. Salve o resultado

### Ver Rankings

1. Vá em "Rankings"
2. Escolha "Ranking por Etapa" ou "Ranking Geral"
3. Selecione a etapa/circuito
4. Veja a classificação ordenada

## ⚠️ Problemas Comuns

### "npm não é reconhecido"

Você precisa instalar o Node.js:
1. Baixe em [nodejs.org](https://nodejs.org)
2. Instale a versão LTS
3. Reinicie o terminal
4. Execute `npm install` novamente

### Erro de autenticação

Verifique se:
- As credenciais do Firebase estão corretas em `src/lib/firebase.ts`
- O usuário foi criado no Authentication
- O documento foi adicionado na coleção `users` com o mesmo UID

### Imagens não aparecem

Verifique se:
- O Storage está habilitado no Firebase
- As regras do Storage permitem leitura/escrita
- Você fez upload de pelo menos uma imagem

## 📚 Documentação Adicional

- [README.md](./README.md) - Documentação completa
- [walkthrough.md](./.gemini/antigravity/brain/.../walkthrough.md) - Detalhes de implementação
- [Firebase Docs](https://firebase.google.com/docs) - Documentação oficial do Firebase
