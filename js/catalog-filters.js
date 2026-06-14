document.addEventListener('DOMContentLoaded', function() {
    const genderFilter = document.getElementById('filter-gender');
    const sizeFilter = document.getElementById('filter-size');
    const sortFilter = document.getElementById('filter-sort');
    const resetBtn = document.getElementById('filter-reset');
    const resultsContainer = document.getElementById('filter-results');
    const resultsText = document.getElementById('filter-results-text');

    function applyFilters() {
        const gender = genderFilter.value;
        const size = sizeFilter.value;
        const cards = document.querySelectorAll('.catalog-card');
        let visibleCount = 0;

        cards.forEach(function(card) {
            const tags = card.querySelectorAll('.catalog-card-tags span');
            const cardGender = tags[0] ? tags[0].textContent.trim() : '';
            const cardSize = tags[2] ? tags[2].textContent.trim() : '';

            const matchGender = !gender || cardGender === gender;
            const matchSize = !size || cardSize === size;

            if (matchGender && matchSize) {
                card.style.display = '';
                visibleCount++;
            } else {
                card.style.display = 'none';
            }
        });

        if (gender || size) {
            const noun = visibleCount === 1 ? 'cão encontrado' : 'cães encontrados';
            resultsText.textContent = visibleCount + ' ' + noun;
            resultsContainer.style.display = 'block';
        } else {
            resultsContainer.style.display = 'none';
        }
    }

    // ── Ordenação ───────────────────────────────────────────
    // Lê os data-attributes definidos em render-dogs.js e reordena os nós no DOM.
    function order(card) { return parseInt(card.dataset.order, 10) || 0; }

    function birth(card) {
        const v = parseInt(card.dataset.birthYear, 10);
        return isNaN(v) ? null : v;
    }

    // Idade: cães sem birth_year vão sempre para o fim, em qualquer direção.
    function byBirth(a, b, young) {
        const ba = birth(a), bb = birth(b);
        if (ba === null && bb === null) return order(a) - order(b);
        if (ba === null) return 1;
        if (bb === null) return -1;
        return young ? bb - ba : ba - bb;   // mais novo = birth_year maior
    }

    const comparators = {
        'default':   function(a, b) { return order(a) - order(b); },
        'name-az':   function(a, b) { return a.dataset.name.localeCompare(b.dataset.name, 'pt', { sensitivity: 'base' }); },
        'name-za':   function(a, b) { return b.dataset.name.localeCompare(a.dataset.name, 'pt', { sensitivity: 'base' }); },
        'size-sm':   function(a, b) { return (a.dataset.sizeRank - b.dataset.sizeRank) || (order(a) - order(b)); },
        'size-lg':   function(a, b) { return (b.dataset.sizeRank - a.dataset.sizeRank) || (order(a) - order(b)); },
        'age-young': function(a, b) { return byBirth(a, b, true); },
        'age-old':   function(a, b) { return byBirth(a, b, false); }
    };

    function applySort() {
        const catalog = document.getElementById('catalog');
        if (!catalog) return;
        const cmp = comparators[sortFilter.value];
        if (!cmp) return;
        const cards = Array.prototype.slice.call(catalog.querySelectorAll('.catalog-card'));
        cards.sort(cmp);
        cards.forEach(function(card) { catalog.appendChild(card); });
    }

    function resetFilters() {
        genderFilter.value = '';
        sizeFilter.value = '';
        sortFilter.value = 'default';
        document.querySelectorAll('.catalog-card').forEach(function(card) {
            card.style.display = '';
        });
        applySort();
        resultsContainer.style.display = 'none';
    }

    genderFilter.addEventListener('change', applyFilters);
    sizeFilter.addEventListener('change', applyFilters);
    sortFilter.addEventListener('change', applySort);
    resetBtn.addEventListener('click', resetFilters);
});
