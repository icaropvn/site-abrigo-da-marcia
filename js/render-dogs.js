// Catálogo de cães (módulo ES, Fase D): leitura anon via core/rest.js e carrossel
// compartilhado de carousel.js. initLazyLoad/initFavorites seguem globais clássicos.
import { fetchJson } from './core/rest.js';
import { buildCarousel } from './carousel.js';

function calcAge(birthYear) {
    if (!birthYear) return '—';
    var years = new Date().getFullYear() - birthYear;
    if (years < 1) return 'menos de 1 ano';
    return years === 1 ? '1 ano' : years + ' anos';
}

// Rank numérico do porte para ordenação (pequeno < médio < grande).
function sizeRank(size) {
    if (size === 'Porte pequeno') return 1;
    if (size === 'Porte médio')  return 2;
    if (size === 'Porte grande') return 3;
    return 99;
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

    dogs.forEach(function(dog, i) {
        var card = document.createElement('div');
        card.className = 'catalog-card';
        // data-index permite o modal buscar o objeto completo do cão
        card.dataset.index = dogs.indexOf(dog);
        // Dados para ordenação (catalog-filters.js). data-order = ordem original
        // (vinda do servidor: destaque primeiro) usada na opção "Destaque".
        card.dataset.order = i;
        card.dataset.name = dog.name || '';
        card.dataset.birthYear = dog.birth_year || '';
        card.dataset.sizeRank = sizeRank(dog.size);

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
        birth_year:  dog.birth_year || null,
        size:        dog.size,
        description: dog.description,
        image:       dog.image,
        photos:      photos,
        formUrl:     dog.form_url || dog.formUrl || ''
    };
}

async function fetchFromSupabase() {
    var dogs = await fetchJson('dogs?status=eq.available&order=featured.desc,created_at.desc');
    return dogs.map(normalizeDog);
}

document.addEventListener('DOMContentLoaded', async function() {
    try {
        var dogs = await fetchFromSupabase();
        if (dogs.length > 0) {
            renderDogs(dogs);
            return;
        }
    } catch (_) {}

    // Fallback local: dados estáticos quando o Supabase está indisponível.
    // (O fallback intermediário via backend Express legado foi removido em
    // 2026-06-12 junto com a pasta backend/ — disponível no histórico do git.)
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
