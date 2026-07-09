// Controller da tela Admin · Segurança (2FA/TOTP) — módulo ES. Portado da IIFE
// embutida em pages/admin/seguranca.html sem mudar o comportamento. Usa o client
// de core/supabase.js e o guard de core/auth.js (aqui com aal2:false, pois é a
// própria página de cadastro do 2º fator).
import { sb } from '../core/supabase.js';
import { requireAdminSession } from '../core/auth.js';

let enrollFactorId = null;   // fator em processo de cadastro

function show(id) {
    ['mfa-loading', 'mfa-active', 'mfa-inactive', 'mfa-enroll'].forEach(function(s) {
        document.getElementById(s).style.display = (s === id) ? '' : 'none';
    });
}
function alertMsg(msg, type) {
    const el = document.getElementById('mfa-alert');
    el.textContent = msg;
    el.className = 'alert alert-' + (type || 'error') + (msg ? ' show' : '');
}

async function init() {
    // requireAdminSession (core/auth.js): valida sessão e preenche #admin-email.
    // aal2:false — esta é a própria página de cadastro do 2FA (não exige o 2º fator).
    if (!await requireAdminSession({ aal2: false })) return;
    await refreshState();
}

// Mostra o estado atual: ativo (há fator verificado) ou inativo
async function refreshState() {
    const { data, error } = await sb.auth.mfa.listFactors();
    if (error) { show('mfa-inactive'); return; }
    const verified = (data.totp || []).filter(function(f) { return f.status === 'verified'; });
    show(verified.length ? 'mfa-active' : 'mfa-inactive');
}

document.getElementById('logout-btn').addEventListener('click', async function() {
    await sb.auth.signOut();
    window.location.href = 'login.html';
});

// ── Ativar: cria o fator e mostra o QR ──────────────────
document.getElementById('enable-btn').addEventListener('click', async function() {
    alertMsg('');
    // limpa fatores não verificados pendentes (tentativas anteriores)
    const list = await sb.auth.mfa.listFactors();
    const pending = ((list.data && list.data.all) || []).filter(function(f) { return f.status === 'unverified'; });
    for (const f of pending) { await sb.auth.mfa.unenroll({ factorId: f.id }); }

    // issuer define o rótulo mostrado no app autenticador (senão usa o Site URL do Supabase, que por padrão é localhost:3000)
    const { data, error } = await sb.auth.mfa.enroll({ factorType: 'totp', friendlyName: 'Autenticador do admin', issuer: 'Abrigo da Márcia' });
    if (error) { alertMsg('Não foi possível iniciar o cadastro: ' + error.message); return; }

    enrollFactorId = data.id;
    const qrBox = document.getElementById('qr-box');
    qrBox.innerHTML = '';
    const qr = data.totp.qr_code;
    if (qr && qr.indexOf('<svg') !== -1) {
        qrBox.innerHTML = qr;                       // SVG inline
    } else {
        const img = new Image();
        img.alt = 'QR Code do 2FA';
        img.src = qr;                               // data URL
        img.style.display = 'block';
        qrBox.appendChild(img);
    }
    document.getElementById('mfa-secret').textContent = data.totp.secret;
    document.getElementById('verify-code').value = '';
    show('mfa-enroll');
    document.getElementById('verify-code').focus();
});

// ── Confirmar cadastro: verifica o código ───────────────
document.getElementById('verify-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    const btn = document.getElementById('verify-btn');
    btn.disabled = true; btn.textContent = 'Confirmando…';
    alertMsg('');

    const code = document.getElementById('verify-code').value.trim();
    const { error } = await sb.auth.mfa.challengeAndVerify({ factorId: enrollFactorId, code: code });

    btn.disabled = false; btn.textContent = 'Confirmar';
    if (error) { alertMsg('Código inválido. Confira o app e tente novamente.'); return; }

    enrollFactorId = null;
    alertMsg('2FA ativado com sucesso!', 'success');
    await refreshState();
});

document.getElementById('enroll-cancel').addEventListener('click', async function() {
    if (enrollFactorId) { await sb.auth.mfa.unenroll({ factorId: enrollFactorId }); enrollFactorId = null; }
    alertMsg('');
    await refreshState();
});

// ── Desativar 2FA ───────────────────────────────────────
document.getElementById('disable-btn').addEventListener('click', function() {
    document.getElementById('confirm-overlay').classList.add('open');
});
document.getElementById('confirm-cancel').addEventListener('click', function() {
    document.getElementById('confirm-overlay').classList.remove('open');
});
document.getElementById('confirm-ok').addEventListener('click', async function() {
    document.getElementById('confirm-overlay').classList.remove('open');
    const { data } = await sb.auth.mfa.listFactors();
    for (const f of (data.totp || [])) { await sb.auth.mfa.unenroll({ factorId: f.id }); }
    alertMsg('2FA desativado.', 'success');
    await refreshState();
});

init();
