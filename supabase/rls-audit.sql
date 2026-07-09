-- ============================================================
-- ABRIGO DA MÁRCIA — Auditoria de RLS (somente leitura)
-- ============================================================
--
-- Rode no SQL Editor do Supabase. NENHUMA query aqui altera dados —
-- são todas SELECT (a #9 usa uma transação que termina em ROLLBACK).
-- Objetivo: conferir o estado REAL do banco (fonte da verdade), que
-- pode divergir dos arquivos .sql versionados.
--
-- Como usar: rode bloco a bloco e compare com o "esperado" de cada um.
-- ============================================================


-- 1. RLS HABILITADO em todas as tabelas de public?
--    Esperado: rls_on = true em TODAS (dogs, stories, events,
--    event_products, reservations, reservation_items). Qualquer
--    false = tabela exposta — corrigir imediatamente.
select schemaname, tablename, rowsecurity as rls_on
from pg_tables
where schemaname = 'public'
order by rowsecurity, tablename;


-- 2. Cada tabela tem ao menos UMA policy?
--    RLS on + 0 policies = ninguém acessa (quebra o site).
--    RLS off + grants = exposto. Esperado: rls_on=true e policies>=1.
select t.tablename,
       t.rowsecurity                as rls_on,
       count(p.policyname)          as policies
from pg_tables t
left join pg_policies p
       on p.schemaname = t.schemaname and p.tablename = t.tablename
where t.schemaname = 'public'
group by t.tablename, t.rowsecurity
order by t.tablename;


-- 3. DUMP de todas as policies (quem / operação / condição).
--    Confira: anon só aparece em SELECT (e só nas tabelas/condições
--    esperadas); escritas são 'authenticated' com a checagem de aal2
--    (depois do 2fa-aal2.sql). reservations/reservation_items NÃO
--    devem ter NENHUMA linha com roles contendo 'anon'.
select tablename,
       policyname,
       roles,
       cmd                          as operacao,
       qual                         as using_expr,
       with_check                   as check_expr
from pg_policies
where schemaname in ('public', 'storage')
order by tablename, cmd, policyname;


-- 4. GRANTS de tabela/view para anon e authenticated.
--    Obs.: no Supabase é NORMAL anon/authenticated terem grants amplos —
--    quem realmente filtra é o RLS (itens 1–3). Use isto só para flagrar
--    grants em objetos que deveriam estar 100% fechados.
select table_name,
       grantee,
       string_agg(privilege_type, ', ' order by privilege_type) as privs
from information_schema.role_table_grants
where table_schema = 'public'
  and grantee in ('anon', 'authenticated')
group by table_name, grantee
order by table_name, grantee;


-- 5. Funções EXECUTÁVEIS por anon.
--    Esperado: SOMENTE create_reservation. Qualquer outra função
--    executável por anon merece revisão.
select p.proname,
       pg_get_function_identity_arguments(p.oid) as args
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and has_function_privilege('anon', p.oid, 'execute')
order by p.proname;


-- 6. Funções SECURITY DEFINER e seu search_path.
--    Esperado: create_reservation e purge_event_data com
--    search_path setado (ex.: "search_path=public"). "sem search_path"
--    numa função security definer é risco de sequestro de search_path.
select p.proname,
       p.prosecdef                                              as security_definer,
       coalesce(array_to_string(p.proconfig, ', '), 'SEM search_path (!)') as config
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.prosecdef
order by p.proname;


-- 7. Contas de usuário existentes.
--    Esperado: SÓ o admin. Como as policies de escrita confiam em
--    "só o admin consegue logar", qualquer conta inesperada aqui é
--    grave (teria escrita total ao atingir AAL2). fatores_2fa deve
--    ser >= 1 para o admin.
select u.email,
       u.created_at,
       u.last_sign_in_at,
       (select count(*) from auth.mfa_factors f
         where f.user_id = u.id and f.status = 'verified') as fatores_2fa
from auth.users u
order by u.created_at;


-- 8. Views SECURITY DEFINER (security_invoker = off).
--    raffle_board e event_totals são assim de propósito (expõem só
--    dados não pessoais). Confira que nenhuma OUTRA view definer
--    apareça sem querer.
select c.relname as view,
       coalesce((
         select option_value from pg_options_to_table(c.reloptions)
         where option_name = 'security_invoker'
       ), 'off (definer)') as security_invoker
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relkind = 'v'
order by c.relname;


-- 9. TESTE PRÁTICO: o que o papel 'anon' realmente enxerga?
--    Roda como anon dentro de uma transação e desfaz com ROLLBACK.
--    Esperado: reservations = 0 linhas (sem policy anon → RLS bloqueia);
--    raffle_board retorna a grade; events só os publicados.
begin;
  set local role anon;
  select 'reservations (esperado 0)' as teste, count(*) as linhas from reservations
  union all
  select 'raffle_board (grade pública)',        count(*) from raffle_board
  union all
  select 'events visíveis ao anon',             count(*) from events;
  -- se quiser ver vazamento de rascunho: deveria contar só ativo/encerrado/arquivado
rollback;


-- ============================================================
-- CHECAGENS QUE NÃO SÃO SQL (fazer no painel do Supabase):
--
--  A. CADASTRO PÚBLICO DESABILITADO (crítico):
--     Authentication → Sign In / Providers → Email →
--     "Allow new users to sign up" = OFF.
--     Todo o modelo de escrita admin depende disto: as policies
--     checam só AAL2, não um UID específico. Com signup ligado,
--     qualquer um poderia se cadastrar, ativar 2FA e ter escrita total.
--
--  B. A 'service_role key' NUNCA pode estar no front nem no repo
--     (ela ignora o RLS). O front usa só a 'anon key'. Confirme que
--     nenhum arquivo público contém a service_role.
-- ============================================================
