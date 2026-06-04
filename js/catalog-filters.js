document.addEventListener('DOMContentLoaded', function() {
    const genderFilter = document.getElementById('filter-gender');
    const sizeFilter = document.getElementById('filter-size');
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

    function resetFilters() {
        genderFilter.value = '';
        sizeFilter.value = '';
        document.querySelectorAll('.catalog-card').forEach(function(card) {
            card.style.display = '';
        });
        resultsContainer.style.display = 'none';
    }

    genderFilter.addEventListener('change', applyFilters);
    sizeFilter.addEventListener('change', applyFilters);
    resetBtn.addEventListener('click', resetFilters);
});
