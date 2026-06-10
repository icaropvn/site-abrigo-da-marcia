function calcAge(birthYear) {
    if (!birthYear) return '—';
    var years = new Date().getFullYear() - birthYear;
    if (years < 1) return 'menos de 1 ano';
    return years === 1 ? '1 ano' : years + ' anos';
}

function safeUrl(url) {
    try {
        var u = new URL(url);
        return (u.protocol === 'https:' || u.protocol === 'http:') ? url : '#';
    } catch (_) { return '#'; }
}

function renderDogs(dogs) {
    var catalog = document.getElementById('catalog');
    if (!catalog) return;

    catalog.innerHTML = '';

    dogs.forEach(function(dog) {
        var card = document.createElement('div');
        card.className = 'catalog-card';
        // data-index permite o modal buscar o objeto completo do cão
        card.dataset.index = dogs.indexOf(dog);

        // Carrossel de fotos (buildCarousel definido em carousel.js)
        var photos = dog.photos && dog.photos.length ? dog.photos
                   : dog.image ? [dog.image] : [];
        var carousel = buildCarousel(photos, dog.name, { containerClass: 'catalog-card-img', lazy: true });
        card.appendChild(carousel);

        var contentDiv = document.createElement('div');
        contentDiv.className = 'catalog-card-content';

        var nameEl = document.createElement('span');
        nameEl.className = 'catalog-card-name';
        nameEl.textContent = dog.name;

        var tagsDiv = document.createElement('div');
        tagsDiv.className = 'catalog-card-tags';
        ['gender', 'age', 'size'].forEach(function(field) {
            var tag = document.createElement('span');
            tag.textContent = dog[field];
            tagsDiv.appendChild(tag);
        });

        var descEl = document.createElement('span');
        descEl.className = 'catalog-card-description';
        descEl.textContent = dog.description;

        var adoptLink = document.createElement('a');
        adoptLink.className = 'catalog-card-button';
        adoptLink.href = safeUrl(dog.formUrl);
        adoptLink.target = '_blank';
        adoptLink.rel = 'noopener noreferrer';
        adoptLink.textContent = 'Quero adotar';

        contentDiv.appendChild(nameEl);
        contentDiv.appendChild(tagsDiv);
        contentDiv.appendChild(descEl);
        contentDiv.appendChild(adoptLink);

        card.appendChild(contentDiv);
        catalog.appendChild(card);
    });

    // Lazy-load para imagens do carrossel
    if (typeof initLazyLoad === 'function') initLazyLoad();
    if (typeof initFavorites === 'function') initFavorites();

    // Expõe a lista para o modal
    window._catalogDogs = dogs;
}

function normalizeDog(dog) {
    var photos = (dog.photos || []).filter(Boolean);
    // Garante que image (capa) apareça como primeira foto se não estiver no array
    if (dog.image && !photos.includes(dog.image)) {
        photos = [dog.image].concat(photos);
    }
    return {
        name:        dog.name,
        gender:      dog.gender,
        age:         dog.birth_year ? calcAge(dog.birth_year) : (dog.age || '—'),
        size:        dog.size,
        description: dog.description,
        image:       dog.image,
        photos:      photos,
        formUrl:     dog.form_url || dog.formUrl || ''
    };
}

function isSupabaseConfigured() {
    return typeof SUPABASE_URL !== 'undefined' &&
           typeof SUPABASE_ANON_KEY !== 'undefined' &&
           SUPABASE_URL      !== 'PREENCHER_URL_DO_PROJETO' &&
           SUPABASE_ANON_KEY !== 'PREENCHER_ANON_KEY';
}

async function fetchFromSupabase() {
    var url = SUPABASE_URL +
        '/rest/v1/dogs?status=eq.available&order=featured.desc,created_at.desc';

    var controller = new AbortController();
    var timeoutId  = setTimeout(function() { controller.abort(); }, 5000);

    var response = await fetch(url, {
        signal: controller.signal,
        headers: {
            'apikey':        SUPABASE_ANON_KEY,
            'Authorization': 'Bearer ' + SUPABASE_ANON_KEY
        }
    });
    clearTimeout(timeoutId);

    if (!response.ok) throw new Error('Supabase retornou ' + response.status);

    var dogs = await response.json();
    return dogs.map(normalizeDog);
}

document.addEventListener('DOMContentLoaded', async function() {
    if (isSupabaseConfigured()) {
        try {
            var dogs = await fetchFromSupabase();
            if (dogs.length > 0) {
                renderDogs(dogs);
                return;
            }
        } catch (_) {}
    }

    var apiBase = (typeof window !== 'undefined' && window.ABRIGO_API_URL) || 'http://localhost:5000';
    try {
        var controller = new AbortController();
        var timeoutId  = setTimeout(function() { controller.abort(); }, 3000);
        var apiResponse = await fetch(apiBase + '/api/public/dogs-data', { signal: controller.signal });
        clearTimeout(timeoutId);
        if (apiResponse.ok) {
            var apiData = await apiResponse.json();
            if (apiData.dogs && apiData.dogs.length > 0) {
                renderDogs(apiData.dogs.map(normalizeDog));
                return;
            }
        }
    } catch (_) {}

    try {
        var localResponse = await fetch('../data/dogs.json');
        var localData     = await localResponse.json();
        if (localData.dogs && localData.dogs.length > 0) {
            renderDogs(localData.dogs.map(normalizeDog));
        }
    } catch (err) {
        console.error('Erro ao carregar dados dos cães:', err);
    }
});
