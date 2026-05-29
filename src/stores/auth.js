import { defineStore } from 'pinia'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    session: null,
    ready: false, // sessao inicial ja foi resolvida?
    loading: false,
    configured: isSupabaseConfigured
  }),

  getters: {
    isAuthenticated: (s) => !!s.user,
    email: (s) => s.user?.email || '',
    // iniciais para o avatar
    initials: (s) => {
      const e = s.user?.email || '?'
      return e.slice(0, 2).toUpperCase()
    }
  },

  actions: {
    // Carrega a sessao existente e passa a ouvir mudancas de auth.
    async init () {
      if (this.ready) return
      try {
        const { data } = await supabase.auth.getSession()
        this.session = data.session
        this.user = data.session?.user ?? null
      } catch (e) {
        console.warn('[auth] falha ao obter sessao:', e?.message)
      } finally {
        this.ready = true
      }

      supabase.auth.onAuthStateChange((_event, session) => {
        this.session = session
        this.user = session?.user ?? null
      })
    },

    async signIn (email, password) {
      this.loading = true
      try {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        this.session = data.session
        this.user = data.user ?? data.session?.user ?? null
        return { ok: true }
      } catch (error) {
        return { ok: false, error: traduzErro(error) }
      } finally {
        this.loading = false
      }
    },

    async signUp (email, password) {
      this.loading = true
      try {
        const { data, error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        // Se a confirmacao por e-mail estiver ativa, nao ha sessao ainda.
        const precisaConfirmar = !data.session
        this.session = data.session
        this.user = data.user
        return { ok: true, precisaConfirmar }
      } catch (error) {
        return { ok: false, error: traduzErro(error) }
      } finally {
        this.loading = false
      }
    },

    async signOut () {
      await supabase.auth.signOut()
      this.session = null
      this.user = null
    }
  }
})

// Mensagens de erro do Supabase Auth em pt-BR
function traduzErro (error) {
  const msg = (error?.message || '').toLowerCase()
  if (msg.includes('invalid login credentials')) return 'E-mail ou senha incorretos.'
  if (msg.includes('email not confirmed')) return 'Confirme seu e-mail antes de entrar.'
  if (msg.includes('user already registered')) return 'Este e-mail já está cadastrado.'
  if (msg.includes('password should be at least')) return 'A senha deve ter pelo menos 6 caracteres.'
  if (msg.includes('unable to validate email')) return 'E-mail inválido.'
  if (msg.includes('failed to fetch') || msg.includes('network')) {
    return 'Não foi possível conectar ao Supabase. Verifique a configuração (.env) e sua conexão.'
  }
  return error?.message || 'Ocorreu um erro inesperado.'
}
