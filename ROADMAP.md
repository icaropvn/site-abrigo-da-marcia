# ROADMAP DE IMPLEMENTAÇÃO - ABRIGO DA MÁRCIA

> **Fases 1–5 concluídas** — resumidas abaixo. O detalhamento original (com
> trechos de código) está em [`docs/roadmap-arquivo.md`](docs/roadmap-arquivo.md).
> A fase ativa (6 — Eventos & Reservas) está detalhada na íntegra mais abaixo.

---

## ✅ FASE 1: PERFORMANCE & OTIMIZAÇÃO — CONCLUÍDA (2026-06-04)

Imagens em **WebP com fallback** (`<picture>`), **lazy loading** (`loading="lazy"`
+ IntersectionObserver no catálogo), remoção de `overflow-x` desnecessário e
**otimização de fontes** (uma única família + `font-display: swap`).

## ✅ FASE 2: VISUAL & UX — CONCLUÍDA (2026-06-04)

Breakpoint intermediário (~800–1300px), **dark mode** (`prefers-color-scheme`) +
**toggle manual** (`js/theme-toggle.js`, persistido em `localStorage['tema']`,
atributo `data-theme` no `<html>`), **acessibilidade** (focus states, skip-link),
**menu mobile** (`js/mobile-menu.js` — fecha ao clicar no link/overlay/resize) e
**animações** de entrada (`js/animations.js`).

## ✅ FASE 3: FUNCIONALIDADES & DADOS — CONCLUÍDA (2026-06-04)

Dados dos cães em **`data/dogs.json`** renderizados por `js/render-dogs.js`,
**filtros** do catálogo (`js/catalog-filters.js`), **modal de detalhes** do cão
(depois unificado no `js/carousel.js` compartilhado com Histórias) e seção de
**voluntários** com formulário/links.

## ✅ FASE 4: PREPARAÇÃO PARA ADMIN — CONCLUÍDA (2026-06-04)

Backend **Node/Express/Mongoose** planejado e implementado como camada inicial —
**legado, removido do repositório em 2026-06-12** quando o projeto migrou para o
Supabase (ver histórico do git). Detalhe completo no arquivo.

### Migração para Supabase (2026-06-09)

Plataforma definitiva: **Supabase** (Postgres + Auth + Storage, free tier).
`supabase/schema.sql` (tabela `dogs` + RLS + bucket `dog-photos`), `render-dogs.js`
integrado (Supabase → fallback JSON) e **painel admin** (`pages/admin/login.html`
+ `index.html`, CRUD com upload). **Histórias do Abrigo**: tabela `stories`,
página dedicada, prévia na home e CRUD no admin (até 5 fotos por história).

## ✅ FASE 5: FEATURES AVANÇADAS — PARCIAL

**Favoritos** (`js/favorites.js`, `localStorage`) e **SEO** (meta tags Open
Graph/Twitter, `sitemap.xml`, `robots.txt`) concluídos. **Analytics** previsto,
ainda não implementado.

---

## 🔜 FASE 6: EVENTOS DE ARRECADAÇÃO & RESERVAS — PLANEJADA (2026-06-12)

**Branch:** `feature/eventos-reservas`

**CONTEXTO:**
De tempos em tempos o Abrigo realiza eventos de arrecadação: venda de produtos (pizzas, sorvetes, camisetas) e rifas (quantidade de números, valor por número e prêmio definidos). Hoje o controle é feito manualmente em planilha de Excel pelos voluntários. O objetivo é o próprio cliente registrar sua reserva pelo site, e o admin gerenciar tudo pelo painel.

**PREMISSAS CONFIRMADAS:**

