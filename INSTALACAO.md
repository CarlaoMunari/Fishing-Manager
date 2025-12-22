# 🎣 Guia Completo de Instalação - Sistema de Pesca Esportiva

## ⚠️ IMPORTANTE: Instalar Node.js

O projeto precisa do Node.js instalado. Como o npm não foi encontrado, siga estes passos:

### 1. Baixar e Instalar Node.js

1. Acesse: https://nodejs.org/
2. Baixe a versão **LTS** (Long Term Support) recomendada
3. Execute o instalador
4. **IMPORTANTE**: Durante a instalação, marque a opção "Add to PATH"
5. Reinicie o terminal/PowerShell após a instalação

### 2. Verificar Instalação

Após instalar, abra um **novo** terminal e execute:

```powershell
node --version
npm --version
```

Ambos comandos devem retornar números de versão (ex: v20.10.0 e 10.2.3)

### 3. Instalar Dependências do Projeto

Execute na pasta do projeto:

```powershell
cd c:\Users\Carlos\.gemini\antigravity\playground\deep-nadir
npm install
```

Isso vai instalar todas as bibliotecas necessárias (React, Firebase, Tailwind CSS, etc.)

### 4. Configurar Firebase

Antes de rodar o projeto, você PRECISA configurar o Firebase:

#### 4.1 Criar Projeto no Firebase

1. Acesse: https://console.firebase.google.com
2. Clique em "Adicionar projeto"
3. Dê um nome (ex: "circuitos-pesca")
4. Siga os passos até criar o projeto

#### 4.2 Habilitar Serviços

**Authentication:**
1. Menu lateral → Authentication → "Começar"
2. Ative "E-mail/senha"

**Firestore Database:**
1. Menu lateral → Firestore Database → "Criar banco de dados"
2. Modo: Produção (ou teste para desenvolvimento)
3. Localização: southamerica-east1 (Brasil)

**Storage:**
1. Menu lateral → Storage → "Começar"
2. Aceite as regras padrão

#### 4.3 Obter Credenciais

1. Configurações do projeto (ícone de engrenagem)
2. Role até "Seus apps"
3. Clique no ícone **Web** (`</>`)
4. Registre o app com um nome
5. **COPIE** o objeto `firebaseConfig`

#### 4.4 Configurar no Código

Abra o arquivo: `src/lib/firebase.ts`

Substitua as credenciais de exemplo:

```typescript
const firebaseConfig = {
  apiKey: "COLE_AQUI_SUA_API_KEY",
  authDomain: "COLE_AQUI_SEU_AUTH_DOMAIN",
  projectId: "COLE_AQUI_SEU_PROJECT_ID",
  storageBucket: "COLE_AQUI_SEU_STORAGE_BUCKET",
  messagingSenderId: "COLE_AQUI_SEU_MESSAGING_SENDER_ID",
  appId: "COLE_AQUI_SEU_APP_ID"
};
```

### 5. Criar Usuário Administrador

#### 5.1 No Firebase Authentication

1. Vá em **Authentication** → **Users**
2. Clique em "Adicionar usuário"
3. E-mail: `admin@exemplo.com` (ou o que preferir)
4. Senha: crie uma senha forte
5. **IMPORTANTE**: Copie o **UID** do usuário criado

#### 5.2 No Firestore

1. Vá em **Firestore Database**
2. Clique em "Iniciar coleção"
3. ID da coleção: `users`
4. Clique em "Próximo"
5. ID do documento: **COLE O UID COPIADO**
6. Adicione os campos:

```
Campo          | Tipo      | Valor
-------------|----------|------------------
email        | string   | admin@exemplo.com
name         | string   | Administrador
role         | string   | super_admin
createdAt    | timestamp| (data atual)
```

### 6. Executar o Projeto

Depois de tudo configurado:

```powershell
npm run dev
```

Acesse: **http://localhost:5173**

### 7. Fazer Login

1. Clique em "Entrar" no topo da página
2. Use as credenciais criadas:
   - E-mail: `admin@exemplo.com`
   - Senha: a senha que você definiu

### 8. Começar a Usar

Após login, você terá acesso ao painel administrativo:

1. **Carrossel**: Faça upload de imagens para a home
2. **Circuitos**: Crie circuitos (ex: "Circuito Tucunaré 2025")
3. **Etapas**: Adicione etapas aos circuitos
4. **Equipes**: Veja inscrições (faça uma teste saindo do admin)
5. **Lançar Medidas**: Registre resultados das equipes
6. **Rankings**: Visualize classificações

## 🔧 Solução de Problemas

### "npm não é reconhecido"
- Instale o Node.js: https://nodejs.org
- Reinicie o terminal após instalar
- Verifique se está no PATH do sistema

### Erros de TypeScript no editor
- Execute `npm install` primeiro
- Reinicie o VS Code/editor

### "Firebase not configured"
- Verifique se copiou as credenciais corretamente
- Confirme que os serviços estão habilitados no console

### Imagens não aparecem
- Verifique as regras do Storage
- Tente fazer upload novamente

### Não consigo fazer login
- Verifique se criou o usuário no Authentication
- Confirme se adicionou o documento na coleção `users`
- Verifique se o UID é o mesmo

## 📞 Estrutura do Banco de Dados

O Firestore terá estas coleções automaticamente criadas:

### `users`
```
{
  email: string
  name: string
  role: "super_admin" | "judge" | "captain"
  createdAt: timestamp
}
```

### `carousel`
```
{
  imageUrl: string
  altText: string
  order: number
  createdAt: timestamp
}
```

### `circuits`
```
{
  name: string
  year: number
  active: boolean
  createdAt: timestamp
}
```

### `stages`
```
{
  circuitId: string
  name: string
  date: timestamp
  location: string
  registrationFee: number
  createdAt: timestamp
}
```

### `teams`
```
{
  stageId: string
  captainName: string
  captainEmail: string
  captainPhone: string
  members: array[{name, cpf, shirtSize}]
  paid: boolean
  paymentMethod: "pix" | "credit_card"
  registeredAt: timestamp
}
```

### `results`
```
{
  teamId: string
  stageId: string
  circuitId: string
  fishMeasurements: number[6]
  averageScore: number
  createdAt: timestamp
  updatedAt: timestamp
}
```

## 🎯 Próximos Passos

Depois de instalar tudo:

1. ✅ Instale o Node.js
2. ✅ Execute `npm install`
3. ✅ Configure o Firebase
4. ✅ Crie usuário admin
5. ✅ Execute `npm run dev`
6. ✅ Faça login e explore!

---

**Dúvidas?** Todos os arquivos estão prontos, basta seguir este guia passo a passo!
