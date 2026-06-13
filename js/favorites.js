var FAVORITES_KEY = 'abrigo-favorites';

// Coração SVG (contorno em currentColor; preenchido via CSS quando favoritado)
var HEART_SVG =
    '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
    '<path d="M22 8.86222C22 10.4087 21.4062 11.8941 20.3458 12.9929C17.9049 15.523 15.5374 18.1613 13.0053 20.5997C12.4249 21.1505 11.5042 21.1304 10.9488 20.5547L3.65376 12.9929C1.44875 10.7072 1.44875 7.01723 3.65376 4.73157C5.88044 2.42345 9.50794 2.42345 11.7346 4.73157L11.9998 5.00642L12.2648 4.73173C13.3324 3.6245 14.7864 3 16.3053 3C17.8242 3 19.2781 3.62444 20.3458 4.73157C21.4063 5.83045 22 7.31577 22 8.86222Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"></path></svg>';

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
        btn.innerHTML = HEART_SVG;

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
        '.fav-btn.fav-active { color: #F15A55; }',
        '.fav-btn svg { width: 1em; height: 1em; display: block; }',
        '.fav-btn.fav-active svg { fill: currentColor; }'
    ].join('\n');
    document.head.appendChild(style);
})();
