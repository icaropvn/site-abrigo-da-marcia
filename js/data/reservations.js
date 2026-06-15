// Camada de dados (Repository) das reservas — isola o acesso às tabelas
// `reservations` e `reservation_items` do controller. As funções de
// reconciliação de números/itens (lógica de diff) ficam no controller; aqui só
// as queries cruas. Todas devolvem o resultado cru do supabase-js.
import { sb } from '../core/supabase.js';

// Lista as reservas de um evento com seus itens (mais recentes primeiro).
// Devolve { data, error }.
export function listReservations(eventId) {
    return sb.from('reservations').select('*, reservation_items(*)').eq('event_id', eventId)
        .order('created_at', { ascending: false });
}

// Insere uma reserva e devolve o id criado. Devolve { data, error }.
export function insertReservation(payload) {
    return sb.from('reservations').insert(payload).select('id').single();
}

// Atualiza a reserva `id` (payload completo ou apenas { status }). Devolve { error }.
export function updateReservation(id, payload) {
    return sb.from('reservations').update(payload).eq('id', id);
}

// Remove a reserva `id` (itens caem em cascata no banco). Devolve { error }.
export function deleteReservation(id) {
    return sb.from('reservations').delete().eq('id', id);
}

// ── Itens da reserva (números da rifa / produtos) ───────────────
// Insere uma lista de itens. Devolve { error }.
export function insertReservationItems(rows) {
    return sb.from('reservation_items').insert(rows);
}

// Remove o item `id`. Devolve { error }.
export function deleteReservationItem(id) {
    return sb.from('reservation_items').delete().eq('id', id);
}
