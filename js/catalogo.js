document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('.catalog-card').forEach(function(el) {
        const bg = el.getAttribute('data-img')
        const imageContainer = el.querySelector('.catalog-card-img')
        
        if(bg && imageContainer) {
            imageContainer.style.backgroundImage = `url(${bg})`
        }
    })
})