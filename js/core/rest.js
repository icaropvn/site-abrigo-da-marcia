// Helper de acesso à REST do Supabase para leitura pública anônima (módulo ES).
// Portado do fetchJson das páginas públicas (render-events.js etc.), centralizado
// para os repositórios de data/ reusarem. Mantém o mesmo comportamento: timeout de
// 8s, headers anon, POST quando há body, e erro com `.code` = mensagem do Supabase
// (usado para mapear códigos de RPC a mensagens amigáveis na camada de domínio).
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../config.js';

// `path` é relativo a /rest/v1/ (ex.: 'events?status=eq.ativo&limit=1' ou
// 'rpc/create_reservation'). Passe { body } para virar POST com JSON.
export async function fetchJson(path, options) {
    const url = SUPABASE_URL + '/rest/v1/' + path;
    const controller = new AbortController();
    const timeoutId  = setTimeout(function() { controller.abort(); }, 8000);
    const headers = {
        'apikey':        SUPABASE_ANON_KEY,
        'Authorization': 'Bearer ' + SUPABASE_ANON_KEY
    };
    const init = { signal: controller.signal, headers: headers };
    if (options && options.body) {
        init.method = 'POST';
        headers['Content-Type'] = 'application/json';
        init.body = JSON.stringify(options.body);
    }
    const response = await fetch(url, init);
    clearTimeout(timeoutId);
    let data = null;
    try { data = await response.json(); } catch (e) { /* respostas vazias */ }
    if (!response.ok) {
        const err = new Error((data && data.message) || ('Supabase retornou ' + response.status));
        err.code = data && data.message;
        throw err;
    }
    return data;
}
