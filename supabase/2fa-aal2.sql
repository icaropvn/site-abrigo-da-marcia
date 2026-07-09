-- ============================================================
-- ABRIGO DA MÁRCIA — Exigir 2FA (AAL2) nas operações de admin
-- ============================================================
--
-- ⚠️  ORDEM IMPORTANTE — leia antes de rodar:
--   1. Primeiro ative o 2FA no painel (Admin → Segurança → Ativar 2FA)
--      e confirme que consegue fazer login com o código (chega em AAL2).
--   2. SÓ ENTÃO rode este arquivo.
--
-- Por quê: depois daqui, qualquer escrita/leitura admin exige a sessão
-- em AAL2 (segundo fator concluído). Se você rodar ANTES de ativar o 2FA,
-- sua sessão fica em AAL1 e você perde o acesso de escrita até ativar.
-- (O cadastro do 2FA em si não depende destas policies — usa o schema
-- de auth do Supabase — então dá para ativar mesmo após rodar isto.)
--
-- Para REVERTER, rode o bloco de ROLLBACK comentado no fim do arquivo.
--
-- Como funciona: o token de acesso do Supabase carrega a claim "aal".
-- (auth.jwt() ->> 'aal') vale 'aal1' (só senha) ou 'aal2' (senha + 2º fator).
-- "Cadastro público desabilitado" → só o admin loga, então `to authenticated`
-- + aal2 é equivalente a "admin com 2FA".
-- ============================================================

-- ── Cães (dogs) ─────────────────────────────────────────────
-- Consolida as policies antigas (inclui as baseadas em ADMIN-UUID) numa só.
drop policy if exists "Admin lê todos"  on dogs;
drop policy if exists "Admin insere"    on dogs;
drop policy if exists "Admin atualiza"  on dogs;
drop policy if exists "Admin deleta"    on dogs;
drop policy if exists "Admin gerencia cães" on dogs;
create policy "Admin gerencia cães"
  on dogs for all
  to authenticated
  using       ((auth.jwt() ->> 'aal') = 'aal2')
  with check  ((auth.jwt() ->> 'aal') = 'aal2');

-- ── Histórias (stories) ─────────────────────────────────────
drop policy if exists "Admin gerencia histórias" on stories;
create policy "Admin gerencia histórias"
  on stories for all
  to authenticated
  using       ((auth.jwt() ->> 'aal') = 'aal2')
  with check  ((auth.jwt() ->> 'aal') = 'aal2');

-- ── Eventos e reservas ──────────────────────────────────────
drop policy if exists "Admin gerencia eventos" on events;
create policy "Admin gerencia eventos"
  on events for all
  to authenticated
  using       ((auth.jwt() ->> 'aal') = 'aal2')
  with check  ((auth.jwt() ->> 'aal') = 'aal2');

drop policy if exists "Admin gerencia produtos" on event_products;
create policy "Admin gerencia produtos"
  on event_products for all
  to authenticated
  using       ((auth.jwt() ->> 'aal') = 'aal2')
  with check  ((auth.jwt() ->> 'aal') = 'aal2');

drop policy if exists "Admin gerencia reservas" on reservations;
create policy "Admin gerencia reservas"
  on reservations for all
  to authenticated
  using       ((auth.jwt() ->> 'aal') = 'aal2')
  with check  ((auth.jwt() ->> 'aal') = 'aal2');

drop policy if exists "Admin gerencia itens de reserva" on reservation_items;
create policy "Admin gerencia itens de reserva"
  on reservation_items for all
  to authenticated
  using       ((auth.jwt() ->> 'aal') = 'aal2')
  with check  ((auth.jwt() ->> 'aal') = 'aal2');

-- ── Storage (fotos) ─────────────────────────────────────────
drop policy if exists "Admin gerencia fotos" on storage.objects;
create policy "Admin gerencia fotos"
  on storage.objects for all
  to authenticated
  using       (bucket_id = 'dog-photos' and (auth.jwt() ->> 'aal') = 'aal2')
  with check  (bucket_id = 'dog-photos' and (auth.jwt() ->> 'aal') = 'aal2');

drop policy if exists "Admin gerencia fotos de eventos" on storage.objects;
create policy "Admin gerencia fotos de eventos"
  on storage.objects for all
  to authenticated
  using       (bucket_id = 'event-photos' and (auth.jwt() ->> 'aal') = 'aal2')
  with check  (bucket_id = 'event-photos' and (auth.jwt() ->> 'aal') = 'aal2');

-- Observação: as RPCs create_reservation / purge_event_data são SECURITY
-- DEFINER e seguem funcionando — a reserva pública (anon) não é afetada.
-- As views públicas (raffle_board, event_totals) e as policies de leitura
-- anônima (cães/histórias disponíveis) também permanecem intactas.


-- ============================================================
-- ROLLBACK — descomente e rode para voltar ao acesso só com senha
-- (admin autenticado, sem exigir 2FA). Útil se ficar travado.
-- ============================================================
--
-- drop policy if exists "Admin gerencia cães" on dogs;
-- create policy "Admin gerencia cães" on dogs for all to authenticated
--   using (true) with check (true);
--
-- drop policy if exists "Admin gerencia histórias" on stories;
-- create policy "Admin gerencia histórias" on stories for all to authenticated
--   using (true) with check (true);
--
-- drop policy if exists "Admin gerencia eventos" on events;
-- create policy "Admin gerencia eventos" on events for all to authenticated
--   using (true) with check (true);
--
-- drop policy if exists "Admin gerencia produtos" on event_products;
-- create policy "Admin gerencia produtos" on event_products for all to authenticated
--   using (true) with check (true);
--
-- drop policy if exists "Admin gerencia reservas" on reservations;
-- create policy "Admin gerencia reservas" on reservations for all to authenticated
--   using (true) with check (true);
--
-- drop policy if exists "Admin gerencia itens de reserva" on reservation_items;
-- create policy "Admin gerencia itens de reserva" on reservation_items for all to authenticated
--   using (true) with check (true);
--
-- drop policy if exists "Admin gerencia fotos" on storage.objects;
-- create policy "Admin gerencia fotos" on storage.objects for all to authenticated
--   using (bucket_id = 'dog-photos') with check (bucket_id = 'dog-photos');
--
-- drop policy if exists "Admin gerencia fotos de eventos" on storage.objects;
-- create policy "Admin gerencia fotos de eventos" on storage.objects for all to authenticated
--   using (bucket_id = 'event-photos') with check (bucket_id = 'event-photos');
