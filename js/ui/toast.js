// Toast (notificação flutuante) — módulo ES. Portado de admin-common.js sem
// mudar o comportamento. Mensagem que aparece no canto e some sozinha; substitui
// o alerta preso no topo do form para erros pontuais. type: 'error' | 'success'
// | 'info'. O CSS (.admin-toasts/.admin-toast) já vive em styles/admin.css.
export function adminToast(msg, type) {
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