- Apenas **um evento ativo por vez**; cada evento é de um único tipo (`rifa` ou `venda`), com nome personalizado.
- Eventos têm **data de início e fim**; metas de arrecadação podem ser ultrapassadas (não há limite rígido de estoque).
- Histórico público mantém apenas os **últimos 3 eventos encerrados** (sugestão adotada).
- Evento tem **capa + pequeno conjunto de imagens de divulgação** (Storage, padrão dos buckets existentes).
- Reserva exige **nome + contato (telefone ou e-mail)** — sem cadastro de usuário.
- **Uma reserva = um pedido simples**; se a pessoa esqueceu um item, faz outra reserva com os mesmos dados.
- Rifa: grade visual com todos os números (livres × reservados); número reservado exibe o **primeiro nome** do comprador; liberação de número não pago é **manual pelo admin**.
- Pagamento: **PIX com chave fixa por evento** — exibir QR Code + botão "copiar chave" após a reserva. Conferência de pagamento é manual, externa à plataforma.
- Confirmação da reserva: **mensagem simples na tela** (sem e-mail).
- Consulta/cancelamento pelo cliente: **via contato com o abrigo** (código de reserva privado fica para melhoria futura).
- Status da reserva: **Reservado → Pago → Entregue** (+ Cancelado), de troca fácil no admin.
- Admin: **busca** e **painel de totais** desde o início; exportar CSV é desejável mas não essencial; apenas **um administrador** (Supabase Auth atual).
- Sorteio: **tela dedicada com a estética do site** (usada em transmissão ao vivo); número ganhador exibido publicamente após o sorteio.
- LGPD: dados pessoais **removidos/anonimizados após certo período** para manter o banco leve.
- **Ordem de implementação: rifa primeiro (6.1–6.4), venda de produtos depois (6.5).**

**RESTRIÇÕES DE PLATAFORMA:**
GitHub Pages (site 100% estático) + Supabase free tier. Toda a lógica roda no cliente; regras sensíveis ficam no banco (RLS + funções SQL/RPC). Sem servidor próprio, sem e-mail transacional, sem jobs pagos.

**PRIVACIDADE (princípio do projeto — ver `docs/privacidade-dados-pessoais.md`):**
Dados pessoais (nome, contato) **nunca** aparecem em páginas públicas — só o admin os vê. A grade pública da rifa mostra apenas quais números estão tomados ("Reservado"), e o número sorteado é exibido **sem o nome** do ganhador. O nome do ganhador aparece somente na tela de sorteio do admin, exibida durante a transmissão ao vivo (prestação de contas acontece na live, não no site).

---

### 6.1 | Banco de Dados (Supabase) — schema, RLS e RPC

**O QUÊ:**
Estrutura de dados para eventos, produtos e reservas, com inserção pública segura e leitura pública que **não expõe dados pessoais**.

> **Implementado em `supabase/eventos-schema.sql`** — esse arquivo é a fonte da verdade (inclui índices, triggers, views e as RPCs completas); o bloco abaixo é o esboço de planejamento.

**SCHEMA (esboço):**

```sql
-- Evento (um ativo por vez; campos de rifa anulaveis quando type = 'venda')
create table events (
    id uuid primary key default gen_random_uuid(),
    type text not null check (type in ('rifa', 'venda')),
    name text not null,
    description text,
    cover_url text,
    gallery jsonb default '[]',            -- urls das imagens de divulgação
    starts_at date not null,
    ends_at date not null,
    status text not null default 'rascunho'
        check (status in ('rascunho', 'ativo', 'encerrado', 'arquivado')),
    goal_amount numeric,                   -- meta (pode ser ultrapassada)
    pix_key text,
    payment_instructions text,
    raffle_total_numbers int,              -- rifa
    raffle_number_price numeric,           -- rifa
    raffle_prize text,                     -- rifa
    raffle_winner_number int,              -- preenchido após o sorteio
    -- preenchido pela função de limpeza (6.6) ANTES de deletar as reservas,
    -- para o histórico público continuar completo sem dados pessoais
    -- ex: {"total_raised": 2500, "items_sold": 100, "reservations": 87}
    summary jsonb,
    created_at timestamptz default now()
);

-- Produtos do evento de venda, com atributos definidos pelo admin
create table event_products (
    id uuid primary key default gen_random_uuid(),
    event_id uuid not null references events(id) on delete cascade,
    name text not null,
    price numeric not null,
    -- ex: [{"name": "Tamanho", "options": ["P","M","G"]},
    --      {"name": "Gênero", "options": ["Masculina","Feminina"]}]
    attributes jsonb default '[]'
);

-- Reserva (dados pessoais — nunca legíveis publicamente)
create table reservations (
    id uuid primary key default gen_random_uuid(),
    event_id uuid not null references events(id) on delete cascade,
    customer_name text not null,
    contact text not null,                 -- telefone ou e-mail
    status text not null default 'reservado'
        check (status in ('reservado', 'pago', 'entregue', 'cancelado')),
    notes text,                            -- anotações do admin
    created_at timestamptz default now()
);

-- Itens da reserva: número de rifa OU produto + variação + quantidade
create table reservation_items (
    id uuid primary key default gen_random_uuid(),
    reservation_id uuid not null references reservations(id) on delete cascade,
    raffle_number int,                                       -- rifa
    product_id uuid references event_products(id),           -- venda
    variation jsonb,        -- ex: {"Tamanho": "M", "Gênero": "Masculina"}
    quantity int default 1
);

-- Número de rifa único por evento (ignora reservas canceladas)
-- via unique index parcial calculado a partir da reserva ativa
```

