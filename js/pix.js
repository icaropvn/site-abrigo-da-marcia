// PIX "copia e cola" (BR Code / EMV) — gerado no cliente, sem servidor.
// Padrão aberto do Banco Central: o payload estático precisa apenas da
// chave PIX + nome do recebedor (máx. 25) + cidade (máx. 15).
// O QR Code é o mesmo payload renderizado como imagem (lib qrcodejs via CDN).

(function() {
    // CRC16-CCITT-FALSE (poly 0x1021, init 0xFFFF) — checksum exigido no campo 63
    function crc16(payload) {
        var crc = 0xFFFF;
        for (var i = 0; i < payload.length; i++) {
            crc ^= payload.charCodeAt(i) << 8;
            for (var j = 0; j < 8; j++) {
                crc = (crc & 0x8000) ? ((crc << 1) ^ 0x1021) : (crc << 1);
                crc &= 0xFFFF;
            }
        }
        return crc.toString(16).toUpperCase().padStart(4, '0');
    }

    // Campo EMV: ID (2 dígitos) + tamanho (2 dígitos) + valor
    function emv(id, value) {
        var len = String(value.length).padStart(2, '0');
        return id + len + value;
    }

    // Nome/cidade: BR Code aceita só ASCII — remove acentos e caracteres especiais
    function sanitize(text, maxLength) {
        return String(text || '')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^A-Za-z0-9 .\-]/g, '')
            .trim()
            .toUpperCase()
            .slice(0, maxLength);
    }

    /**
     * Monta o payload PIX copia-e-cola.
     * @param {Object} opts
     * @param {string} opts.key    Chave PIX (e-mail, telefone, CPF/CNPJ ou aleatória)
     * @param {string} opts.name   Nome do recebedor
     * @param {string} opts.city   Cidade do recebedor
     * @param {number} [opts.amount] Valor (opcional — sem valor, o pagador digita)
     * @returns {string|null} payload pronto, ou null se faltar dado obrigatório
     */
    function buildPayload(opts) {
        var key  = String(opts.key || '').trim();
        var name = sanitize(opts.name, 25);
        var city = sanitize(opts.city, 15);
        if (!key || !name || !city) return null;

        var account = emv('00', 'br.gov.bcb.pix') + emv('01', key);
        var payload =
            emv('00', '01') +                 // payload format
            emv('26', account) +              // merchant account (PIX)
            emv('52', '0000') +               // categoria (não informada)
            emv('53', '986') +                // moeda: BRL
            (opts.amount > 0 ? emv('54', Number(opts.amount).toFixed(2)) : '') +
            emv('58', 'BR') +
            emv('59', name) +
            emv('60', city) +
            emv('62', emv('05', '***')) +     // txid livre (PIX estático)
            '6304';                           // CRC vem em seguida

        return payload + crc16(payload);
    }

    window.PixBRCode = { buildPayload: buildPayload };
})();
