function initLazyLoad() {
    var imageObserver = new IntersectionObserver(function(entries, observer) {
        entries.forEach(function(entry) {
            if (!entry.isIntersecting) return;
            var img = entry.target;
            img.src = img.dataset.src;
            img.classList.remove('carousel-lazy');
            observer.unobserve(img);
        });
    }, { rootMargin: '200px' });

    document.querySelectorAll('img.carousel-lazy').forEach(function(img) {
        imageObserver.observe(img);
    });
}

document.addEventListener('DOMContentLoaded', initLazyLoad);