**SEGURANÇA (RLS):**

- `events` / `event_products`: SELECT público apenas de eventos `ativo`/`encerrado`/`arquivado`; escrita só autenticado (admin).
- `reservations` / `reservation_items`: **nenhum SELECT público**; escrita pública apenas via RPC (abaixo); admin lê/edita tudo.
- **View pública da rifa** (`raffle_board`): expõe somente `raffle_number`, `primeiro nome` e `status != 'cancelado'` — é o que alimenta a grade de números sem vazar contato/sobrenome.
- **Totais públicos** (números vendidos, arrecadação da meta) via view agregada, sem dados individuais.

**RPC `create_reservation` (função SQL `security definer`):**
Ponto único de inserção pública. Em uma transação: valida o payload, confere se o evento está ativo e dentro do período, grava reserva + itens e falha de forma atômica se o número da rifa já estiver tomado (unique index). Também concentra o **anti-abuso**:

- Limite de reservas por contato/por hora (consulta `created_at` recentes).
- Campo *honeypot* no formulário (bots preenchem, a RPC rejeita).
- Limite de itens por chamada.

> Por que RPC e não INSERT direto: com INSERT público direto não há como validar regras de negócio nem limitar volume; a função roda no banco com privilégios próprios, mantendo as tabelas fechadas. Custo zero no free tier (não usa Edge Functions).

---

### 6.2 | Página Pública de Eventos (rifa primeiro)

> **Atualização (2026-06-13) — seleção múltipla de números:** a regra inicial "uma reserva = um número" foi substituída por "até N números por reserva" (N configurável por evento, padrão 5, campo `events.raffle_max_per_reservation`). Na página pública, o cliente toca para selecionar vários números (barra de ação fixa mostra quantidade + total + "Reservar"); ao atingir o limite as demais células ficam esmaecidas. Só então abre o formulário de dados, que envia todos os números numa única chamada à RPC. A RPC valida o limite (`RIFA_LIMITE_NUMEROS`). Barra de progresso pública mostra **números vendidos** (sem expor R$). **Requer reexecução do `eventos-schema.sql` — inclusive a função `create_reservation` (se rodar só a coluna, a reserva múltipla falha com `RIFA_UM_NUMERO`).**
>
> **Privacidade (2026-06-13):** a grade pública mostra só "Reservado" (sem nome), e o número sorteado é exibido sem o nome do ganhador. Cores dos números: disponível = claro com texto vermelho; selecionado = vermelho; reservado = esmaecido. Ver `docs/privacidade-dados-pessoais.md`.
>
> **Campo de contato inteligente (2026-06-13):** o input "Telefone ou e-mail" detecta o tipo em tempo real — com letras/@ vira e-mail (remove espaços, valida formato), só dígitos vira telefone com máscara brasileira (`(11) 98765-4321`, fixo 4-4 ou celular 5-4, com `+55` opcional). Dica abaixo do campo orienta o preenchimento e a validação no envio exige @ no e-mail / DDD no telefone.

**O QUÊ:**
Nova página `pages/eventos.html` + chamada na home quando há evento ativo (padrão da seção de Histórias).

**COMO IMPLEMENTAR:**

1. **`pages/eventos.html` + `js/render-events.js` + `styles/eventos.css`**:
   - Sem evento ativo: mensagem amigável + histórico dos últimos 3 eventos encerrados (capa, nome, resultado da rifa se houver).
   - Com evento ativo (rifa): capa, descrição, prêmio, valor por número, período, barra de progresso da meta e **grade de números** (livres × reservados, com primeiro nome no número tomado).
2. **Fluxo de reserva**: clicar em número livre → formulário (nome + contato + honeypot oculto) → chamada à RPC → tela de confirmação com **QR Code PIX + chave "copia e cola"**.
   - QR Code: payload BR Code (EMV) gerado no cliente a partir de `pix_key` + nome do recebedor + cidade (campos do evento) + lib leve de QR via CDN — sem servidor. Alternativa: o admin cola um copia-e-cola pronto (ex: gerado no PagSeguro) no campo `pix_payload`, que tem prioridade.
   - Conflito de número (alguém reservou ao mesmo tempo): mensagem clara "esse número acabou de ser reservado, escolha outro" e grade recarregada. Sem Realtime, mantendo o free tier folgado.
