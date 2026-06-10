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
  birth_year  integer     not null check (birth_year >= 1995 and birth_year <= extract(year from now())::integer),
  size        text        not null check (size in ('Porte pequeno', 'Porte médio', 'Porte grande')),
  description text        not null,
  image       text,
  form_url    text        default 'https://forms.gle/nLSjXJyeLGUJXZj27',
  featured    boolean     default false,
  status      text        default 'available' check (status in ('available', 'pending', 'adopted', 'deceased')),
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

-- Leitura pública das fotos do bucket
drop policy if exists "Público lê fotos" on storage.objects;
create policy "Público lê fotos"
  on storage.objects for select
  to anon
  using (bucket_id = 'dog-photos');

-- Admin: qualquer usuário AUTENTICADO gerencia as fotos do bucket dog-photos
-- (só o admin consegue logar — cadastro público desabilitado). Evita o foot-gun
-- de fixar o ADMIN-UUID. Remove as políticas antigas baseadas em ADMIN-UUID:
drop policy if exists "Admin faz upload"    on storage.objects;
drop policy if exists "Admin atualiza foto" on storage.objects;
drop policy if exists "Admin deleta foto"   on storage.objects;

drop policy if exists "Admin gerencia fotos" on storage.objects;
create policy "Admin gerencia fotos"
  on storage.objects for all
  to authenticated
  using (bucket_id = 'dog-photos')
  with check (bucket_id = 'dog-photos');

-- ──────────────────────────────────────────────────────────
-- 4. SEED: dados iniciais dos cães
-- Imagens usam caminhos locais (relativos a pages/catalogo.html).
-- Após fazer upload no painel admin, o campo image será
-- substituído pela URL pública do Supabase Storage.
-- ──────────────────────────────────────────────────────────

-- birth_year estimado a partir da idade original (referência: 2026)
insert into dogs (slug, name, gender, birth_year, size, description, image, form_url, status) values
  (
    'charlie', 'Charlie', 'Macho', 2025, 'Porte médio',
    'Charlie é um dos novatos do abrigo, sempre muito esperto e animado para brincar.',
    '../assets/images/catalogo/foto-charlie.webp',
    'https://forms.gle/nLSjXJyeLGUJXZj27', 'available'
  ),
  (
    'meg', 'Meg', 'Fêmea', 2022, 'Porte médio',
    'Meg é uma veterana do abrigo. Conhece todo mundo e sempre se dá bem, seja com outros cães ou pessoas.',
    '../assets/images/catalogo/foto-meg.webp',
    'https://forms.gle/nLSjXJyeLGUJXZj27', 'available'
  ),
  (
    'negao', 'Negão', 'Macho', 2023, 'Porte grande',
    'Negão é cheio de paixão e amor para todos. Muito sociável, ele está sempre pronto para brincar e receber carinho.',
    '../assets/images/catalogo/foto-negao.webp',
    'https://forms.gle/nLSjXJyeLGUJXZj27', 'available'
  ),
  (
    'thor', 'Thor', 'Macho', 2020, 'Porte médio',
    'Thor é um cão que passou por momentos difíceis. Ele pode ser um pouco arisco inicialmente, mas com o tempo é possível conquistar seu coração, se tornando dócil com quem confia.',
    '../assets/images/catalogo/foto-thor.webp',
    'https://forms.gle/nLSjXJyeLGUJXZj27', 'available'
  ),
  (
    'zeca', 'Zeca', 'Macho', 2021, 'Porte grande',
    'Zeca nasceu com uma pata com má formação, mas isso nunca o impediu de ser um brincalhão e sempre curioso para conhecer pessoas novas.',
    '../assets/images/catalogo/foto-zeca.webp',
    'https://forms.gle/nLSjXJyeLGUJXZj27', 'available'
  ),
  (
    'zuzu', 'Zuzu', 'Fêmea', 2020, 'Porte grande',
    'Veterana do abrigo, Zuzu é super tranquila e muito dócil, sempre se dando bem com os outros cães.',
    '../assets/images/catalogo/foto-zuzu.webp',
    'https://forms.gle/nLSjXJyeLGUJXZj27', 'available'
  )
on conflict (slug) do nothing;

