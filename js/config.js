// Configuração central da aplicação (módulo ES). Fonte única das credenciais e
// das constantes que antes estavam espalhadas/duplicadas (creds em
// supabase-config.js; PIX_DEFAULTS em admin-common.js; MAX_PHOTOS e os *_LABEL
// repetidos nas páginas admin). Consumido pelos módulos de core/, data/ e pelos
// controllers de cada página migrada.
//
// Migração (Fase A): este é o "espelho exportável" — as páginas legadas seguem
// usando os globais antigos até serem migradas página a página.

// ── Credenciais Supabase (públicas — a anon key é segura no frontend) ──
export const SUPABASE_URL      = 'https://hnbbjohjobvclinxclbw.supabase.co';
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhuYmJqb2hqb2J2Y2xpbnhjbGJ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEwNDgzOTIsImV4cCI6MjA5NjYyNDM5Mn0.BC990IRtOhZSarhGs8hcR6NjMhsJADn-TiogGn42zWU';

// ── Dados padrão do PIX (constantes do abrigo) ──────────────────
// Pré-preenchem os campos de PIX ao criar/editar um evento; o admin pode
// sobrescrever por evento. Valores públicos — vão no QR/copia-e-cola. O pix.js
// sanitiza nome/cidade (remove acento, maiúsculas, corta no limite) ao montar o
// BR Code, então aqui ficam legíveis.
export const PIX_DEFAULTS = {
    key:  'abrigodamarcia@gmail.com',
    name: 'Marcia Camara Barbosa',
    city: 'Ribeirão Preto'
};

// ── Limites ─────────────────────────────────────────────────────
// Máximo de fotos por cão/história/evento.
export const MAX_PHOTOS = 5;

// ── Rótulos de status ───────────────────────────────────────────
// Status de uma reserva.
export const STATUS_LABEL = {
    reservado: 'Reservado', pago: 'Pago', entregue: 'Entregue', cancelado: 'Cancelado'
};
// Status de um evento.
export const EVENT_STATUS_LABEL = {
    rascunho: 'Rascunho', ativo: 'Ativo', encerrado: 'Encerrado', arquivado: 'Arquivado'
};