3. **Número ganhador**: quando `raffle_winner_number` estiver preenchido, destaque visual na página (banner "Número sorteado: X — parabéns, [nome]!").
4. **Home**: card/banner "Evento ativo" linkando para a página, renderizado por `render-events.js` quando houver evento `ativo`.
5. Dark mode, acessibilidade (navegação por teclado na grade) e mobile desde o início, seguindo os padrões já estabelecidos.

---

### 6.3 | Admin — Gestão de Eventos e Reservas

> **✅ Implementado (2026-06-12)** em `pages/admin/eventos.html` (+ estilos no fim de `styles/admin.css` e link "Eventos" na nav dos 3 admins). Pendente apenas teste no navegador após o schema da 6.1 ser executado no Supabase. Reserva manual de **produtos** (venda) fica para a 6.5; por ora a venda só registra cliente/status/anotações.
>
> **Melhorias (2026-06-12):** (a) valor por número **calculado automaticamente** (meta ÷ quantidade) no formulário da rifa — o admin pode sobrescrever manualmente (inclusive apagando com backspace) sem afetar meta/quantidade; o preenchimento só ocorre quando meta/quantidade mudam; (b) o **copia-e-cola pronto** (`pix_payload`) agora recebe o valor da reserva injetado no campo 54 do BR Code (`PixBRCode.setAmount` em `js/pix.js`, CRC recalculado) — o app do banco abre com o valor preenchido, igual já acontecia no código gerado pela chave; (c) página pública da rifa **não expõe valores arrecadados**: a barra de progresso mostra números vendidos ("Já foram vendidos X dos Y números!"); (d) **mobile**: tabelas de eventos/reservas seguem o padrão de colunas ocultas (`.t-events`/`.t-reservations`, contato embutido na célula do cliente), toolbar e botões adaptados, fontes ≥16px nos campos (sem zoom no iOS), modal de reserva e tela de sorteio otimizados para telas pequenas.

**O QUÊ:**
Novas seções no painel admin existente (`pages/admin/`), no mesmo padrão visual do CRUD de cães/histórias.

**COMO IMPLEMENTAR:**

1. **CRUD de eventos**: criar/editar evento (tipo, nome, descrição, datas, meta, PIX, capa + galeria via Storage; campos de rifa quando aplicável). Ativar/encerrar/arquivar com confirmação. Bloquear segundo evento `ativo`.
2. **Gestão de reservas**:
   - Lista com **busca** (nome, contato, número da rifa) e filtro por status.
   - Troca rápida de status (Reservado → Pago → Entregue) e **Cancelar** (libera o número da rifa automaticamente — é a "liberação manual" de número não pago).
   - Edição completa dos dados da reserva (corrigir erros do cliente) e criação manual (pedidos recebidos por telefone/WhatsApp).
3. **Painel de totais** por evento: números vendidos × total, arrecadação esperada × confirmada (somente status Pago), reservas por status.
4. **Exportar CSV** da lista de reservas (geração client-side, sem servidor) — útil para a conferência em planilha durante a transição.

---

### 6.4 | Tela de Sorteio

> **✅ Implementado (2026-06-12)** em `pages/admin/sorteio.html` + `styles/sorteio.css` (palco escuro dedicado, independente do tema). Sorteia entre números **Pago ou Entregue** com `crypto.getRandomValues`, animação de roleta desacelerando + confete, botão "Confirmar resultado" grava `raffle_winner_number`, "Sortear novamente" antes de confirmar e "Refazer sorteio" (limpa o resultado) depois. Modo apresentação oculta os controles para a live (ESC restaura). **Acesso (2026-06-14): botão "Sortear" em cada rifa ativa/encerrada na tabela de eventos**, que abre `sorteio.html?event=<id>` já vinculado àquela rifa (a tela pré-seleciona o evento da URL). O antigo botão "Tela de sorteio" no topo da página foi removido. Pendente teste no navegador após o schema da 6.1 rodar no Supabase.

**O QUÊ:**
Página dedicada com a estética do site, pensada para ser exibida em **transmissão ao vivo**.

**COMO IMPLEMENTAR:**

1. `pages/admin/sorteio.html` (acesso autenticado): sorteia entre os números com status **Pago**, com animação de roleta/contagem antes de revelar o número e o primeiro nome do ganhador.
2. Botão "Confirmar resultado" grava `raffle_winner_number` no evento — a partir daí a página pública (6.2) exibe o ganhador.
3. Possibilidade de re-sortear antes de confirmar (ex: erro na transmissão).

