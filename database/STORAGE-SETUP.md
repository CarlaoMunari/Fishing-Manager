# Configuração do Storage no Supabase

## 📦 Buckets Necessários

Você precisa criar 4 buckets no Supabase Storage para armazenar as imagens.

### Como Criar os Buckets:

1. Acesse o painel do Supabase: https://supabase.com/dashboard
2. Vá em **Storage** no menu lateral
3. Clique em **"New bucket"**
4. Configure cada bucket conforme abaixo:

---

## 1️⃣ Bucket: `event-logos`

**Nome:** `event-logos`  
**Público:** ✅ Sim (marcar "Public bucket")  
**Descrição:** Logos da empresa do evento para usar nas fichas PDF

**Configurações de Upload:**
- Tipos permitidos: `image/png, image/jpeg, image/jpg, image/webp`
- Tamanho máximo: 5 MB
- Recomendado: Mínimo 400x300px

---

## 2️⃣ Bucket: `sponsor-logos`

**Nome:** `sponsor-logos`  
**Público:** ✅ Sim (marcar "Public bucket")  
**Descrição:** Logos de patrocinadores para exibir no site

**Configurações de Upload:**
- Tipos permitidos: `image/png, image/jpeg, image/jpg, image/webp`
- Tamanho máximo: 2 MB
- Recomendado: Mínimo 200x200px

---

## 3️⃣ Bucket: `stage-images`

**Nome:** `stage-images`  
**Público:** ✅ Sim (marcar "Public bucket")  
**Descrição:** Imagens 800x800 das etapas para exibir no home

**Configurações de Upload:**
- Tipos permitidos: `image/png, image/jpeg, image/jpg, image/webp`
- Tamanho máximo: 5 MB
- **Obrigatório:** 800x800px (quadrado)

---

## 4️⃣ Bucket: `champion-gallery`

**Nome:** `champion-gallery`  
**Público:** ✅ Sim (marcar "Public bucket")  
**Descrição:** Galeria de fotos dos campeões das etapas

**Configurações de Upload:**
- Tipos permitidos: `image/png, image/jpeg, image/jpg, image/webp`
- Tamanho máximo: 8 MB
- Recomendado: Mínimo 800x600px

---

## ✅ Verificação

Após criar os buckets, você deve ter **4 buckets** na lista:

```
✓ event-logos        (Público)
✓ sponsor-logos      (Público)
✓ stage-images       (Público)
✓ champion-gallery   (Público)
```

---

## 🔒 Políticas de Storage

As políticas de acesso serão configuradas automaticamente pelo código da aplicação. Você **não precisa** configurar políticas manualmente.

**Regras aplicadas:**
- ✅ **Leitura pública:** Qualquer pessoa pode ver as imagens
- ✅ **Upload:** Apenas usuários autenticados
- ✅ **Delete:** Apenas usuários autenticados

---

## 📝 Próximos Passos

Depois de criar os buckets:
1. ✅ Execute o script `01-create-image-tables.sql`
2. ✅ Execute o script `02-create-rls-policies.sql`
3. ✅ Crie os 4 buckets no Storage (esta instrução)
4. 🔄 Aguarde implementação dos componentes React

---

**Status:** ⏳ Aguardando criação manual dos buckets no painel Supabase
