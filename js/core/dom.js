// Helpers de formatação e DOM (módulo ES). Portados de admin-common.js sem mudar
// o comportamento — apenas passam a ser `export` em vez de globais. Usados pelas
// views/controllers das páginas migradas.

// Escapa texto para interpolação segura em HTML.
export function esc(s) {
    return String(s == null ? '' : s)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

// Gera um slug a partir de um texto. `fallback` é usado quando o resultado fica
// vazio (texto sem letras/números) — preserva o default de cada página.
export function slugify(s, fallback) {
    fallback = fallback || 'item';
    return String(s || fallback)
        .toLowerCase()
        .normalize('NFD').replace(/[̀-ͯ]/g, '')
        .replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') || fallback;
}

// Formata um número como moeda BRL (R$).
export function formatMoney(v) {
    return Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// Formata uma data ISO (YYYY-MM-DD…) como DD/MM/AAAA.
export function formatDate(iso) {
    if (!iso) return '';
    var p = String(iso).slice(0, 10).split('-');
    return p.length === 3 ? p[2] + '/' + p[1] + '/' + p[0] : iso;
}