---

### 6.5 | Venda de Produtos (segunda etapa)

**O QUÊ:**
Estende a infraestrutura da rifa para eventos de venda. Implementar **somente após a rifa estar validada em produção**.

**COMO IMPLEMENTAR:**

1. **Admin**: CRUD de produtos do evento com **atributos configuráveis** (ex: "Tamanho: P/M/G", "Gênero: Masculina/Feminina", "Sabor: Calabresa/Mussarela") e preço por produto.
2. **Página pública**: vitrine dos produtos; formulário monta o pedido por combinações de variação + quantidade (ex: 3 camisetas masculinas M + 2 femininas P) com cálculo do total antes de confirmar.
3. **Reserva** usa o mesmo fluxo da rifa (mesma RPC, mesmos status, mesmo PIX); o painel de totais passa a somar `quantidade × preço`.
4. **Validação de variações na RPC**: como cada produto define seus próprios atributos (ex: camiseta com Gênero + Tamanho, caneca só com Cor, pizza sem nenhum), a `variation` enviada pelo cliente é conferida contra o `attributes` do produto no banco — exatamente as chaves definidas, valores dentro das `options`, preço sempre o do banco. JSON fora da definição → reserva rejeitada.

> **✅ Implementado (2026-06-14).** Backend já vinha pronto na 6.1 (`event_products`,
> branch `venda` da RPC `create_reservation` com validação de variações, view
> `event_totals` somando `quantidade × preço`). Frontend desta etapa:
> - **Admin** (`pages/admin/eventos.html`): os **produtos são cadastrados dentro do
>   modal do evento** (seção "Produtos" visível para tipo=venda) — ≥1 produto
>   obrigatório, com botão "+ Adicionar produto" para múltiplos. Cada produto tem
>   nome, preço, imagem opcional e **variações configuráveis** (nome + opções por
>   vírgula; nomes únicos por produto; opção única = informação fixa, já
>   pré-selecionada). No salvar, `reconcileProducts` insere/atualiza/remove (remoção
>   bloqueada se o produto já está em reserva — FK `on delete restrict`). O modal de
>   reserva tem o montador de pedido (produto + variação + quantidade por linha,
>   total ao vivo); admin grava direto na tabela (`syncProductItems`). Chips de
>   itens mostram nome do produto + variação.
> - **Público** (`js/render-events.js` + `styles/eventos.css`): vitrine de produtos
>   (`event_products`) com seletor de variação + quantidade, carrinho com total e
>   barra de ação fixa (reusa `.raffle-actionbar`); reserva pela mesma RPC/PIX. O
>   modal de reserva foi generalizado (`openReserveModal(ev, opts)` com `items`
>   genéricos; openers `openRaffleReserveModal`/`openSaleReserveModal`).
> - Cache-bust: `render-events.js?v=2`, `eventos.css?v=2`, admin `admin.css?v=8`.

---

### 6.6 | Retenção de Dados (LGPD) e Limpeza

**O QUÊ:**
Coletar o mínimo, informar a finalidade e **excluir de verdade** os dados de eventos antigos — o objetivo é tanto LGPD quanto poupar volume no free tier, então nada de apenas ocultar/mascarar.

**COMO IMPLEMENTAR:**

1. **Texto curto de finalidade no formulário**: "Seus dados serão usados apenas para o controle deste evento e removidos após o encerramento."
2. **Exclusão com backup prévio** — botão "Limpar dados antigos" no admin, em dois passos obrigatórios:
   - **Passo 1 — Backup**: gera e baixa o CSV completo do evento (reservas, itens, números, status) no navegador — mesmo mecanismo client-side do export do 6.3. O admin guarda localmente ou na nuvem.
   - **Passo 2 — Exclusão**: após o download, confirma e executa uma função SQL que, **na mesma transação**, (a) grava os agregados não pessoais em `events.summary` (total arrecadado, itens/números vendidos, total de reservas) e (b) **deleta** as `reservations` e `reservation_items` do evento (~90 dias após o fim). A linha do evento permanece e alimenta o histórico público com esses agregados — o nome do ganhador deixa de aparecer após a limpeza, restando só o número sorteado.
3. **Histórico público**: manter os últimos 3 eventos `arquivado`; mais antigos são deletados por completo (registro + imagens no Storage), também via fluxo com backup prévio.

