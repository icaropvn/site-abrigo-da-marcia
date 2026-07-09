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

    // Acompanha o tema do sistema ao vivo: quando o SO muda de claro/escuro, o
    // site segue e descarta qualquer escolha manual salva (assim o reload também
    // passa a seguir o sistema). O toggle manual continua valendo, mas só até a
    // próxima mudança do SO.
    var media = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
    if (media) {
        var onSystemChange = function(e) {
            localStorage.removeItem('tema');   // volta a seguir o sistema
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
