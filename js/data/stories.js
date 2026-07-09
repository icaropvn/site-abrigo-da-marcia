// Camada de dados (Repository) das histórias — isola TODO o acesso ao Supabase
// (tabela `stories` + Storage) do controller. Histórias reusam o bucket
// `dog-photos`. Funções que escrevem lançam em erro; listStories devolve o
// resultado cru ({ data, error }) para o controller tratar como antes.
import { sb } from '../core/supabase.js';

const BUCKET = 'dog-photos';

// Lista todas as histórias (mais recentes primeiro). Devolve { data, error }.
export function listStories() {
    return sb.from('stories').select('*').order('created_at', { ascending: false });
}

// Insere uma nova história. Devolve { error }.
export function insertStory(payload) {
    return sb.from('stories').insert(payload);
}

// Atualiza a história `id`. Devolve { error }.
export function updateStory(id, payload) {
    return sb.from('stories').update(payload).eq('id', id);
}

// Remove a história `id`. Devolve { error }.
export function deleteStory(id) {
    return sb.from('stories').delete().eq('id', id);
}

// Faz upload de uma foto e devolve a URL pública. Lança em erro.
export async function uploadStoryPhoto(file, slug) {
    const ext  = file.name.split('.').pop().toLowerCase();
    const path = `stories/${slug}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}.${ext}`;
    const { error } = await sb.storage.from(BUCKET).upload(path, file, { upsert: true });
    if (error) throw error;
    const { data } = sb.storage.from(BUCKET).getPublicUrl(path);
    return data.publicUrl;
}
