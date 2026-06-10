var FAVORITES_KEY = 'abrigo-favorites';

function getFavorites() {
    try { return JSON.parse(localStorage.getItem(FAVORITES_KEY)) || []; }
    catch (_) { return []; }
}

function saveFavorites(list) {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(list));
}

function toggleFavorite(slug, btn) {
    var list  = getFavorites();
    var index = list.indexOf(slug);
    if (index > -1) {
        list.splice(index, 1);
        btn.classList.remove('fav-active');
        btn.setAttribute('aria-label', 'Adicionar aos favoritos');
        btn.setAttribute('title', 'Adicionar aos favoritos');
    } else {
        list.push(slug);
        btn.classList.add('fav-active');
        btn.setAttribute('aria-label', 'Remover dos favoritos');
        btn.setAttribute('title', 'Remover dos favoritos');
    }
    saveFavorites(list);
}

function initFavorites() {
    var favorites = getFavorites();
    var cards = document.querySelectorAll('.catalog-card');

    cards.forEach(function(card) {
        // Evitar duplicar botões em re-renders
        if (card.querySelector('.fav-btn')) return;

        var slug = card.getAttribute('data-slug') ||
                   card.querySelector('.catalog-card-name').textContent.trim().toLowerCase()
                       .normalize('NFD').replace(/[̀-ͯ]/g, '')
                       .replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

        var isFav = favorites.includes(slug);

        var btn = document.createElement('button');
        btn.className = 'fav-btn' + (isFav ? ' fav-active' : '');
        btn.setAttribute('aria-label', isFav ? 'Remover dos favoritos' : 'Adicionar aos favoritos');
        btn.setAttribute('title',      isFav ? 'Remover dos favoritos' : 'Adicionar aos favoritos');
        btn.innerHTML = '♥';

        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            toggleFavorite(slug, btn);
        });

        card.appendChild(btn);
    });
}

// CSS injetado dinamicamente para não exigir alteração em catalogo.css
(function injectFavoritesCSS() {
    if (document.getElementById('fav-styles')) return;
    var style = document.createElement('style');
    style.id = 'fav-styles';
    style.textContent = [
        '.catalog-card { position: relative; }',
        '.fav-btn {',
        '  position: absolute;',
        '  top: 10px;',
        '  right: 10px;',
        '  width: 36px;',
        '  height: 36px;',
        '  border: none;',
        '  background: rgba(255,255,255,.9);',
        '  border-radius: 50%;',
        '  font-size: 18px;',
        '  line-height: 1;',
        '  cursor: pointer;',
        '  color: #ccc;',
        '  transition: color .2s, transform .15s;',
        '  z-index: 5;',
        '  display: flex;',
        '  align-items: center;',
        '  justify-content: center;',
        '}',
        '.fav-btn:hover { transform: scale(1.15); }',
        '.fav-btn.fav-active { color: #F15A55; }'
    ].join('\n');
    document.head.appendChild(style);
})();
