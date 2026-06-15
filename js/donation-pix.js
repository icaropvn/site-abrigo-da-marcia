// Doação única via PIX na home — abre um modal com QR Code + copia-e-cola
// gerado a partir dos dados PIX do abrigo (os mesmos usados nos eventos), porém
// SEM valor: o doador escolhe quanto doar no app do banco. ES5/IIFE, depende de
// js/pix.js (window.PixBRCode) e da lib qrcodejs (window.QRCode).
(function() {
    'use strict';

    // Dados PIX do abrigo (públicos — vão no QR/copia-e-cola). Mesmos valores
    // usados como padrão nos eventos (PIX_DEFAULTS no admin).
    var PIX = {
        key:  'abrigodamarcia@gmail.com',
        name: 'Marcia Camara Barbosa',
        city: 'Ribeirão Preto'
    };

    var openBtn = document.getElementById('donation-single-btn');
    var modal   = document.getElementById('donation-pix-modal');
    if (!openBtn || !modal) return;

    var closeBtn = document.getElementById('donation-pix-close');
    var qrEl     = document.getElementById('donation-pix-qrcode');
    var copyBtn  = document.getElementById('donation-pix-copy');

    var payload  = null;    // copia-e-cola (gerado uma única vez, sem valor)
    var rendered = false;   // QR já desenhado?

    // Monta o payload e desenha o QR Code na primeira abertura.
    function buildOnce() {
        if (rendered) return;
        rendered = true;
        if (window.PixBRCode && PixBRCode.buildPayload) {
            payload = PixBRCode.buildPayload({ key: PIX.key, name: PIX.name, city: PIX.city });
        }
        if (payload && typeof QRCode !== 'undefined') {
            qrEl.innerHTML = '';
            new QRCode(qrEl, { text: payload, width: 220, height: 220, correctLevel: QRCode.CorrectLevel.M });
        }
        // Sem payload (lib ausente/dado inválido): esconde o botão de copiar.
        if (!payload) copyBtn.style.display = 'none';
    }

    function openModal() {
        buildOnce();
        modal.classList.add('open');
        modal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
    }
    function closeModal() {
        modal.classList.remove('open');
        modal.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
    }

    openBtn.addEventListener('click', openModal);
    closeBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', function(e) { if (e.target === modal) closeModal(); });
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && modal.classList.contains('open')) closeModal();
    });

    copyBtn.addEventListener('click', function() {
        if (!payload) return;
        var done = function() {
            copyBtn.textContent = 'Código copiado!';
            setTimeout(function() { copyBtn.textContent = 'Copiar código PIX'; }, 2500);
        };
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(payload).then(done).catch(function() { window.prompt('Copie o código PIX:', payload); });
        } else {
            window.prompt('Copie o código PIX:', payload);
        }
    });
})();
