// Carrossel compartilhado — usado por cães (catálogo) e histórias.
// Retorna um elemento DOM pronto para inserir no card ou modal.
//
// options.containerClass  — classe do wrapper (default: 'dog-carousel')
// options.imgFit          — 'cover' (default) ou 'contain'
// options.lazy            — true: usa data-src + class 'carousel-lazy' para carregamento tardio

function buildCarousel(photos, name, options) {
    photos = (photos || []).filter(Boolean);
    var opts = options || {};
    var containerClass = opts.containerClass || 'dog-carousel';
    var imgFit         = opts.imgFit || 'cover';
    var lazy           = !!opts.lazy;

    var carousel = document.createElement('div');
    carousel.className = containerClass;

    if (!photos.length) {
        carousel.classList.add('is-empty');
        var ph = document.createElement('div');
        ph.className = 'carousel-placeholder';
        ph.textContent = '🐶';
        carousel.appendChild(ph);
        return carousel;
    }

    var track = document.createElement('div');
    track.className = 'carousel-track';

    photos.forEach(function(src, i) {
        var slide = document.createElement('div');
        slide.className = 'carousel-slide';
        var img = document.createElement('img');
        img.style.objectFit = imgFit;
        img.alt = (name || 'Foto') + ' — foto ' + (i + 1);
        if (lazy) {
            img.dataset.src = src;
            img.className = 'carousel-lazy';
        } else {
            img.src = src;
        }
        slide.appendChild(img);
        track.appendChild(slide);
    });
    carousel.appendChild(track);

    if (photos.length > 1) {
        var prev = document.createElement('button');
        prev.type = 'button';
        prev.className = 'carousel-nav carousel-nav-prev';
        prev.setAttribute('aria-label', 'Foto anterior');
        prev.innerHTML = '&#8249;';

        var next = document.createElement('button');
        next.type = 'button';
        next.className = 'carousel-nav carousel-nav-next';
        next.setAttribute('aria-label', 'Próxima foto');
        next.innerHTML = '&#8250;';

        var dots = document.createElement('div');
        dots.className = 'carousel-dots';
        photos.forEach(function(_, i) {
            var dot = document.createElement('button');
            dot.type = 'button';
            dot.className = 'carousel-dot' + (i === 0 ? ' is-active' : '');
            dot.setAttribute('aria-label', 'Ir para foto ' + (i + 1));
            dot.dataset.index = i;
            dots.appendChild(dot);
        });

        var current = 0;
        function go(index) {
            current = (index + photos.length) % photos.length;
            track.style.transform = 'translateX(-' + (current * 100) + '%)';
            dots.querySelectorAll('.carousel-dot').forEach(function(d, i) {
                d.classList.toggle('is-active', i === current);
            });
        }

        prev.addEventListener('click', function(e) { e.stopPropagation(); go(current - 1); });
        next.addEventListener('click', function(e) { e.stopPropagation(); go(current + 1); });
        dots.addEventListener('click', function(e) {
            e.stopPropagation();
            var dot = e.target.closest('.carousel-dot');
            if (dot) go(parseInt(dot.dataset.index, 10));
        });

        carousel.appendChild(prev);
        carousel.appendChild(next);
        carousel.appendChild(dots);
    }

    return carousel;
}
