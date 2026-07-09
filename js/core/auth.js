// Guard de autenticação das páginas admin (módulo ES). Portado de admin-common.js
// sem mudar o comportamento — usa o client de core/supabase.js e passa a ser
// `export`. O fluxo de login/2FA em si (login.html) será migrado como controller
// na Fase C; aqui fica a checagem de sessão reutilizada por todas as telas admin.
import { sb } from './supabase.js';

// Garante uma sessão válida. Por padrão exige o 2º fator (AAL2) quando há 2FA
// cadastrado; passe { aal2: false } para pular essa checagem (página de Segurança,
// onde o 2FA é cadastrado). Em falha, redireciona para login.html e retorna null.
// Em sucesso, preenche #admin-email (se existir) e retorna a sessão.
export async function requireAdminSession(opts) {
    const requireAal2 = !(opts && opts.aal2 === false);
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
