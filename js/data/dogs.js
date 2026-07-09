// Camada de dados (Repository) dos cães — isola TODO o acesso ao Supabase
// (tabela `dogs` + Storage `dog-photos`) do controller. As funções de leitura/
// escrita devolvem o resultado cru do supabase-js ({ data, error } ou { error });
// `uploadDogPhoto` lança em erro e devolve a URL pública.
import { sb } from '../core/supabase.js';

const BUCKET = 'dog-photos';

// Lista todos os cães: destacados primeiro, depois mais recentes. Devolve
// { data, error }.
export function listDogs() {
    return sb.from('dogs').select('*')
        .order('featured', { ascending: false })
        .order('created_at', { ascending: false });
}

// Insere um cão. Devolve { error }.
export function insertDog(payload) {
    return sb.from('dogs').insert(payload);
}

// Atualiza o cão `id` (payload completo ou apenas { status }). Devolve { error }.
export function updateDog(id, payload) {
    return sb.from('dogs').update(payload).eq('id', id);
}

// Remove o cão `id`. Devolve { error }.
export function deleteDog(id) {
    return sb.from('dogs').delete().eq('id', id);
}

// Faz upload de uma foto e devolve a URL pública. Lança em erro.
export async function uploadDogPhoto(file, slug) {
    const ext  = file.name.split('.').pop().toLowerCase();
    const path = `${slug}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}.${ext}`;
    const { error } = await sb.storage.from(BUCKET).upload(path, file, { upsert: true });
    if (error) throw error;
    const { data } = sb.storage.from(BUCKET).getPublicUrl(path);
    return data.publicUrl;
}
