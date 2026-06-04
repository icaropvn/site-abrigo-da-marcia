(function() {
    var html = document.documentElement;

    function getCurrentTheme() {
        return html.getAttribute('data-theme') || 'light';
    }

    function applyTheme(theme) {
        html.setAttribute('data-theme', theme);
        localStorage.setItem('tema', theme);
        updateAriaLabels(theme);
    }

    function updateAriaLabels(theme) {
        var label = theme === 'dark' ? 'Ativar modo claro' : 'Ativar modo escuro';
        document.querySelectorAll('.theme-toggle').forEach(function(btn) {
            btn.setAttribute('aria-label', label);
        });
    }

    document.addEventListener('DOMContentLoaded', function() {
        updateAriaLabels(getCurrentTheme());

        document.querySelectorAll('.theme-toggle').forEach(function(btn) {
            btn.addEventListener('click', function() {
                applyTheme(getCurrentTheme() === 'dark' ? 'light' : 'dark');
            });
        });
    });
})();
