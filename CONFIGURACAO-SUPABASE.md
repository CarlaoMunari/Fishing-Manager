# ⚡ Guia de Configuração do Supabase

Este guia vai te ajudar a configurar o **Supabase** para substituir o Firebase no seu projeto. O Supabase é uma alternativa open-source ao Firebase que usa banco de dados SQL (PostgreSQL), o que é ótimo para relacionamentos como Circuitos -> Etapas -> Equipes.

---

## 🚀 Passo 1: Criar Projeto no Supabase

1. Acesse **[supabase.com](https://supabase.com)**
2. Clique em **"Start your project"**
3. Faça login com o GitHub (ou crie uma conta)
4. Clique em **"New Project"**
5. Preencha os dados:
   - **Name:** `pesca-manager` (ou o que preferir)
   - **Database Password:** Crie uma senha forte e **ANOTE-A** (você pode precisar depois)
   - **Region:** Escolha `South America (São Paulo)` para menor latência
6. Clique em **"Create new project"**
7. Aguarde alguns minutos enquanto o projeto é criado.

---

## 🔑 Passo 2: Pegar as Credenciais

Assim que o projeto estiver pronto (tela verde "Project Active"):

1. No menu lateral esquerdo, clique no ícone de engrenagem **(Project Settings)**
2. Clique em **"API"**
3. Você verá duas informações importantes:
   - **Project URL:** (algo como `https://xyzxyzxyz.supabase.co`)
   - **Project API keys (anon / public):** (um código longo)

**⚠️ Mantenha essa aba aberta, vamos usar esses valores no código!**

---

## 🗄️ Passo 3: Criar o Banco de Dados (Tabelas)

O Supabase tem um editor SQL onde podemos criar todas as tabelas de uma vez.

1. No menu lateral esquerdo, clique no ícone **SQL Editor** (parece um terminal `>_`)
2. Clique em **"New query"** (botão verde ou folha em branco)
3. **Copie e cole** todo o código SQL abaixo:

```sql
-- 1. Tabela de Perfis de Usuários (vinculada ao Auth)
create table public.users (
  id uuid references auth.users not null primary key,
  email text,
  name text,
  role text check (role in ('super_admin', 'judge', 'captain')) default 'captain',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Habilitar Row Level Security (RLS)
alter table public.users enable row level security;

-- 2. Tabela de Circuitos
create table public.circuits (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  year integer not null,
  active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.circuits enable row level security;

-- 3. Tabela de Etapas
create table public.stages (
  id uuid default gen_random_uuid() primary key,
  circuit_id uuid references public.circuits(id) on delete cascade not null,
  name text not null,
  date date not null,
  location text not null,
  registration_fee numeric not null,
  image_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.stages enable row level security;

-- 4. Tabela de Equipes
create table public.teams (
  id uuid default gen_random_uuid() primary key,
  stage_id uuid references public.stages(id) on delete cascade not null,
  captain_name text not null,
  captain_email text not null,
  captain_phone text not null,
  members jsonb not null, -- Armazena array de membros como JSON
  paid boolean default false,
  payment_method text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.teams enable row level security;

-- 5. Tabela de Resultados (Pontuação)
create table public.results (
  id uuid default gen_random_uuid() primary key,
  stage_id uuid references public.stages(id) on delete cascade not null,
  team_id uuid references public.teams(id) on delete cascade not null,
  fish_measurements jsonb not null, -- Array de números
  average_score numeric not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.results enable row level security;

-- 6. Tabela de Imagens do Carrossel
create table public.carousel_images (
  id uuid default gen_random_uuid() primary key,
  url text not null,
  alt text,
  "order" integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.carousel_images enable row level security;

-- POLÍTICAS DE SEGURANÇA (SIMPLIFICADAS PARA INÍCIO)
-- Permitir leitura pública para tudo (necessário para o site funcionar)
create policy "Public Read Users" on public.users for select using (true);
create policy "Public Read Circuits" on public.circuits for select using (true);
create policy "Public Read Stages" on public.stages for select using (true);
create policy "Public Read Teams" on public.teams for select using (true);
create policy "Public Read Results" on public.results for select using (true);
create policy "Public Read Carousel" on public.carousel_images for select using (true);

-- Permitir inserção/atualização/deleção apenas para usuários logados (Admin/Juiz)
-- (Para produção, refinaremos isso para checar o role 'super_admin')
create policy "Auth Write Users" on public.users for all using (auth.role() = 'authenticated');
create policy "Auth Write Circuits" on public.circuits for all using (auth.role() = 'authenticated');
create policy "Auth Write Stages" on public.stages for all using (auth.role() = 'authenticated');
create policy "Auth Write Teams" on public.teams for all using (auth.role() = 'authenticated'); -- Capitães também escrevem aqui na inscrição
create policy "Auth Write Results" on public.results for all using (auth.role() = 'authenticated');
create policy "Auth Write Carousel" on public.carousel_images for all using (auth.role() = 'authenticated');

-- Trigger para criar perfil de usuário automaticamente ao cadastrar no Auth
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, name, role)
  values (new.id, new.email, new.raw_user_meta_data->>'name', 'captain');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
```

4. Clique em **"Run"** (botão verde no canto inferior direito).
5. Se aparecer "Success", suas tabelas foram criadas! 🎉

---

## 📦 Passo 4: Configurar Storage (Upload de Imagens)

Para fazer upload de imagens (carrossel e etapas), precisamos criar um "Bucket".

1. No menu lateral esquerdo, clique em **Storage** (ícone de pasta/arquivo)
2. Clique em **"New Bucket"**
3. **Name:** `images`
4. **Public bucket:** ✅ **MARQUE ESTA OPÇÃO** (Importante!)
5. Clique em **"Save"**

---

## 👤 Passo 5: Criar Usuário Admin

Agora vamos criar seu usuário administrador.

1. No menu lateral esquerdo, clique em **Authentication** (ícone de usuários)
2. Clique em **"Add User"**
3. **Email:** `admin@pesca.com` (ou seu email)
4. **Password:** Crie uma senha
5. Clique em **"Create User"**

**Agora vamos dar permissão de Super Admin para ele:**

1. Volte ao **Table Editor** (ícone de tabela no menu lateral)
2. Selecione a tabela `users`
3. Você verá o usuário que acabou de criar
4. Na coluna `role`, clique duas vezes onde diz `captain` (ou null) e mude para `super_admin`
5. Clique fora ou aperte Enter para salvar (se precisar, clique no botão "Save" que aparecer)

---

## ✅ Pronto!

Agora você tem:
1. Projeto Supabase criado
2. Banco de dados configurado
3. Storage para imagens pronto
4. Usuário Admin criado

**Próximo passo:** Me forneça a **Project URL** e a **Anon Key** (do Passo 2) para eu conectar a aplicação!
