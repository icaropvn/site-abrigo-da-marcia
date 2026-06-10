function initLazyLoad() {
    const imageObserver = new IntersectionObserver(function(entries, observer) {
        entries.forEach(function(entry) {
            if (entry.isIntersecting) {
                const card = entry.target;
                const imageUrl = card.getAttribute('data-img');
                const imageContainer = card.querySelector('.catalog-card-img');

                if (imageUrl && imageContainer) {
                    const img = new Image();
                    img.onload = function() {
                        imageContainer.style.backgroundImage = 'url(' + imageUrl + ')';
                        imageContainer.classList.add('loaded');
                    };
                    img.src = imageUrl;
                    observer.unobserve(card);
                }
            }
        });
    });

    document.querySelectorAll('.catalog-card').forEach(function(card) {
        imageObserver.observe(card);
    });
}

document.addEventListener('DOMContentLoaded', initLazyLoad);
