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

    // Acompanha o tema do sistema ao vivo, mas só enquanto o usuário não tiver
    // escolhido manualmente (sem 'tema' salvo). Depois de clicar no toggle, a
    // escolha manual passa a prevalecer.
    var media = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
    if (media) {
        var onSystemChange = function(e) {
            if (localStorage.getItem('tema')) return;   // respeita a escolha manual
            html.setAttribute('data-theme', e.matches ? 'dark' : 'light');
            updateAriaLabels(getCurrentTheme());
        };
        if (media.addEventListener) media.addEventListener('change', onSystemChange);
        else if (media.addListener) media.addListener(onSystemChange);   // Safari antigo
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
