# Privacidade de Dados Pessoais — Princípio do Projeto

> Decisão registrada em 2026-06-13. Vale para todo o site (não só os eventos).

## Princípio

**Dados pessoais de clientes/visitantes (nome, contato, etc.) NUNCA aparecem em páginas públicas.** Eles existem apenas para verificação e gestão pelo admin.

### Páginas públicas (qualquer visitante)
- Não exibem nenhum dado pessoal de terceiros.
- Na rifa, a grade mostra apenas **quais números estão tomados** ("Reservado"), nunca quem reservou.
- O **número sorteado** é exibido publicamente, mas **sem o nome** do ganhador
  ("Número sorteado: 42 — parabéns ao ganhador!").
- A barra de progresso da rifa mostra **números vendidos**, sem expor valores arrecadados.

### Páginas privadas (admin autenticado)
- O admin **vê** os dados pessoais (nome, contato) para conferência, gestão de
  reservas e pagamento.
- Na **tela de sorteio** (`pages/admin/sorteio.html`), o **nome do ganhador é
  exibido** — espera-se que o sorteio seja feito durante uma **transmissão ao
  vivo**, então mostrar o ganhador é a forma de **prestação de contas** aos
  participantes. A prestação de contas acontece na live, não no site público.

## Como isso é garantido tecnicamente
- Tabelas `reservations` / `reservation_items` não têm SELECT público (RLS) —
  só o admin autenticado lê.
- A view pública `raffle_board` expõe somente `event_id` + `raffle_number`
  (sem nome). Ver `supabase/eventos-schema.sql`.
- A escrita pública passa só pela RPC `create_reservation`.

## Autenticação do admin (2FA / AAL2)
- O login admin tem **verificação em duas etapas (2FA)** via TOTP (app autenticador) — Supabase Auth, gratuito.
- Cadastro/remoção em **Admin → Segurança** (`pages/admin/seguranca.html`).
- O login pede o código de 6 dígitos após a senha; as páginas admin exigem sessão em **AAL2**.
- O banco reforça isso: as policies RLS de escrita admin exigem `aal = 'aal2'`
  (`supabase/2fa-aal2.sql`) — mesmo com a senha, sem o 2º fator não há acesso de escrita.
- Sessão persistente: o login é mantido entre recarregamentos/reaberturas
  (padrão do supabase-js: localStorage + refresh automático do token).

## Melhorias futuras de privacidade/segurança (planejadas)
- Aviso de LGPD/consentimento antes de o usuário enviar os dados.
- Métodos mais robustos de tratamento e proteção dos dados.
- Exclusão real dos dados após o evento (ver Fase 6.6 no ROADMAP.md).
