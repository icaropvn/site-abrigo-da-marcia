function safeUrl(url) {
    try {
        var u = new URL(url);
        return (u.protocol === 'https:' || u.protocol === 'http:') ? url : '#';
    } catch (_) { return '#'; }
}

document.addEventListener('DOMContentLoaded', function() {
    var modal      = document.getElementById('dog-detail-modal');
    var modalClose = document.querySelector('.modal-close');
    var catalog    = document.getElementById('catalog');
    var mediaWrap  = document.getElementById('modal-dog-media');

    function openModal(dog) {
        // Carrossel de fotos (buildCarousel definido em carousel.js)
        mediaWrap.innerHTML = '';
        var photos = dog.photos && dog.photos.length ? dog.photos
                   : dog.image ? [dog.image] : [];
        var carousel = buildCarousel(photos, dog.name, {
            containerClass: 'modal-dog-carousel',
            imgFit: 'contain'
        });
        mediaWrap.appendChild(carousel);

        document.getElementById('modal-dog-name').textContent        = dog.name;
        document.getElementById('modal-dog-gender').textContent      = dog.gender;
        document.getElementById('modal-dog-age').textContent         = dog.age;
        document.getElementById('modal-dog-size').textContent        = dog.size;
        document.getElementById('modal-dog-description').textContent = dog.description;
        document.getElementById('modal-dog-button').href             = safeUrl(dog.formUrl);

        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }

    function closeModal() {
        modal.style.display = 'none';
        document.body.style.overflow = '';
        mediaWrap.innerHTML = '';
    }

    catalog.addEventListener('click', function(e) {
        if (e.target.closest('.catalog-card-button')) return;
        if (e.target.closest('.carousel-nav') || e.target.closest('.carousel-dot')) return;

        var card = e.target.closest('.catalog-card');
        if (!card) return;

        var dogs = window._catalogDogs;
        var idx  = parseInt(card.dataset.index, 10);
        if (dogs && dogs[idx]) {
            openModal(dogs[idx]);
        }
    });

    modalClose.addEventListener('click', closeModal);
    modal.addEventListener('click', function(e) {
        if (e.target === modal) closeModal();
    });
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') closeModal();
    });
});