> Melhoria futura: gatilho que gera o CSV e o **envia automaticamente ao e-mail do admin** antes da exclusão (exige Edge Function + serviço de e-mail, ex: Resend free tier) — aí a limpeza poderia ser totalmente automática via `pg_cron`. Enquanto for manual, o download no navegador cumpre o papel de backup sem custo nem infraestrutura.

---

### Melhorias futuras (fora do escopo inicial)

- Prazo de pagamento configurável por evento, com liberação automática de números não pagos.
- Código de reserva privado para o cliente consultar/acompanhar o próprio pedido.
- Confirmação por e-mail (exigiria Edge Function + serviço de envio).
- **Automações via `pg_cron`** (agrupar numa tarefa só — combinado 2026-06-13):
  (a) auto-encerrar eventos `ativo` cujo `ends_at` passou há +7 dias (rede de
  segurança caso o admin esqueça); (b) liberar números de reservas não pagas após
  o prazo; (c) backup por e-mail + exclusão de dados agendada (ver 6.6). Exigem
  habilitar a extensão `pg_cron` (e Edge Function + Resend para o e-mail).
- **Testes automatizados** (combinado 2026-06-13): criar suíte conforme o projeto
  crescer — candidatos: a RPC `create_reservation` (limites, validações, preço do
  banco), o purge/retenção, e os helpers de `js/core/*` (já são módulos testáveis).
- Grade da rifa em tempo real (Supabase Realtime).
- Reserva multi-item unificada (carrinho).

---

## RESUMO DE IMPLEMENTAÇÃO

| Fase | Componente | Status |
|------|-----------|--------|
| 1 | Otimização de imagens | ✅ Concluído |
| 1 | Lazy loading | ✅ Concluído |
| 1 | Remover overflow | ✅ Concluído |
| 1 | Otimizar fontes | ✅ Concluído |
| 2 | Responsividade | ✅ Concluído |
| 2 | Dark mode + toggle manual | ✅ Concluído |
| 2 | Acessibilidade | ✅ Concluído |
| 2 | Animações | ✅ Concluído |
| 2 | Menu mobile | ✅ Concluído |
| 3 | Estrutura JSON | ✅ Concluído |
| 3 | Filtros | ✅ Concluído |
| 3 | Modal de detalhes | ✅ Concluído |
| 3 | Voluntários | ✅ Concluído |
| 4 | Backend Express | ✅ Concluído (legacy — removido do repo em 2026-06-12, ver histórico do git) |
| 4 | API de cães | ✅ Concluído (legacy — removido do repo em 2026-06-12) |
| 4 | Autenticação | ✅ Concluído (legacy — removido do repo em 2026-06-12) |
| Supabase | Migração de plataforma (Firebase → Supabase) | ✅ Concluído (2026-06-09) |
| Supabase | schema.sql + RLS + Storage bucket dog-photos | ✅ Concluído |
| Supabase | render-dogs.js integrado (Supabase → backend → JSON) | ✅ Concluído |
| Supabase | Painel admin — login.html + index.html (CRUD + upload) | ✅ Concluído |
| 5 | Favoritos (localStorage) | ✅ Concluído |
| 5 | SEO meta tags + sitemap.xml + robots.txt | ✅ Concluído |
| 5 | Analytics | Pronto para implementar |
| 6 | Schema eventos/reservas + RLS + RPC (`supabase/eventos-schema.sql`) | 🚧 Aguardando execução no Supabase |
| 6 | Página pública de eventos (rifa + PIX QR Code) | 🚧 Implementado — pendente teste com schema executado |
| 6 | Admin — eventos, reservas, totais, CSV | 🚧 Implementado — pendente teste com schema executado |
| 6 | Tela de sorteio | 🚧 Implementado — pendente teste com schema executado |
| 6 | Venda de produtos (variações configuráveis) | ✅ Implementado (2026-06-14) — pendente teste no navegador |
| 6 | Retenção LGPD + limpeza de dados | 🔜 Planejado |

---

**PRÓXIMOS PASSOS:**
1. Criar branch `feature/eventos-reservas`
2. Implementar 6.1 (schema + RLS + RPC `create_reservation`) e testar no SQL Editor
3. Implementar 6.2 (página pública da rifa) e 6.3 (admin)
4. Implementar 6.4 (tela de sorteio) e validar o fluxo completo com um evento de teste
5. Após a rifa em produção: 6.5 (venda de produtos) e 6.6 (retenção LGPD)
6. Implementar Analytics (Google Analytics ou Supabase Edge Functions)


---

## 🔧 OTIMIZAÇÕES TÉCNICAS / DÍVIDA TÉCNICA (próximas)

