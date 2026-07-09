// Controller da tela de login do admin (módulo ES). Portado do script embutido
// em pages/admin/login.html sem mudar o comportamento. Fluxo: senha → (se houver
// 2FA) código TOTP → index.html. Usa o client de core/supabase.js.
import { sb } from '../core/supabase.js';

const alertEl   = document.getElementById('alert');
const submitBtn = document.getElementById('submit-btn');
const mfaBtn    = document.getElementById('mfa-btn');
let mfaFactorId = null;

function showError(msg) {
    alertEl.textContent = msg;
    alertEl.className = 'alert alert-error show';
}
function clearError() { alertEl.className = 'alert'; }

function showMfaStep() {
    document.getElementById('password-step').style.display = 'none';
    document.getElementById('mfa-step').style.display = '';
    document.getElementById('mfa-code').focus();
}

// Decide o destino conforme o nível de garantia (AAL) da sessão.
// aal1 + fator cadastrado → precisa do código; senão → entra.
async function routeAfterAuth() {
    const { data, error } = await sb.auth.mfa.getAuthenticatorAssuranceLevel();
    if (error) { window.location.href = 'index.html'; return; }
    if (data && data.nextLevel === 'aal2' && data.currentLevel !== 'aal2') {
        const factors = await sb.auth.mfa.listFactors();
        const totp = factors.data && factors.data.totp && factors.data.totp[0];
        mfaFactorId = totp ? totp.id : null;
        if (!mfaFactorId) { window.location.href = 'index.html'; return; }
        showMfaStep();
    } else {
        window.location.href = 'index.html';
    }
}

// Se já há sessão, decide direto (pode cair na etapa do código)
sb.auth.getSession().then(function({ data }) {
    if (data.session) routeAfterAuth();
});

// Passo 1: senha
document.getElementById('login-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    submitBtn.disabled = true;
    submitBtn.textContent = 'Entrando…';
    clearError();

    const email    = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const { error } = await sb.auth.signInWithPassword({ email, password });

    submitBtn.disabled = false;
    submitBtn.textContent = 'Entrar';
    if (error) { showError('E-mail ou senha inválidos.'); return; }
    await routeAfterAuth();
});

// Passo 2: código do 2FA
document.getElementById('mfa-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    mfaBtn.disabled = true;
    mfaBtn.textContent = 'Verificando…';
    clearError();

    const code = document.getElementById('mfa-code').value.trim();
    const { error } = await sb.auth.mfa.challengeAndVerify({ factorId: mfaFactorId, code: code });

    mfaBtn.disabled = false;
    mfaBtn.textContent = 'Verificar';
    if (error) { showError('Código inválido. Tente novamente.'); return; }
    window.location.href = 'index.html';
});

// Cancelar a etapa do 2FA volta ao login limpo
document.getElementById('mfa-cancel').addEventListener('click', async function() {
    await sb.auth.signOut();
    mfaFactorId = null;
    clearError();
    document.getElementById('mfa-step').style.display = 'none';
    document.getElementById('password-step').style.display = '';
    document.getElementById('login-form').reset();
});