-- ──────────────────────────────────────────────────────────
-- 5. MIGRAÇÕES — execute apenas se a tabela já existia
-- (instalação feita antes de 2026-06-09)
-- ──────────────────────────────────────────────────────────

-- Adiciona colunas novas (seguro rodar mais de uma vez)
alter table dogs add column if not exists birth_year integer;

-- Múltiplas fotos por cão (até 5 URLs); image continua como capa/fallback
alter table dogs add column if not exists photos text[] not null default '{}';

-- Remove coluna archived (substituída por status 'adopted'/'deceased')
alter table dogs drop column if exists archived;

-- Atualiza check constraint para incluir 'deceased'
alter table dogs drop constraint if exists dogs_status_check;
alter table dogs add constraint dogs_status_check
  check (status in ('available', 'pending', 'adopted', 'deceased'));

-- Converte age texto → birth_year para os cães do seed
update dogs set birth_year = 2025 where slug = 'charlie' and birth_year is null;
update dogs set birth_year = 2022 where slug = 'meg'     and birth_year is null;
update dogs set birth_year = 2023 where slug = 'negao'   and birth_year is null;
update dogs set birth_year = 2020 where slug = 'thor'    and birth_year is null;
update dogs set birth_year = 2021 where slug = 'zeca'    and birth_year is null;
update dogs set birth_year = 2020 where slug = 'zuzu'    and birth_year is null;

-- Após preencher todos os birth_years manualmente, adicione o NOT NULL e o check:
-- alter table dogs alter column birth_year set not null;
-- alter table dogs add constraint dogs_birth_year_check
--   check (birth_year >= 1995 and birth_year <= extract(year from now())::integer);

-- ──────────────────────────────────────────────────────────
-- 6. TABELA: stories (Histórias do Abrigo)
-- Cães adotados com história + até 5 fotos, gerenciados no admin.
-- Bloco idempotente: seguro rodar mais de uma vez.
-- IMPORTANTE: substitua 'ADMIN-UUID' pelo MESMO UID usado nas
-- políticas de dogs (Authentication → Users → User UID).
-- As fotos reutilizam o bucket público 'dog-photos' (seção 3),
-- então não há novas políticas de Storage a criar.
-- ──────────────────────────────────────────────────────────

create table if not exists stories (
  id          uuid        primary key default gen_random_uuid(),
  dog_name    text        not null,
  description text        not null,
  photos      text[]      not null default '{}',   -- URLs das fotos (até 5)
  featured    boolean     default false,           -- aparece na prévia da home
  created_at  timestamptz default now(),
  updated_at  timestamptz default now(),
  constraint stories_photos_max check (coalesce(array_length(photos, 1), 0) <= 5)
);

-- Auto-atualiza updated_at (reutiliza a função criada na seção 1)
drop trigger if exists stories_updated_at on stories;
create trigger stories_updated_at
  before update on stories
  for each row execute function update_updated_at();

-- RLS
alter table stories enable row level security;

-- Visitantes (anon): leitura de todas as histórias
drop policy if exists "Público lê histórias" on stories;
create policy "Público lê histórias"
  on stories for select
  to anon
  using (true);

-- Admin: qualquer usuário AUTENTICADO gerencia (só o admin consegue logar —
-- cadastro público desabilitado). Evita o foot-gun de fixar o ADMIN-UUID e
-- mantém a feature funcionando independentemente do UID.
-- Remove políticas antigas baseadas em ADMIN-UUID, se existirem:
drop policy if exists "Admin lê histórias"      on stories;
drop policy if exists "Admin insere história"   on stories;
drop policy if exists "Admin atualiza história" on stories;
drop policy if exists "Admin deleta história"   on stories;

drop policy if exists "Admin gerencia histórias" on stories;
create policy "Admin gerencia histórias"
  on stories for all
  to authenticated
  using (true)
  with check (true);

-- ──────────────────────────────────────────────────────────
-- 7. USUÁRIO ADMIN
-- NÃO crie o usuário admin por SQL (senha em texto puro).
-- Use o painel do Supabase:
--   Authentication → Users → Add user
--   Email: (seu email)   Senha: (senha forte)
-- ──────────────────────────────────────────────────────────