Combinado em 2026-06-13, **após publicar e validar a Fase 6**. Objetivo: reduzir
duplicação e o tamanho dos arquivos (que encarece manutenção e cada iteração de
desenvolvimento). Fazer com calma, um arquivo por vez, validando com `node --check`.

1. **Extrair o `<script>` embutido das páginas admin** para arquivos próprios em
   `js/` (ex.: `js/admin-eventos.js`, `js/admin-dogs.js`, `js/admin-stories.js`,
   `js/admin-sorteio.js`, `js/admin-seguranca.js`). Hoje, por exemplo,
   `pages/admin/eventos.html` tem ~1.200 linhas misturando HTML + JS.
2. ✅ **Criar `js/admin-common.js`** — feito em 2026-06-13. Centraliza o que estava
   duplicado nas páginas admin: o client Supabase (`sb`), os helpers (`esc`,
   `slugify(s, fallback)`, `formatMoney`, `formatDate`) e o guard de auth + AAL2,
   agora `requireAdminSession(opts)` (`{ aal2: false }` na página de Segurança).
   Exposto como globais de mesmo nome → call sites inalterados. O `ICON_STAR` foi
   para `js/icons.js` (`ICON_STAR_SVG`). Inclui as 6 páginas (login só usa `sb`).
3. ✅ **Desduplicar o SVG do cão** (placeholder "sem foto") — feito em 2026-06-13.
   Agora em `js/icons.js` (`ICON_DOG_SVG`), incluído nas páginas que o consomem;
   carousel.js, render-stories.js e os dois admins só referenciam a constante.
4. ✅ **Revisar `styles/index.css`/`styles/catalogo.css`** — feito em 2026-06-13.
   Único morto encontrado: `#donation-button-generic` (removido). As "duplicatas"
   de seletores são overrides responsivos legítimos (base + breakpoints `@media`).

> Nota: itens 2, 3 e 4 concluídos. O **item 1** (extrair o `<script>` embutido das
> páginas admin) foi **absorvido pela MIGRAÇÃO DE ARQUITETURA** abaixo — em vez de
> só recortar para `js/admin-*.js`, a extração vira a criação dos *controllers* de
> página dentro da nova estrutura de módulos. Evita retrabalho sobre os mesmos
> arquivos. Ver a próxima seção.

---

## 🏗️ MIGRAÇÃO DE ARQUITETURA — Módulos ES + camada de dados (planejada)

Combinado em 2026-06-13. O projeto cresceu de "site estático simples" para uma
pequena aplicação (público + admin + auth/2FA + rifa + reservas + sorteio). Esta
seção é o **plano** — nada implementado ainda. Continua **sem build step** e sem
framework: usa **módulos ES nativos** (rodam direto no navegador; GitHub Pages
serve normal).

### Por que (dores atuais)
- HTML gigante com JS embutido (`pages/admin/eventos.html` ~1.100 linhas).
- Dois padrões de acesso a dados (público = `fetch` na REST; admin = supabase-js),
  com queries/RPC espalhadas — uma mudança de schema obriga caçar em vários pontos.
- Tudo em escopo global, dependente da ordem dos `<script>`.
- Constantes mágicas repetidas (labels de status, `MAX_PHOTOS`, defaults de PIX).

### Objetivos / não-objetivos
- **Objetivos:** uma fonte única de acesso a dados por domínio; isolamento por
  módulo (sem global/ordem de script); config centralizada; absorver o item 1 da
  dívida (extrair JS dos admins) como criação de *controllers*.
- **Não-objetivos:** introduzir framework, bundler ou TypeScript; reescrever tudo
  de uma vez. Migração **incremental, página por página**, convivendo com o legado.

### Padrão: camadas leves (MVC-lite)
- `data/` = **model/repository** — toda query e RPC de um domínio num só módulo.
- `ui/` + funções de render = **view** — componentes reutilizáveis.
- `pages/` = **controller** — importa `data` + `ui` + `core` e liga ao DOM.

