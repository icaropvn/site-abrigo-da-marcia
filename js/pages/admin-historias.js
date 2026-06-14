// Controller da tela Admin · Histórias (módulo ES). Portado da IIFE embutida em
// pages/admin/historias.html sem mudar o comportamento: globais viraram imports
// (core/* + camada de dados data/stories.js). Imports são relativos a ESTE arquivo.
import { sb } from '../core/supabase.js';
import { requireAdminSession } from '../core/auth.js';
import { esc, slugify } from '../core/dom.js';
import { ICON_DOG_SVG, ICON_STAR_SVG } from '../core/icons.js';
import { listStories, insertStory, updateStory, deleteStory, uploadStoryPhoto } from '../data/stories.js';

// Ícones SVG inline (currentColor acompanha o tema claro/escuro).
const ICON_DOG  = ICON_DOG_SVG;
const ICON_STAR = ICON_STAR_SVG;

const MAX_PHOTOS = 5;
let allStories = [];
let pendingDeleteId = null;
let editingId = null;
// Itens de foto: { url: string|null, file: File|null, preview: string }
let photoItems = [];

// ── Auth guard ──────────────────────────────────────────
async function init() {
    // requireAdminSession: valida sessão + AAL2 e preenche #admin-email
    if (!await requireAdminSession()) return;
    await loadStories();
    bindEvents();
}

document.getElementById('logout-btn').addEventListener('click', async function() {
    await sb.auth.signOut();
    window.location.href = 'login.html';
});

// ── Load ────────────────────────────────────────────────
async function loadStories() {
    const { data, error } = await listStories();

    if (error) { showTableError(error.message); return; }

    allStories = data || [];
    renderTable(allStories);
    renderStats(allStories);
}

function renderStats(stories) {
    document.getElementById('stat-total').textContent    = stories.length;
    document.getElementById('stat-featured').textContent  = stories.filter(s => s.featured).length;
}

