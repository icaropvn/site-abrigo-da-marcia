// Eventos de Arrecadação — banner na home (#event-banner) e página
// dedicada (#event-area): evento ativo com grade da rifa + reserva via
// RPC create_reservation, e histórico dos últimos eventos encerrados.
// Dados vêm do Supabase (tabelas events/event_totals/raffle_board).
// Eventos de venda (type='venda') mostram só a divulgação — reservas
// online de produtos chegam na fase 6.5.

(function() {
    function eventsConfigured() {
        return typeof SUPABASE_URL !== 'undefined' &&
               typeof SUPABASE_ANON_KEY !== 'undefined' &&
               SUPABASE_URL      !== 'PREENCHER_URL_DO_PROJETO' &&
               SUPABASE_ANON_KEY !== 'PREENCHER_ANON_KEY';
    }

    async function fetchJson(path, options) {
        var url = SUPABASE_URL + '/rest/v1/' + path;
        var controller = new AbortController();
        var timeoutId  = setTimeout(function() { controller.abort(); }, 8000);
        var headers = {
            'apikey':        SUPABASE_ANON_KEY,
            'Authorization': 'Bearer ' + SUPABASE_ANON_KEY
        };
        var init = { signal: controller.signal, headers: headers };
        if (options && options.body) {
            init.method = 'POST';
            headers['Content-Type'] = 'application/json';
            init.body = JSON.stringify(options.body);
        }
        var response = await fetch(url, init);
        clearTimeout(timeoutId);
        var data = null;
        try { data = await response.json(); } catch (e) { /* respostas vazias */ }
        if (!response.ok) {
            var err = new Error((data && data.message) || ('Supabase retornou ' + response.status));
            err.code = data && data.message;
            throw err;
        }
        return data;
    }

    // Mensagens amigáveis para os códigos de erro da RPC
    var ERROR_MESSAGES = {
        'NUMERO_INDISPONIVEL':    'Esse número acabou de ser reservado por outra pessoa. Escolha outro número.',
        'LIMITE_RESERVAS_HORA':   'Você fez várias reservas em pouco tempo. Aguarde um pouco e tente novamente.',
        'LIMITE_RESERVAS_EVENTO': 'Este contato já atingiu o limite de reservas neste evento. Fale com o abrigo.',
        'EVENTO_INDISPONIVEL':    'Este evento não está mais recebendo reservas.',
        'NOME_INVALIDO':          'Informe seu nome completo (mínimo 2 letras).',
        'CONTATO_INVALIDO':       'Informe um telefone ou e-mail válido.',
        'NUMERO_INVALIDO':        'Número inválido para esta rifa. Recarregue a página e tente novamente.',
        'RIFA_LIMITE_NUMEROS':    'Você selecionou números demais para uma única reserva. Reduza a quantidade.'
    };

    function friendlyError(err) {
        var code = (err && err.code) || '';
        for (var key in ERROR_MESSAGES) {
            if (code.indexOf(key) !== -1) return ERROR_MESSAGES[key];
        }
        return 'Não foi possível concluir a reserva. Verifique sua conexão e tente novamente.';
    }

    function formatDate(isoDate) {
        if (!isoDate) return '';
        var parts = isoDate.split('-'); // YYYY-MM-DD (sem fuso)
        return parts[2] + '/' + parts[1] + '/' + parts[0];
    }

    function formatMoney(value) {
        return Number(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    }

    function todayISO() {
        var d = new Date();
        return d.getFullYear() + '-' +
               String(d.getMonth() + 1).padStart(2, '0') + '-' +
               String(d.getDate()).padStart(2, '0');
    }

    function isOpenForReservations(ev) {
        var today = todayISO();
        return ev.status === 'ativo' && today >= ev.starts_at && today <= ev.ends_at;
    }

    // ── Banner na home ──────────────────────────────────────────
    function renderHomeBanner(container, ev) {
        container.innerHTML = '';
        var card = document.createElement('a');
        card.className = 'event-banner-card';
        card.href = 'pages/eventos.html';

        if (ev.cover_url) {
            var img = document.createElement('img');
            img.src = ev.cover_url;
            img.alt = 'Imagem do evento ' + ev.name;
            img.loading = 'lazy';
            card.appendChild(img);
        }

        var body = document.createElement('div');
        body.className = 'event-banner-body';

        var tag = document.createElement('span');
        tag.className = 'event-banner-tag';
        tag.textContent = ev.type === 'rifa' ? 'Rifa beneficente' : 'Venda beneficente';

        var name = document.createElement('span');
        name.className = 'event-banner-name';
        name.textContent = ev.name;

        var period = document.createElement('span');
        period.className = 'event-banner-period';
        period.textContent = 'Até ' + formatDate(ev.ends_at);

        var btn = document.createElement('span');
        btn.className = 'event-banner-button';
        btn.textContent = 'Participar';

        body.appendChild(tag);
        body.appendChild(name);
        body.appendChild(period);
        body.appendChild(btn);
        card.appendChild(body);
        container.appendChild(card);
    }

    // ── Cabeçalho do evento (página dedicada) ───────────────────
    function buildEventHeader(ev, totals) {
        var header = document.createElement('section');
        header.className = 'event-header';

        if (ev.cover_url) {
            var cover = document.createElement('img');
            cover.className = 'event-cover';
            cover.src = ev.cover_url;
            cover.alt = 'Imagem do evento ' + ev.name;
            header.appendChild(cover);
        }

        var info = document.createElement('div');
        info.className = 'event-info';

        var name = document.createElement('h2');
        name.textContent = ev.name;
        info.appendChild(name);

        var tags = document.createElement('div');
        tags.className = 'event-tags';
        var tagData = [
            ev.type === 'rifa' ? 'Rifa beneficente' : 'Venda beneficente',
            formatDate(ev.starts_at) + ' a ' + formatDate(ev.ends_at)
        ];
        if (ev.type === 'rifa' && ev.raffle_number_price) {
            tagData.push(formatMoney(ev.raffle_number_price) + ' por número');
        }
        tagData.forEach(function(text) {
            var span = document.createElement('span');
            span.textContent = text;
            tags.appendChild(span);
        });
        info.appendChild(tags);

        if (ev.description) {
            var desc = document.createElement('p');
            desc.className = 'event-description';
            desc.textContent = ev.description;
            info.appendChild(desc);
        }

        if (ev.type === 'rifa' && ev.raffle_prize) {
            var prize = document.createElement('p');
            prize.className = 'event-prize';
            prize.innerHTML = '<strong>Prêmio:</strong> ';
            prize.appendChild(document.createTextNode(ev.raffle_prize));
            info.appendChild(prize);
        }

        // Barra de progresso — rifa: números vendidos (valores arrecadados
        // não são expostos ao público); venda: arrecadação da meta
        if (ev.type === 'rifa' && totals && ev.raffle_total_numbers) {
            var sold    = Number(totals.items_sold || 0);
            var percent = Math.min(100, Math.round((sold / ev.raffle_total_numbers) * 100));
            var text;
            if (sold === 0) {
                text = 'Todos os ' + ev.raffle_total_numbers + ' números estão disponíveis!';
            } else if (sold === 1) {
                text = 'Já foi vendido 1 dos ' + ev.raffle_total_numbers + ' números!';
            } else {
                text = 'Já foram vendidos ' + sold + ' dos ' + ev.raffle_total_numbers + ' números!';
            }
            var goal = document.createElement('div');
            goal.className = 'event-goal';
            goal.innerHTML =
                '<div class="event-goal-bar"><div class="event-goal-fill" style="width: ' + percent + '%"></div></div>' +
                '<span class="event-goal-text">' + text + '</span>';
            info.appendChild(goal);
        } else if (ev.goal_amount && totals) {
            var raised   = Number(totals.amount_reserved || 0);
            var percentG = Math.min(100, Math.round((raised / Number(ev.goal_amount)) * 100));
            var goalEl = document.createElement('div');
            goalEl.className = 'event-goal';
            goalEl.innerHTML =
                '<div class="event-goal-bar"><div class="event-goal-fill" style="width: ' + percentG + '%"></div></div>' +
                '<span class="event-goal-text">' + formatMoney(raised) + ' arrecadados da meta de ' + formatMoney(ev.goal_amount) + '</span>';
            info.appendChild(goalEl);
        }

        header.appendChild(info);

        // Galeria de divulgação (imagens extras)
        if (ev.gallery && ev.gallery.length) {
            var gallery = document.createElement('div');
            gallery.className = 'event-gallery';
            ev.gallery.forEach(function(src, i) {
                var img = document.createElement('img');
                img.src = src;
                img.alt = 'Divulgação ' + (i + 1) + ' do evento ' + ev.name;
                img.loading = 'lazy';
                gallery.appendChild(img);
            });
            header.appendChild(gallery);
        }
        return header;
    }

    // ── Grade da rifa ───────────────────────────────────────────
    function buildRaffleGrid(ev, takenByNumber, clickable) {
        var section = document.createElement('section');
        section.className = 'raffle-section';

        // Banner do número sorteado — só o número (nenhum dado pessoal
        // na página pública; o nome do ganhador é anunciado na transmissão)
        if (ev.raffle_winner_number) {
            var winner = document.createElement('div');
            winner.className = 'raffle-winner';
            winner.textContent = 'Número sorteado: ' + ev.raffle_winner_number + ' — parabéns ao ganhador!';
            section.appendChild(winner);
        }

        var title = document.createElement('h3');
        title.textContent = 'Escolha seus números';
        section.appendChild(title);

        if (clickable) {
            var hint = document.createElement('p');
            hint.className = 'raffle-hint';
            var maxPer = ev.raffle_max_per_reservation || 5;
            hint.textContent = maxPer > 1
                ? 'Toque para selecionar até ' + maxPer + ' números e depois toque em "Reservar".'
                : 'Toque em um número para reservar.';
            section.appendChild(hint);
        }

        var legend = document.createElement('div');
        legend.className = 'raffle-legend';
        legend.innerHTML =
            '<span><i class="raffle-dot raffle-dot-free"></i> Disponível</span>' +
            '<span><i class="raffle-dot raffle-dot-selected"></i> Selecionado</span>' +
            '<span><i class="raffle-dot raffle-dot-taken"></i> Reservado</span>';
        section.appendChild(legend);

        var grid = document.createElement('div');
        grid.className = 'raffle-grid';
        grid.setAttribute('role', 'group');
        grid.setAttribute('aria-label', 'Números da rifa');

        var fragment = document.createDocumentFragment();
        for (var n = 1; n <= ev.raffle_total_numbers; n++) {
            var cell = document.createElement('button');
            cell.type = 'button';
            cell.className = 'raffle-cell';
            cell.dataset.number = n;
            var taken = takenByNumber[n];
            if (taken) {
                cell.classList.add('is-taken');
                cell.disabled = true;
                // não revela quem reservou — apenas marca como tomado
                cell.innerHTML = '<span class="raffle-cell-number">' + n + '</span>' +
                                 '<span class="raffle-cell-name">Reservado</span>';
                cell.title = 'Número ' + n + ' já reservado';
            } else {
                cell.disabled = !clickable;
                cell.innerHTML = '<span class="raffle-cell-number">' + n + '</span>';
                cell.setAttribute('aria-label', 'Selecionar número ' + n);
                cell.setAttribute('aria-pressed', 'false');
            }
            if (ev.raffle_winner_number === n) cell.classList.add('is-winner');
            fragment.appendChild(cell);
        }
        grid.appendChild(fragment);
        section.appendChild(grid);

        if (!clickable && !ev.raffle_winner_number) {
            var closed = document.createElement('p');
            closed.className = 'raffle-closed';
            closed.textContent = 'Este evento não está recebendo novas reservas.';
            section.appendChild(closed);
        }
        return section;
    }

    // ── Histórico de eventos anteriores ─────────────────────────
    function renderPastEvents(container, events) {
        container.innerHTML = '';
        events.forEach(function(ev) {
            var card = document.createElement('article');
            card.className = 'past-event-card';

            if (ev.cover_url) {
                var img = document.createElement('img');
                img.src = ev.cover_url;
                img.alt = 'Imagem do evento ' + ev.name;
                img.loading = 'lazy';
                card.appendChild(img);
            }

            var body = document.createElement('div');
            body.className = 'past-event-body';

            var name = document.createElement('span');
            name.className = 'past-event-name';
            name.textContent = ev.name;
            body.appendChild(name);

            var period = document.createElement('span');
            period.className = 'past-event-period';
            period.textContent = formatDate(ev.starts_at) + ' a ' + formatDate(ev.ends_at);
            body.appendChild(period);

            // Resultado: summary (pós-limpeza LGPD) ou número sorteado
            var resultParts = [];
            if (ev.type === 'rifa' && ev.raffle_winner_number) {
                resultParts.push('Número sorteado: ' + ev.raffle_winner_number);
            }
            if (ev.summary && ev.summary.total_raised > 0) {
                resultParts.push(formatMoney(ev.summary.total_raised) + ' arrecadados');
            }
            if (resultParts.length) {
                var result = document.createElement('span');
                result.className = 'past-event-result';
                result.textContent = resultParts.join(' · ');
                body.appendChild(result);
            }
            card.appendChild(body);
            container.appendChild(card);
        });
    }

    // ── Modal de reserva (rifa) ─────────────────────────────────
    var modalState = { event: null, numbers: [] };

    function describeNumbers(numbers) {
        if (numbers.length === 1) return 'o número ' + numbers[0];
        return 'os números ' + numbers.join(', ');
    }

    function openReserveModal(ev, numbers) {
        modalState.event   = ev;
        modalState.numbers = numbers.slice();

        var total = numbers.length * Number(ev.raffle_number_price || 0);
        document.getElementById('reserve-title').textContent =
            numbers.length === 1 ? 'Reservar o número ' + numbers[0]
                                  : 'Reservar ' + numbers.length + ' números';
        document.getElementById('reserve-subtitle').textContent =
            ev.name + ' — ' + describeNumbers(numbers) + '. Total: ' + formatMoney(total) + '.';

        document.getElementById('reserve-form-step').style.display = '';
        document.getElementById('reserve-success-step').style.display = 'none';
        document.getElementById('reserve-error').style.display = 'none';
        document.getElementById('reserve-form').reset();
        document.getElementById('reserve-submit').disabled = false;
        document.getElementById('reserve-submit').textContent = 'Confirmar reserva';

        var modal = document.getElementById('reserve-modal');
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        document.getElementById('reserve-name').focus();
    }

    function closeReserveModal() {
        var modal = document.getElementById('reserve-modal');
        if (!modal) return;
        modal.style.display = 'none';
        document.body.style.overflow = '';
        document.getElementById('pix-qrcode').innerHTML = '';
    }

    function showReserveError(message) {
        var el = document.getElementById('reserve-error');
        el.textContent = message;
        el.style.display = '';
    }

    // Confirmação + PIX (QR Code e copia-e-cola)
    function showSuccess(ev, numbers, total) {
        document.getElementById('reserve-form-step').style.display = 'none';
        document.getElementById('reserve-success-step').style.display = '';
        var label = numbers.length === 1
            ? 'Número ' + numbers[0] + ' reservado'
            : 'Números ' + numbers.join(', ') + ' reservados';
        document.getElementById('reserve-success-summary').textContent =
            label + ' em "' + ev.name + '". Valor: ' + formatMoney(total) + '.';

        // pix_payload pronto (ex: PagSeguro) tem prioridade;
        // senão o site monta o BR Code com chave + nome + cidade
        var payload = ev.pix_payload && ev.pix_payload.trim() ? ev.pix_payload.trim() : null;
        if (payload && window.PixBRCode && PixBRCode.setAmount) {
            // injeta o valor da reserva para o app do banco pré-preencher
            payload = PixBRCode.setAmount(payload, Number(total));
        }
        if (!payload && window.PixBRCode) {
            payload = PixBRCode.buildPayload({
                key:    ev.pix_key,
                name:   ev.pix_merchant_name,
                city:   ev.pix_merchant_city,
                amount: Number(total)
            });
        }

        var pixBox = document.getElementById('pix-box');
        var qrEl   = document.getElementById('pix-qrcode');
        qrEl.innerHTML = '';
        if (payload) {
            pixBox.style.display = '';
            if (typeof QRCode !== 'undefined') {
                new QRCode(qrEl, { text: payload, width: 220, height: 220, correctLevel: QRCode.CorrectLevel.M });
            }
            var copyBtn = document.getElementById('pix-copy');
            copyBtn.style.display = '';
            copyBtn.onclick = function() {
                navigator.clipboard.writeText(payload).then(function() {
                    copyBtn.textContent = 'Código copiado!';
                    setTimeout(function() { copyBtn.textContent = 'Copiar código PIX'; }, 2500);
                }, function() {
                    // Fallback: exibe o código para cópia manual
                    window.prompt('Copie o código PIX:', payload);
                });
            };
        } else {
            pixBox.style.display = 'none';
        }

        var instructions = document.getElementById('pix-instructions');
        instructions.textContent = ev.payment_instructions || '';
        instructions.style.display = ev.payment_instructions ? '' : 'none';
    }

    // ── Contato: detecta e-mail × telefone e formata em tempo real ──
    // Tem letra ou @ → e-mail; só dígitos/sinais → telefone.
    function isEmail(v)      { return /[a-zA-Z@]/.test(v); }
    function isValidEmail(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); }

    // Máscara de telefone brasileiro: aceita +55 opcional, DDD e corpo
    // 8 (fixo, 4-4) ou 9 dígitos (celular, 5-4). Sem separador "preso":
    // os parênteses/traço só entram quando há dígito depois.
    function maskPhoneBR(value) {
        var hasCountry = /^\s*\+/.test(value);
        var d = value.replace(/\D/g, '');
        var cc = '';
        if (hasCountry) { cc = d.slice(0, 2); d = d.slice(2); }
        d = d.slice(0, 11);                       // DDD (2) + até 9 dígitos
        var out = hasCountry ? '+' + cc : '';
        if (!d) return out;
        if (d.length <= 2) {
            out += (hasCountry ? ' ' : '') + '(' + d;
        } else {
            var ddd  = d.slice(0, 2);
            var body = d.slice(2);
            out += (hasCountry ? ' ' : '') + '(' + ddd + ') ';
            out += body.length <= 4
                ? body
                : body.slice(0, body.length - 4) + '-' + body.slice(body.length - 4);
        }
        return out;
    }

    function phoneDigitCount(v) {
        var d = v.replace(/\D/g, '');
        if (/^\s*\+/.test(v)) d = d.slice(2);     // desconta o código do país
        return d.length;
    }

    function setupContactField() {
        var input = document.getElementById('reserve-contact');
        if (!input) return;

        // Formata em tempo real, mas sem mensagens de "válido": a verificação
        // do e-mail só é mostrada ao enviar (deixa a digitação mais limpa).
        input.addEventListener('input', function() {
            if (!this.value.trim()) { this.removeAttribute('inputmode'); return; }

            if (isEmail(this.value)) {
                // virou e-mail: remove resíduos da máscara de telefone
                // (parênteses e espaços) caso tenha começado com dígitos,
                // ex.: "(12) 3eusou…" → "123eusou…"
                var cleaned = this.value.replace(/[()\s]/g, '');
                if (cleaned !== this.value) this.value = cleaned;
                this.setAttribute('inputmode', 'email');
            } else {
                // telefone: aplica a máscara brasileira enquanto digita
                this.setAttribute('inputmode', 'tel');
                this.value = maskPhoneBR(this.value);
            }
        });
    }

    function setupReserveModal(reloadGrid, clearSelection) {
        var modal = document.getElementById('reserve-modal');
        if (!modal) return;
        setupContactField();

        document.getElementById('reserve-modal-close').addEventListener('click', closeReserveModal);
        document.getElementById('reserve-done').addEventListener('click', closeReserveModal);
        modal.addEventListener('click', function(e) { if (e.target === modal) closeReserveModal(); });
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && modal.style.display === 'flex') closeReserveModal();
        });

        document.getElementById('reserve-form').addEventListener('submit', async function(e) {
            e.preventDefault();
            var name    = document.getElementById('reserve-name').value.trim();
            var contact = document.getElementById('reserve-contact').value.trim();
            var website = document.getElementById('reserve-website').value;

            if (name.length < 2) { showReserveError(ERROR_MESSAGES.NOME_INVALIDO); return; }
            if (isEmail(contact)) {
                if (!isValidEmail(contact)) { showReserveError('Confira o e-mail informado (ex.: nome@email.com).'); return; }
            } else if (phoneDigitCount(contact) < 10) {
                showReserveError('Informe um telefone com DDD (ex.: (11) 98765-4321).'); return;
            }

            var submitBtn = document.getElementById('reserve-submit');
            submitBtn.disabled = true;
            submitBtn.textContent = 'Reservando…';
            document.getElementById('reserve-error').style.display = 'none';

            try {
                var items = modalState.numbers.map(function(n) { return { raffle_number: n }; });
                var result = await fetchJson('rpc/create_reservation', {
                    body: {
                        p_event_id: modalState.event.id,
                        p_name:     name,
                        p_contact:  contact,
                        p_items:    items,
                        p_website:  website
                    }
                });
                showSuccess(modalState.event, modalState.numbers, result.total);
                if (clearSelection) clearSelection();
                if (reloadGrid) reloadGrid();
            } catch (err) {
                showReserveError(friendlyError(err));
                submitBtn.disabled = false;
                submitBtn.textContent = 'Confirmar reserva';
                // Conflito de número: atualiza a grade para refletir a realidade
                if (err.code && err.code.indexOf('NUMERO_INDISPONIVEL') !== -1 && reloadGrid) reloadGrid();
            }
        });
    }

    // ── Página dedicada ─────────────────────────────────────────
    async function renderEventPage(area, ev) {
        area.innerHTML = '';

        var totals = null;
        try {
            var totalsRows = await fetchJson('event_totals?event_id=eq.' + ev.id);
            totals = totalsRows && totalsRows[0];
        } catch (e) { /* totais são opcionais */ }

        area.appendChild(buildEventHeader(ev, totals));

        if (ev.type === 'rifa') {
            var gridContainer = document.createElement('div');
            area.appendChild(gridContainer);

            // Barra de ação fixa (mobile-first): aparece ao selecionar números
            var actionBar = document.createElement('div');
            actionBar.className = 'raffle-actionbar';
            actionBar.style.display = 'none';
            area.appendChild(actionBar);

            var maxPer    = ev.raffle_max_per_reservation || 5;
            var openForRes = isOpenForReservations(ev);
            var selected  = [];   // números escolhidos, na ordem de clique

            // Reflete a seleção e o limite nas células já renderizadas
            function updateCells() {
                var atMax = selected.length >= maxPer;
                var cells = gridContainer.querySelectorAll('.raffle-cell');
                cells.forEach(function(cell) {
                    if (cell.classList.contains('is-taken') || cell.disabled) return;
                    var num   = parseInt(cell.dataset.number, 10);
                    var isSel = selected.indexOf(num) !== -1;
                    cell.classList.toggle('is-selected', isSel);
                    cell.classList.toggle('is-limited', atMax && !isSel);
                    cell.setAttribute('aria-pressed', isSel ? 'true' : 'false');
                });
            }

            function renderActionBar() {
                document.body.classList.toggle('has-raffle-bar', selected.length > 0);
                if (!selected.length) { actionBar.style.display = 'none'; actionBar.innerHTML = ''; return; }
                var nums  = selected.slice().sort(function(a, b) { return a - b; });
                var count = nums.length;
                var total = count * Number(ev.raffle_number_price || 0);
                actionBar.style.display = '';
                actionBar.innerHTML =
                    '<div class="raffle-actionbar-info">' +
                        '<strong>' + count + (count > 1 ? ' números selecionados' : ' número selecionado') + '</strong>' +
                        '<span class="raffle-actionbar-nums">' + nums.join(', ') + '</span>' +
                        '<span class="raffle-actionbar-total">' + formatMoney(total) + '</span>' +
                        (count >= maxPer ? '<span class="raffle-actionbar-limit">Limite de ' + maxPer + ' por reserva atingido</span>' : '') +
                    '</div>' +
                    '<div class="raffle-actionbar-buttons">' +
                        '<button type="button" class="raffle-clear" id="raffle-clear">Limpar</button>' +
                        '<button type="button" class="raffle-reserve" id="raffle-reserve">Reservar</button>' +
                    '</div>';
            }

            function refreshSelection() { updateCells(); renderActionBar(); }

            function toggleSelect(num) {
                var idx = selected.indexOf(num);
                if (idx !== -1) {
                    selected.splice(idx, 1);
                } else if (selected.length < maxPer) {
                    selected.push(num);
                } else {
                    return; // no limite: ignora novas seleções (células ficam esmaecidas)
                }
                refreshSelection();
            }

            async function loadGrid() {
                var taken = {};
                try {
                    var board = await fetchJson('raffle_board?event_id=eq.' + ev.id);
                    board.forEach(function(entry) { taken[entry.raffle_number] = entry; });
                } catch (e) { /* grade sem nomes é melhor que nada */ }
                gridContainer.innerHTML = '';
                gridContainer.appendChild(buildRaffleGrid(ev, taken, openForRes));
                // remove da seleção números que outra pessoa tomou nesse meio tempo
                selected = selected.filter(function(n) { return !taken[n]; });
                refreshSelection();
            }

            function clearSelection() { selected = []; refreshSelection(); }

            gridContainer.addEventListener('click', function(e) {
                var cell = e.target.closest('.raffle-cell');
                if (!cell || cell.disabled || cell.classList.contains('is-taken') || !openForRes) return;
                toggleSelect(parseInt(cell.dataset.number, 10));
            });

            actionBar.addEventListener('click', function(e) {
                if (e.target.closest('#raffle-reserve')) {
                    if (selected.length) openReserveModal(ev, selected.slice().sort(function(a, b) { return a - b; }));
                } else if (e.target.closest('#raffle-clear')) {
                    clearSelection();
                }
            });

            setupReserveModal(loadGrid, clearSelection);
            await loadGrid();
        } else {
            // Venda de produtos: reservas online chegam na fase 6.5
            var note = document.createElement('p');
            note.className = 'event-sale-note';
            note.textContent = 'Para fazer seu pedido neste evento, entre em contato com o abrigo pelo e-mail ou redes sociais.';
            area.appendChild(note);
        }
    }

    function renderEmpty(area) {
        area.innerHTML = '';
        var empty = document.createElement('p');
        empty.className = 'events-empty';
        empty.textContent = 'Nenhum evento ativo no momento. Acompanhe nossas redes sociais para saber das próximas campanhas!';
        area.appendChild(empty);
    }

    async function init() {
        var banner = document.getElementById('event-banner');
        var area   = document.getElementById('event-area');
        if (!banner && !area) return;

        if (!eventsConfigured()) {
            if (banner) banner.closest('#events-section').style.display = 'none';
            if (area) renderEmpty(area);
            return;
        }

        try {
            var active = await fetchJson('events?status=eq.ativo&limit=1');
            var ev = active && active[0];

            if (banner) {
                var section = banner.closest('#events-section');
                if (ev) {
                    section.style.display = '';
                    renderHomeBanner(banner, ev);
                } else {
                    section.style.display = 'none';
                }
            }

            if (area) {
                if (ev) {
                    await renderEventPage(area, ev);
                } else {
                    renderEmpty(area);
                }

                // Histórico: últimos eventos encerrados/arquivados
                try {
                    var past = await fetchJson('events?status=in.(encerrado,arquivado)&order=ends_at.desc&limit=3');
                    if (past && past.length) {
                        document.getElementById('past-events').style.display = '';
                        renderPastEvents(document.getElementById('past-events-list'), past);
                    }
                } catch (e) { /* histórico é opcional */ }
            }
        } catch (err) {
            if (banner) banner.closest('#events-section').style.display = 'none';
            if (area) renderEmpty(area);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