### Estrutura-alvo
```
js/
  config.js              # creds Supabase, PIX_DEFAULTS, MAX_PHOTOS, STATUS_LABEL, EVENT_STATUS_LABEL
  core/
    supabase.js          # cria/exporta o client (import ESM do supabase-js)
    rest.js              # helper de fetch na REST (leitura pública anon)
    dom.js               # esc, slugify, formatMoney, formatDate, helpers de DOM
    icons.js             # ICON_* (move js/icons.js)
    auth.js              # requireAdminSession, fluxo de login/2FA
  data/                  # camada de dados (Repository), 1 por domínio
    events.js            #   getActiveEvent, listEvents, saveEvent, createReservation...
    dogs.js
    stories.js
    reservations.js
  ui/                    # componentes reutilizáveis
    modal.js
    photo-uploader.js    # o padrão {url,file,preview} repetido em dogs/stories/events
    toast.js
  pages/                 # 1 controller por página
    admin-eventos.js, admin-historias.js, admin-dogs.js, admin-sorteio.js,
    admin-seguranca.js, login.js, catalogo.js, eventos.js, historias.js, home.js
```

### Convenções
- Módulos ES nativos (`import`/`export`); `<script type="module" src="…">` na página.
- supabase-js via ESM **vendorizado** (decidido na Fase A, 2026-06-13): bundle
  autossuficiente em `js/vendor/supabase-js@2.108.1.esm.js` (gerado com esbuild
  `--bundle --platform=browser` — comando registrado no banner do arquivo). Sem
  CDN em runtime → alinha com a CSP estrita. `core/supabase.js` importa dele.
- Comentários em PT-BR. Validar cada módulo com `node --check` (agora são `.js`
  puros, sem precisar extrair IIFE) + teste manual no navegador.
- O `<script>` inline de tema no `<head>` **permanece inline** (precisa rodar antes
  do paint p/ evitar flash); módulos são *deferred* e rodariam tarde demais.

### Fases (ordem de execução)
- **Fase A — Fundação. ✅ CONCLUÍDA (2026-06-13).** Criados `js/config.js`
  (creds, PIX_DEFAULTS, MAX_PHOTOS, STATUS_LABEL, EVENT_STATUS_LABEL) e
  `js/core/{supabase,rest,dom,icons,auth}.js`, todos exportando o conteúdo antes
  global de `admin-common.js`/`icons.js`/`supabase-config.js`/`render-events.js`.
  supabase-js vendorizado (ver Convenções). Nenhuma página mudou — o legado segue
  intacto. Todos os módulos passam `node --check` + import real no node.
- **Fase B — Piloto.** Migrar **`admin/historias.html`** (porte médio, baixo risco)
  para `type="module"`: criar `data/stories.js` + `pages/admin-historias.js`, trocar
  os `<script>`. Validar a fundo (login+2FA, CRUD, upload de fotos, tema). Serve de
  modelo para as demais.
- **Fase C — Rollout admin. ✅ CONCLUÍDA (2026-06-14).** Migrados `eventos`
  (+ `data/events.js`, `data/reservations.js`), `index`/cães (+ `data/dogs.js`),
  `sorteio`, `seguranca` e `login`. `compressImage`→`core/image.js`,
  `adminToast`→`ui/toast.js`. Todos validados com `node --check`.
- **Fase D — Páginas públicas. ✅ CONCLUÍDA (2026-06-14).** `historias`, `eventos`,
  home e `catalogo` migradas. Decisão de peso: **mantido REST** (sem supabase-js nas
  públicas) — os `render-*.js`/`carousel.js`/`dog-modal.js` passaram a `type=module`
  importando `core/rest.js` (fetchJson) + `core/icons.js`; `PixBRCode`/`QRCode`
  seguem globais clássicos (pix.js/qrcodejs). `catalog-filters`/`favorites`/
  `lazy-load`/`date`/`mobile-menu`/`theme-toggle` continuam clássicos.
- **Fase E — Limpeza. ✅ CONCLUÍDA (2026-06-14).** Removidos `js/admin-common.js`
  (Fase C) e, após a Fase D, `js/supabase-config.js` e `js/icons.js` (órfãos).
  Convenções do CLAUDE.md atualizadas. Migração de arquitetura COMPLETA.

### Riscos e mitigação
- **`file://` não carrega módulos** (CORS). Dev local passa a exigir um server
  estático: `python3 -m http.server` na raiz. GitHub Pages não muda.
- **Dependência de CDN** (esm.sh) — equivalente ao jsdelivr de hoje; vendorizar
  elimina o risco (avaliar na Fase A).
- **Compatibilidade**: módulos ES têm ~96% de suporte; adequado a este público.
- **Regressão**: mitigada migrando 1 página por vez, com o legado intacto até a
  página nova passar nos critérios abaixo.

### Critério de "pronto" por página migrada
Console sem erros; guard de auth (+AAL2) funciona; CRUD/ações funcionam; tema
persiste sem flash; `node --check` passa nos módulos novos.
