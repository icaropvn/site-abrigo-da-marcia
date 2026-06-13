// Código comum às páginas admin (pages/admin/*). Fonte única do que antes estava
// duplicado em cada página: o client Supabase, helpers de formatação e o guard de
// auth (+ AAL2). Expõe globais com os MESMOS nomes que antes eram locais, para que
// os call sites das IIFEs de cada página fiquem inalterados.
//
// Carregar DEPOIS de supabase-js (CDN) e de js/supabase-config.js (precisa de
// `supabase`, `SUPABASE_URL` e `SUPABASE_ANON_KEY`), e ANTES do <script> da página.

// ── Client Supabase (anon key pública) ──────────────────────────
// persistSession (localStorage) + autoRefreshToken são padrão: o admin
// permanece logado entre recarregamentos e reaberturas.
var sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ── Helpers de formatação ───────────────────────────────────────
// Escapa texto para interpolação segura em HTML.
function esc(s) {
    return String(s == null ? '' : s)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
// Gera um slug a partir de um texto. `fallback` é usado quando o resultado fica
// vazio (texto sem letras/números) — preserva o default de cada página.
function slugify(s, fallback) {
    fallback = fallback || 'item';
    return String(s || fallback)
        .toLowerCase()
        .normalize('NFD').replace(/[̀-ͯ]/g, '')
        .replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') || fallback;
}
// Formata um número como moeda BRL (R$).
function formatMoney(v) {
    return Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}
// Formata uma data ISO (YYYY-MM-DD…) como DD/MM/AAAA.
function formatDate(iso) {
    if (!iso) return '';
    var p = String(iso).slice(0, 10).split('-');
    return p.length === 3 ? p[2] + '/' + p[1] + '/' + p[0] : iso;
}

// ── Guard de auth (+ AAL2) ──────────────────────────────────────
// Garante uma sessão válida. Por padrão exige o 2º fator (AAL2) quando há 2FA
// cadastrado; passe { aal2: false } para pular essa checagem (página de Segurança,
// onde o 2FA é cadastrado). Em falha, redireciona para login.html e retorna null.
// Em sucesso, preenche #admin-email (se existir) e retorna a sessão.
async function requireAdminSession(opts) {
    var requireAal2 = !(opts && opts.aal2 === false);
    const { data } = await sb.auth.getSession();
    if (!data.session) { window.location.href = 'login.html'; return null; }
    if (requireAal2) {
        const aal = await sb.auth.mfa.getAuthenticatorAssuranceLevel();
        if (aal.data && aal.data.nextLevel === 'aal2' && aal.data.currentLevel !== 'aal2') {
            window.location.href = 'login.html'; return null;
        }
    }
    const emailEl = document.getElementById('admin-email');
    if (emailEl) emailEl.textContent = data.session.user.email;
    return data.session;
}
