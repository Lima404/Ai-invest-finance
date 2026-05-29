import { createClient } from '@supabase/supabase-js'

// Variaveis vindas do .env (prefixo VITE_ = expostas ao front-end).
// A anon key e' publica; a protecao real dos dados e' a RLS no banco.
const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Detecta se o projeto ainda nao foi configurado (placeholder do .env)
export const isSupabaseConfigured = Boolean(
  url && anonKey && !/COLE_AQUI/i.test(anonKey) && anonKey.length > 20
)

if (!isSupabaseConfigured) {
  // Aviso amigavel no console em vez de quebrar a aplicacao
  console.warn(
    '[AI Invest] Supabase nao configurado. Preencha VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no arquivo .env.'
  )
}

export const supabase = createClient(
  url || 'https://placeholder.supabase.co',
  anonKey && !/COLE_AQUI/i.test(anonKey) ? anonKey : 'placeholder-anon-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storageKey: 'ai-invest-auth'
    }
  }
)