function renderTable(stories) {
    const tbody = document.getElementById('stories-tbody');
    tbody.innerHTML = '';
    if (!stories.length) {
        const tr = document.createElement('tr');
        tr.className = 'loading-row';
        const td = document.createElement('td');
        td.setAttribute('colspan', '5');
        td.textContent = 'Nenhuma história cadastrada.';
        tr.appendChild(td);
        tbody.appendChild(tr);
        return;
    }
    stories.forEach(function(story) {
        const photos = story.photos || [];
        const cover  = photos.length ? photos[0] : null;
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>
                ${cover ? `<img class="dog-thumb" src="${esc(cover)}" alt="${esc(story.dog_name)}" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">` : ''}
                <div class="dog-no-img" style="display:${cover ? 'none' : 'flex'}">${ICON_DOG}</div>
            </td>
            <td><strong>${esc(story.dog_name)}</strong></td>
            <td>${photos.length}</td>
            <td>${story.featured ? ICON_STAR : '—'}</td>
            <td>
                <div class="actions">
                    <button class="btn btn-edit btn-sm js-edit" data-id="${esc(story.id)}">Editar</button>
                    <button class="btn btn-danger btn-sm js-delete" data-id="${esc(story.id)}" data-name="${esc(story.dog_name)}">Remover</button>
                </div>
            </td>`;
        tbody.appendChild(tr);
    });
}

function showTableError(msg) {
    const tbody = document.getElementById('stories-tbody');
    tbody.innerHTML = '';
    const tr = document.createElement('tr');
    tr.className = 'loading-row';
    const td = document.createElement('td');
    td.setAttribute('colspan', '5');
    td.textContent = 'Erro: ' + msg;
    tr.appendChild(td);
    tbody.appendChild(tr);
}

// ── Table action delegation ─────────────────────────────
document.getElementById('stories-tbody').addEventListener('click', function(e) {
    const editBtn   = e.target.closest('.js-edit');
    const deleteBtn = e.target.closest('.js-delete');
    if (editBtn) {
        const story = allStories.find(s => s.id === editBtn.dataset.id);
        if (story) openModal(story);
    } else if (deleteBtn) {
        pendingDeleteId = deleteBtn.dataset.id;
        document.getElementById('confirm-msg').textContent =
            'Remover a história de "' + deleteBtn.dataset.name + '" permanentemente? Esta ação não pode ser desfeita.';
        document.getElementById('confirm-overlay').classList.add('open');
    }
});

// ── Add / Edit modal ────────────────────────────────────
document.getElementById('add-story-btn').addEventListener('click', function() {
    openModal(null);
});

function openModal(story) {
    editingId = story ? story.id : null;
    document.getElementById('modal-title').textContent = story ? 'Editar história' : 'Adicionar história';
    document.getElementById('story-id').value      = story ? story.id : '';
    document.getElementById('f-dog-name').value     = story ? story.dog_name : '';
    document.getElementById('f-description').value  = story ? story.description : '';
    updateDescCounter();
    document.getElementById('f-featured').checked   = story ? !!story.featured : false;
    document.getElementById('f-photos').value       = '';
    document.getElementById('form-alert').className = 'alert';

    photoItems = (story && story.photos ? story.photos : []).map(function(url) {
        return { url: url, file: null, preview: url };
    });
    renderPhotos();

    document.getElementById('story-modal').classList.add('open');
}

function closeModal() {
    document.getElementById('story-modal').classList.remove('open');
    editingId = null;
    photoItems = [];
}

document.getElementById('modal-close').addEventListener('click', closeModal);
document.getElementById('modal-cancel').addEventListener('click', closeModal);
document.getElementById('story-modal').addEventListener('click', function(e) {
    if (e.target === this) closeModal();
});

// ── Contador de caracteres da história ──────────────────
function updateDescCounter() {
    const el = document.getElementById('f-description');
    document.getElementById('desc-counter').textContent = el.value.length + '/600';
}
document.getElementById('f-description').addEventListener('input', updateDescCounter);

// ── Photos grid ─────────────────────────────────────────
function renderPhotos() {
    const grid = document.getElementById('photos-grid');
    grid.innerHTML = '';
    photoItems.forEach(function(item, i) {
        const cell = document.createElement('div');
        cell.className = 'photo-thumb';
        cell.innerHTML = `
            <img src="${esc(item.preview)}" alt="Foto ${i + 1}">
            <button type="button" class="photo-remove" data-index="${i}" aria-label="Remover foto">&times;</button>`;
        grid.appendChild(cell);
    });
    if (photoItems.length < MAX_PHOTOS) {
        const add = document.createElement('button');
        add.type = 'button';
        add.className = 'photos-add';
        add.id = 'photos-add-btn';
        add.innerHTML = '<span>+</span>Adicionar';
        grid.appendChild(add);
    }
    document.getElementById('photos-counter').textContent = '(' + photoItems.length + '/' + MAX_PHOTOS + ')';
}

document.getElementById('photos-grid').addEventListener('click', function(e) {
    const removeBtn = e.target.closest('.photo-remove');
    const addBtn    = e.target.closest('#photos-add-btn');
    if (removeBtn) {
        photoItems.splice(parseInt(removeBtn.dataset.index, 10), 1);
        renderPhotos();
    } else if (addBtn) {
        document.getElementById('f-photos').click();
    }
});

document.getElementById('f-photos').addEventListener('change', function() {
    const files = Array.from(this.files || []);
    this.value = '';
    files.forEach(function(file) {
        if (photoItems.length >= MAX_PHOTOS) return;
        if (file.size > 5 * 1024 * 1024) {
            showFormAlert('Cada imagem deve ter no máximo 5 MB. "' + file.name + '" foi ignorada.', 'error');
            return;
        }
        const reader = new FileReader();
        reader.onload = function(ev) {
            photoItems.push({ url: null, file: file, preview: ev.target.result });
            renderPhotos();
        };
        reader.readAsDataURL(file);
    });
});

// ── Save ────────────────────────────────────────────────
document.getElementById('story-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    const saveBtn = document.getElementById('save-btn');
    saveBtn.disabled = true;
    saveBtn.textContent = 'Salvando…';

    try {
        const dogName = document.getElementById('f-dog-name').value.trim();
        const slug    = slugify(dogName, 'historia');
        const photos  = [];

        for (const item of photoItems) {
            if (item.file) {
                photos.push(await uploadStoryPhoto(item.file, slug));
            } else if (item.url) {
                photos.push(item.url);
            }
        }

        const payload = {
            dog_name:    dogName,
            description: document.getElementById('f-description').value.trim(),
            featured:    document.getElementById('f-featured').checked,
            photos:      photos
        };

        const { error } = editingId
            ? await updateStory(editingId, payload)
            : await insertStory(payload);
        if (error) throw error;

        closeModal();
        await loadStories();
    } catch (err) {
        showFormAlert(err.message || 'Erro ao salvar.', 'error');
    } finally {
        saveBtn.disabled = false;
        saveBtn.textContent = 'Salvar';
    }
});

function showFormAlert(msg, type) {
    const el = document.getElementById('form-alert');
    el.textContent = msg;
    el.className   = `alert alert-${type} show`;
}

// ── Delete ──────────────────────────────────────────────
document.getElementById('confirm-cancel').addEventListener('click', function() {
    document.getElementById('confirm-overlay').classList.remove('open');
    pendingDeleteId = null;
});

document.getElementById('confirm-ok').addEventListener('click', async function() {
    if (!pendingDeleteId) return;
    document.getElementById('confirm-overlay').classList.remove('open');
    const { error } = await deleteStory(pendingDeleteId);
    pendingDeleteId = null;
    if (error) { alert('Erro ao remover: ' + error.message); return; }
    await loadStories();
});

function bindEvents() {
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeModal();
            document.getElementById('confirm-overlay').classList.remove('open');
        }
    });
}

init();
