-- ============================================================
-- ABRIGO DA MÁRCIA — Schema do Supabase
-- Execute este arquivo no SQL Editor do Supabase:
-- Dashboard → SQL Editor → New query → Cole e execute
-- ============================================================

-- ──────────────────────────────────────────────────────────
-- 1. TABELA: dogs
-- ──────────────────────────────────────────────────────────

create table if not exists dogs (
  id          uuid        primary key default gen_random_uuid(),
  slug        text        unique not null,
  name        text        not null,
  gender      text        not null check (gender in ('Macho', 'Fêmea')),
  age         text        not null,
  size        text        not null check (size in ('Porte pequeno', 'Porte médio', 'Porte grande')),
  description text        not null,
  image       text,
  form_url    text        default 'https://forms.gle/nLSjXJyeLGUJXZj27',
  featured    boolean     default false,
  status      text        default 'available' check (status in ('available', 'adopted', 'pending')),
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- Auto-atualiza updated_at em cada UPDATE
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists dogs_updated_at on dogs;
create trigger dogs_updated_at
  before update on dogs
  for each row execute function update_updated_at();

-- ──────────────────────────────────────────────────────────
-- 2. RLS (Row Level Security)
-- ──────────────────────────────────────────────────────────

alter table dogs enable row level security;

-- Visitantes: somente leitura de cães disponíveis
drop policy if exists "Público lê cães disponíveis" on dogs;
create policy "Público lê cães disponíveis"
  on dogs for select
  to anon
  using (status = 'available');

-- Admin autenticado: leitura total
drop policy if exists "Admin lê todos" on dogs;
create policy "Admin lê todos"
  on dogs for select
  to authenticated
  using (true);

-- Admin autenticado: inserção
-- IMPORTANTE: substitua 'ADMIN-UUID' pelo UID do seu usuário admin.
-- Encontre em: Authentication → Users → copie o User UID.
drop policy if exists "Admin insere" on dogs;
create policy "Admin insere"
  on dogs for insert
  to authenticated
  with check (auth.uid() = 'ADMIN-UUID'::uuid);

-- Admin autenticado: atualização
drop policy if exists "Admin atualiza" on dogs;
create policy "Admin atualiza"
  on dogs for update
  to authenticated
  using (auth.uid() = 'ADMIN-UUID'::uuid)
  with check (auth.uid() = 'ADMIN-UUID'::uuid);

-- Admin autenticado: exclusão
drop policy if exists "Admin deleta" on dogs;
create policy "Admin deleta"
  on dogs for delete
  to authenticated
  using (auth.uid() = 'ADMIN-UUID'::uuid);

-- ──────────────────────────────────────────────────────────
-- 3. STORAGE: bucket dog-photos
-- ──────────────────────────────────────────────────────────

insert into storage.buckets (id, name, public)
values ('dog-photos', 'dog-photos', true)
on conflict (id) do nothing;

drop policy if exists "Público lê fotos" on storage.objects;
create policy "Público lê fotos"
  on storage.objects for select
  to anon
  using (bucket_id = 'dog-photos');

drop policy if exists "Admin faz upload" on storage.objects;
create policy "Admin faz upload"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'dog-photos' and auth.uid() = 'ADMIN-UUID'::uuid);

drop policy if exists "Admin atualiza foto" on storage.objects;
create policy "Admin atualiza foto"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'dog-photos' and auth.uid() = 'ADMIN-UUID'::uuid);

drop policy if exists "Admin deleta foto" on storage.objects;
create policy "Admin deleta foto"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'dog-photos' and auth.uid() = 'ADMIN-UUID'::uuid);

-- ──────────────────────────────────────────────────────────
-- 4. SEED: dados iniciais dos cães
-- Imagens usam caminhos locais (relativos a pages/catalogo.html).
-- Após fazer upload no painel admin, o campo image será
-- substituído pela URL pública do Supabase Storage.
-- ──────────────────────────────────────────────────────────

insert into dogs (slug, name, gender, age, size, description, image, form_url, status) values
  (
    'charlie', 'Charlie', 'Macho', '1 ano', 'Porte médio',
    'Charlie é um dos novatos do abrigo, sempre muito esperto e animado para brincar.',
    '../assets/images/catalogo/foto-charlie.webp',
    'https://forms.gle/nLSjXJyeLGUJXZj27', 'available'
  ),
  (
    'meg', 'Meg', 'Fêmea', '4 anos', 'Porte médio',
    'Meg é uma veterana do abrigo. Conhece todo mundo e sempre se dá bem, seja com outros cães ou pessoas.',
    '../assets/images/catalogo/foto-meg.webp',
    'https://forms.gle/nLSjXJyeLGUJXZj27', 'available'
  ),
  (
    'negao', 'Negão', 'Macho', '3 anos', 'Porte grande',
    'Negão é cheio de paixão e amor para todos. Muito sociável, ele está sempre pronto para brincar e receber carinho.',
    '../assets/images/catalogo/foto-negao.webp',
    'https://forms.gle/nLSjXJyeLGUJXZj27', 'available'
  ),
  (
    'thor', 'Thor', 'Macho', '6 anos', 'Porte médio',
    'Thor é um cão que passou por momentos difíceis. Ele pode ser um pouco arisco inicialmente, mas com o tempo é possível conquistar seu coração, se tornando dócil com quem confia.',
    '../assets/images/catalogo/foto-thor.webp',
    'https://forms.gle/nLSjXJyeLGUJXZj27', 'available'
  ),
  (
    'zeca', 'Zeca', 'Macho', '5 anos', 'Porte grande',
    'Zeca nasceu com uma pata com má formação, mas isso nunca o impediu de ser um brincalhão e sempre curioso para conhecer pessoas novas.',
    '../assets/images/catalogo/foto-zeca.webp',
    'https://forms.gle/nLSjXJyeLGUJXZj27', 'available'
  ),
  (
    'zuzu', 'Zuzu', 'Fêmea', '6 anos', 'Porte grande',
    'Veterana do abrigo, Zuzu é super tranquila e muito dócil, sempre se dando bem com os outros cães.',
    '../assets/images/catalogo/foto-zuzu.webp',
    'https://forms.gle/nLSjXJyeLGUJXZj27', 'available'
  )
on conflict (slug) do nothing;

-- ──────────────────────────────────────────────────────────
-- 5. USUÁRIO ADMIN
-- NÃO crie o usuário admin por SQL (senha em texto puro).
-- Use o painel do Supabase:
--   Authentication → Users → Add user
--   Email: (seu email)   Senha: (senha forte)
-- ──────────────────────────────────────────────────────────
