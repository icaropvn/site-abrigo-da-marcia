// Client Supabase compartilhado (módulo ES). Importa o supabase-js vendorizado
// (js/vendor/ — sem dependência de CDN em runtime, ver decisão da Fase A no
// ROADMAP) e cria um único client com a anon key pública.
//
// persistSession (localStorage) + autoRefreshToken são o padrão do supabase-js:
// o admin segue logado entre recarregamentos e reaberturas.
import { createClient } from '../vendor/supabase-js@2.108.1.esm.js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../config.js';

export const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
