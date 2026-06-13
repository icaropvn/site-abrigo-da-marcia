// Histórias do Abrigo — prévia compacta na home (#stories-preview) e
// grid de cards na página dedicada (#stories-list) com modal de história completa.
// Dados vêm do Supabase (tabela `stories`). Sem libs externas.

(function() {
    // Placeholder de cão sem foto (currentColor acompanha o tema)
    var DOG_PLACEHOLDER_SVG =
        '<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
        '<path fill-rule="evenodd" clip-rule="evenodd" d="M19.9463 1.59905C19.7411 1.27486 19.3244 1.15775 18.9804 1.32762C18.346 1.64091 17.3056 2.37972 16.4755 2.99465C16.0485 3.31089 15.6577 3.60914 15.3739 3.82819L15.3143 3.87417C15.128 3.77341 14.8928 3.65452 14.6218 3.53557C13.9471 3.23941 12.9931 2.91677 12 2.91677C11.0069 2.91677 10.0529 3.23941 9.37823 3.53557C9.1077 3.65432 8.87275 3.773 8.68662 3.87366L8.63018 3.82977C8.3491 3.61133 7.9635 3.31397 7.54606 2.99878C6.73113 2.38346 5.73398 1.65332 5.1806 1.34495C4.8381 1.15409 4.40638 1.25926 4.19003 1.58626C2.61279 3.97014 2.55039 5.87414 3.00077 7.23562C3.21973 7.8975 3.54828 8.39461 3.82405 8.72806C3.84973 8.75912 3.875 8.78881 3.89975 8.81715C3.11813 10.4241 2.25 12.7782 2.25 15.3334C2.25 15.7476 2.58579 16.0834 3 16.0834C4.25484 16.0834 5.25805 16.4548 5.94897 16.827C6.29433 17.0131 6.55888 17.1979 6.7337 17.3331C6.77007 17.3612 6.80247 17.3871 6.83081 17.4103L6.83144 17.4126C6.87212 17.5615 6.93347 17.771 7.01789 18.0212C7.18586 18.5189 7.44942 19.19 7.83068 19.8678C8.57056 21.1831 9.89029 22.7501 12 22.7501C14.1097 22.7501 15.4294 21.1831 16.1693 19.8678C16.5506 19.19 16.8141 18.5189 16.9821 18.0212C17.0665 17.771 17.1279 17.5615 17.1686 17.4126L17.1692 17.4103C17.1975 17.3871 17.2299 17.3612 17.2663 17.3331C17.4411 17.1979 17.7057 17.0131 18.051 16.827C18.7419 16.4548 19.7452 16.0834 21 16.0834C21.4142 16.0834 21.75 15.7476 21.75 15.3334C21.75 12.7788 20.8823 10.4252 20.1008 8.81827C20.1254 8.79035 20.1504 8.76112 20.1759 8.73056C20.4529 8.39853 20.7847 7.90372 21.0121 7.24488C21.4796 5.89083 21.458 3.98802 19.9463 1.59905ZM11 17.25C10.5858 17.25 10.25 17.5858 10.25 18C10.25 18.4142 10.5858 18.75 11 18.75H11.25V19C11.25 19.4142 11.5858 19.75 12 19.75C12.4142 19.75 12.75 19.4142 12.75 19V18.75H13C13.4142 18.75 13.75 18.4142 13.75 18C13.75 17.5858 13.4142 17.25 13 17.25H11ZM7.96967 11.9697C8.26256 11.6768 8.73744 11.6768 9.03033 11.9697L10.5303 13.4697C10.8232 13.7626 10.8232 14.2374 10.5303 14.5303C10.2374 14.8232 9.76256 14.8232 9.46967 14.5303L7.96967 13.0303C7.67678 12.7374 7.67678 12.2626 7.96967 11.9697ZM16.0303 13.0303C16.3232 12.7374 16.3232 12.2626 16.0303 11.9697C15.7374 11.6768 15.2626 11.6768 14.9697 11.9697L13.4697 13.4697C13.1768 13.7626 13.1768 14.2374 13.4697 14.5303C13.7626 14.8232 14.2374 14.8232 14.5303 14.5303L16.0303 13.0303Z" fill="currentColor"></path></svg>';

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
            photo.innerHTML = DOG_PLACEHOLDER_SVG;
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
            ph.innerHTML = DOG_PLACEHOLDER_SVG;
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
