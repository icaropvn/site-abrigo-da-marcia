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

// ── Dados padrão do PIX (constantes do abrigo) ──────────────────
// Pré-preenchem os campos de PIX ao criar/editar um evento (o admin pode
// sobrescrever por evento). Valores públicos — vão no QR/copia-e-cola.
// O pix.js sanitiza nome/cidade (remove acento, maiúsculas, corta no limite)
// na hora de montar o BR Code, então aqui ficam legíveis.
var PIX_DEFAULTS = {
    key:  'abrigodamarcia@gmail.com',
    name: 'Marcia Camara Barbosa',
    city: 'Ribeirão Preto'
};

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

// ── Compressão de imagem (client-side, sem libs) ────────────────
// Redimensiona a imagem para caber em `maxDim` (lado maior, em px) e a
// recomprime via Canvas, exportando em WebP (cai para JPEG se o navegador
// não suportar) na qualidade dada. Poupa o admin de redimensionar à mão e
// economiza o Storage do free tier. Só mexe em jpeg/png/webp; outros tipos
// (e falhas de canvas) voltam intactos. Mantém o original se ele já for
// menor que o resultado. Retorna um File — `uploadImage` segue inalterado.
async function compressImage(file, opts) {
    opts = opts || {};
    var maxDim  = opts.maxDim  || 1600;
    var quality = opts.quality || 0.82;
    if (!/^image\/(jpe?g|png|webp)$/i.test(file.type)) return file;

    var dataUrl = await new Promise(function(res, rej) {
        var r = new FileReader();
        r.onload = function() { res(r.result); };
        r.onerror = function() { rej(new Error('Falha ao ler a imagem.')); };
        r.readAsDataURL(file);
    });
    var img = await new Promise(function(res, rej) {
        var im = new Image();
        im.onload  = function() { res(im); };
        im.onerror = function() { rej(new Error('Imagem inválida.')); };
        im.src = dataUrl;
    });

    var scale = Math.min(1, maxDim / Math.max(img.naturalWidth, img.naturalHeight));
    var cw = Math.round(img.naturalWidth  * scale);
    var ch = Math.round(img.naturalHeight * scale);
    var canvas = document.createElement('canvas');
    canvas.width = cw; canvas.height = ch;
    canvas.getContext('2d').drawImage(img, 0, 0, cw, ch);

    // Tenta WebP; navegadores sem suporte devolvem outro tipo → cai para JPEG.
    var type = 'image/webp';
    var blob = await new Promise(function(res) { canvas.toBlob(res, type, quality); });
    if (!blob || blob.type !== type) {
        type = 'image/jpeg';
        blob = await new Promise(function(res) { canvas.toBlob(res, type, quality); });
    }
    if (!blob || blob.size >= file.size) return file;   // não compensou: fica o original

    var ext  = type === 'image/webp' ? 'webp' : 'jpg';
    var base = (file.name || 'imagem').replace(/\.[^.]+$/, '');
    return new File([blob], base + '.' + ext, { type: type });
}

// ── Toast (notificação flutuante) ───────────────────────────────
// Mensagem que aparece no canto e some sozinha. Substitui o alerta preso no
// topo do form para erros pontuais. type: 'error' | 'success' | 'info'.
function adminToast(msg, type) {
    var host = document.getElementById('admin-toasts');
    if (!host) {
        host = document.createElement('div');
        host.id = 'admin-toasts';
        host.className = 'admin-toasts';
        document.body.appendChild(host);
    }
    var el = document.createElement('div');
    el.className = 'admin-toast admin-toast-' + (type || 'info');
    el.setAttribute('role', 'alert');
    el.textContent = msg;
    host.appendChild(el);
    requestAnimationFrame(function() { el.classList.add('show'); });
    setTimeout(function() {
        el.classList.remove('show');
        setTimeout(function() { el.remove(); }, 300);
    }, 4500);
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
