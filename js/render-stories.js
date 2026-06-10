// Histórias do Abrigo — prévia compacta na home (#stories-preview) e
// grid de cards na página dedicada (#stories-list) com modal de história completa.
// Dados vêm do Supabase (tabela `stories`). Sem libs externas.

(function() {
    function storiesConfigured() {
        return typeof SUPABASE_URL !== 'undefined' &&
               typeof SUPABASE_ANON_KEY !== 'undefined' &&
               SUPABASE_URL      !== 'PREENCHER_URL_DO_PROJETO' &&
               SUPABASE_ANON_KEY !== 'PREENCHER_ANON_KEY';
    }

    async function fetchStories(query) {
        var url = SUPABASE_URL + '/rest/v1/stories?' + query;
        var controller = new AbortController();
        var timeoutId  = setTimeout(function() { controller.abort(); }, 5000);
        var response = await fetch(url, {
            signal: controller.signal,
            headers: {
                'apikey':        SUPABASE_ANON_KEY,
                'Authorization': 'Bearer ' + SUPABASE_ANON_KEY
            }
        });
        clearTimeout(timeoutId);
        if (!response.ok) throw new Error('Supabase retornou ' + response.status);
        return await response.json();
    }

    function firstPhoto(story) {
        return (story.photos && story.photos.length) ? story.photos[0] : null;
    }

    // ── Card compacto (usado na home e na página dedicada) ──────
    // href → card vira link (home). Sem href → card abre o modal (dedicada).
    function buildCompactCard(story, href) {
        var card = document.createElement(href ? 'a' : 'article');
        card.className = 'story-card';
        if (href) {
            card.href = href;
        } else {
            card.tabIndex = 0;
            card.setAttribute('role', 'button');
        }

        var photo = document.createElement('div');
        photo.className = 'story-card-photo';
        var src = firstPhoto(story);
        if (src) {
            var img = document.createElement('img');
            img.src = src;
            img.alt = 'Foto de ' + story.dog_name;
            img.loading = 'lazy';
            photo.appendChild(img);
        } else {
            photo.classList.add('is-empty');
            photo.textContent = '🐶';
        }

        var body = document.createElement('div');
        body.className = 'story-card-body';

        var name = document.createElement('span');
        name.className = 'story-card-name';
        name.textContent = story.dog_name;

        var desc = document.createElement('p');
        desc.className = 'story-card-desc';
        desc.textContent = story.description;

        var btn = document.createElement('span');
        btn.className = 'story-card-button';
        btn.textContent = 'Conheça essa história';

        body.appendChild(name);
        body.appendChild(desc);
        body.appendChild(btn);
        card.appendChild(photo);
        card.appendChild(body);
        return card;
    }

    // ── Prévia da home ──────────────────────────────────────────
    function renderPreview(container, stories) {
        container.innerHTML = '';
        stories.forEach(function(story) {
            container.appendChild(buildCompactCard(story, 'pages/historias.html'));
        });
    }

    // ── Página dedicada: cards que abrem o modal ────────────────
    function renderList(container, stories) {
        container.innerHTML = '';
        if (!stories.length) {
            var empty = document.createElement('p');
            empty.className = 'stories-empty';
            empty.textContent = 'Em breve, histórias dos nossos cães que encontraram um lar.';
            container.appendChild(empty);
            return;
        }
        stories.forEach(function(story, i) {
            var card = buildCompactCard(story, null);
            card.dataset.index = i;
            container.appendChild(card);
        });
    }

    // ── Carrossel de fotos (usado no modal) ─────────────────────
    function buildCarousel(story) {
        var photos = (story.photos || []).filter(Boolean);
        var carousel = document.createElement('div');
        carousel.className = 'story-carousel';

        if (!photos.length) {
            carousel.classList.add('is-empty');
            var ph = document.createElement('div');
            ph.className = 'story-carousel-placeholder';
            ph.textContent = '🐶';
            carousel.appendChild(ph);
            return carousel;
        }

        var track = document.createElement('div');
        track.className = 'story-carousel-track';
        photos.forEach(function(src, i) {
            var slide = document.createElement('div');
            slide.className = 'story-slide';
            var img = document.createElement('img');
            img.src = src;
            img.alt = 'Foto ' + (i + 1) + ' de ' + story.dog_name;
            slide.appendChild(img);
            track.appendChild(slide);
        });
        carousel.appendChild(track);

        if (photos.length > 1) {
            var prev = document.createElement('button');
            prev.type = 'button';
            prev.className = 'story-nav story-nav-prev';
            prev.setAttribute('aria-label', 'Foto anterior');
            prev.innerHTML = '&#8249;';

            var next = document.createElement('button');
            next.type = 'button';
            next.className = 'story-nav story-nav-next';
            next.setAttribute('aria-label', 'Próxima foto');
            next.innerHTML = '&#8250;';

            var dots = document.createElement('div');
            dots.className = 'story-dots';
            photos.forEach(function(_, i) {
                var dot = document.createElement('button');
                dot.type = 'button';
                dot.className = 'story-dot' + (i === 0 ? ' is-active' : '');
                dot.setAttribute('aria-label', 'Ir para foto ' + (i + 1));
                dot.dataset.index = i;
                dots.appendChild(dot);
            });

            var current = 0;
            function go(index) {
                current = (index + photos.length) % photos.length;
                track.style.transform = 'translateX(-' + (current * 100) + '%)';
                dots.querySelectorAll('.story-dot').forEach(function(d, i) {
                    d.classList.toggle('is-active', i === current);
                });
            }
            prev.addEventListener('click', function() { go(current - 1); });
            next.addEventListener('click', function() { go(current + 1); });
            dots.addEventListener('click', function(e) {
                var dot = e.target.closest('.story-dot');
                if (dot) go(parseInt(dot.dataset.index, 10));
            });

            carousel.appendChild(prev);
            carousel.appendChild(next);
            carousel.appendChild(dots);
        }
        return carousel;
    }

    // ── Modal de história completa (página dedicada) ────────────
    function setupModal(stories) {
        var modal = document.getElementById('story-modal');
        if (!modal) return;
        var media = document.getElementById('story-modal-media');
        var name  = document.getElementById('story-modal-name');
        var text  = document.getElementById('story-modal-text');

        function open(story) {
            media.innerHTML = '';
            media.appendChild(buildCarousel(story));
            name.textContent = story.dog_name;
            text.textContent = story.description;
            modal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
        }
        function close() {
            modal.style.display = 'none';
            document.body.style.overflow = '';
            media.innerHTML = '';
        }

        document.getElementById('stories-list').addEventListener('click', function(e) {
            var card = e.target.closest('.story-card');
            if (card && card.dataset.index != null) open(stories[card.dataset.index]);
        });
        document.getElementById('stories-list').addEventListener('keydown', function(e) {
            if (e.key !== 'Enter' && e.key !== ' ') return;
            var card = e.target.closest('.story-card');
            if (card && card.dataset.index != null) { e.preventDefault(); open(stories[card.dataset.index]); }
        });

        document.getElementById('story-modal-close').addEventListener('click', close);
        document.getElementById('story-modal-back').addEventListener('click', close);
        modal.addEventListener('click', function(e) { if (e.target === modal) close(); });
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && modal.style.display === 'flex') close();
        });
    }

    async function init() {
        var preview = document.getElementById('stories-preview');
        var list    = document.getElementById('stories-list');
        if (!preview && !list) return;
        if (!storiesConfigured()) {
            if (preview) preview.closest('#stories-section').style.display = 'none';
            if (list) renderList(list, []);
            return;
        }

        try {
            if (preview) {
                var featured = await fetchStories('featured=eq.true&order=created_at.desc&limit=3');
                if (!featured.length) {
                    featured = await fetchStories('order=created_at.desc&limit=3');
                }
                if (featured.length) {
                    renderPreview(preview, featured);
                } else {
                    preview.closest('#stories-section').style.display = 'none';
                }
            }
            if (list) {
                var all = await fetchStories('order=created_at.desc');
                renderList(list, all);
                setupModal(all);
            }
        } catch (err) {
            if (preview) preview.closest('#stories-section').style.display = 'none';
            if (list) renderList(list, []);
        }
    }

    // Roda já se o DOM estiver pronto; senão aguarda o DOMContentLoaded.
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
