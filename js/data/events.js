// Camada de dados (Repository) dos eventos — isola TODO o acesso ao Supabase
// (tabela `events`, `event_products`, Storage `event-photos` e a RPC de limpeza)
// do controller. As funções de leitura/escrita devolvem o resultado cru do
// supabase-js ({ data, error } ou { error }) para o controller tratar como antes;
// `uploadEventImage` lança em erro (igual ao uploadImage original).
import { sb } from '../core/supabase.js';

const BUCKET = 'event-photos';

// ── Eventos ─────────────────────────────────────────────────────
// Lista todos os eventos (mais recentes primeiro). Devolve { data, error }.
export function listEvents() {
    return sb.from('events').select('*').order('created_at', { ascending: false });
}

// Insere um evento e devolve o id criado. Devolve { data, error }.
export function insertEvent(payload) {
    return sb.from('events').insert(payload).select('id').single();
}

// Atualiza o evento `id` (também usado para troca de status). Devolve { error }.
export function updateEvent(id, payload) {
    return sb.from('events').update(payload).eq('id', id);
}

// Remove o evento `id` (reservas caem em cascata no banco). Devolve { error }.
export function deleteEvent(id) {
    return sb.from('events').delete().eq('id', id);
}

// ── Storage (imagens do evento) ─────────────────────────────────
// Sobe uma imagem para o bucket e devolve a URL pública. Lança em erro.
export async function uploadEventImage(file, slug) {
    const ext  = file.name.split('.').pop().toLowerCase();
    const path = 'events/' + slug + '-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7) + '.' + ext;
    const { error } = await sb.storage.from(BUCKET).upload(path, file, { upsert: true });
    if (error) throw error;
    return sb.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

// Remove imagens do bucket pelos caminhos (paths) já extraídos das URLs.
export function removeStoredImages(paths) {
    return sb.storage.from(BUCKET).remove(paths);
}

// ── Produtos do evento (venda) ──────────────────────────────────
// Lista os produtos de um evento na ordem de exibição. Devolve { data, error }.
export function listEventProducts(eventId) {
    return sb.from('event_products').select('*').eq('event_id', eventId)
        .order('sort_order', { ascending: true }).order('created_at', { ascending: true });
}

// Insere um produto e devolve o id criado. Devolve { data, error }.
export function insertProduct(payload) {
    return sb.from('event_products').insert(payload).select('id').single();
}

// Atualiza o produto `id`. Devolve { error }.
export function updateProduct(id, payload) {
    return sb.from('event_products').update(payload).eq('id', id);
}

// Remove o produto `id`. Devolve { error }.
export function deleteProduct(id) {
    return sb.from('event_products').delete().eq('id', id);
}

// ── Limpeza LGPD ────────────────────────────────────────────────
// Apaga dados pessoais/reservas e grava os agregados em events.summary (RPC
// transacional). Devolve { error }.
export function purgeEventData(id) {
    return sb.rpc('purge_event_data', { p_event_id: id });
}
