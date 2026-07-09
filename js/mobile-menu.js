document.addEventListener('DOMContentLoaded', function() {
    const menuToggle = document.getElementById('menu-toggle');
    const menuLinks = document.querySelectorAll('.menu a');
    const menuOverlay = document.querySelector('.menu-overlay');
    const menuIcon = document.getElementById('menu-icon-mobile');

    menuLinks.forEach(function(link) {
        link.addEventListener('click', function() {
            menuToggle.checked = false;
        });
    });

    if (menuOverlay) {
        menuOverlay.addEventListener('click', function() {
            menuToggle.checked = false;
        });
    }

    window.addEventListener('resize', function() {
        if (window.innerWidth > 800) {
            menuToggle.checked = false;
        }
    });

    if (menuToggle && menuIcon) {
        menuToggle.addEventListener('change', function() {
            menuIcon.style.transform = this.checked ? 'rotate(90deg)' : 'rotate(0deg)';
        });
    }
});
