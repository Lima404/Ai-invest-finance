<template>
  <div class="flex min-h-screen items-center justify-center bg-app-gradient p-4">
    <div class="w-full max-w-md">
      <div class="mb-8 flex flex-col items-center text-center">
        <BrandLogo :size="44" subtitle="Gestão Financeira" />
      </div>

      <div class="ai-card p-6 sm:p-8">
        <SegmentedControl
          v-model="modo"
          full-width
          class="mb-6"
          :options="[
            { value: 'login', label: 'Entrar' },
            { value: 'signup', label: 'Criar conta' }
          ]"
        />

        <!-- aviso de configuracao ausente -->
        <div v-if="!auth.configured" class="mb-5 flex items-start gap-3 rounded-xl border border-warn/40 bg-warn/10 p-3 text-sm">
          <AppIcon name="warning" :size="20" class="mt-0.5 text-warn" />
          <p>
            Supabase ainda não configurado. Preencha <code class="text-warn">VITE_SUPABASE_ANON_KEY</code>
            no arquivo <code class="text-warn">.env</code> e reinicie o <code>npm run dev</code>.
          </p>
        </div>

        <form class="space-y-4" @submit.prevent="enviar">
          <div>
            <label class="field-label">E-mail</label>
            <input v-model="form.email" type="email" required autocomplete="email" class="field" placeholder="voce@email.com" />
          </div>
          <div>
            <label class="field-label">Senha</label>
            <div class="relative">
              <input
                v-model="form.senha"
                :type="mostrarSenha ? 'text' : 'password'"
                required
                autocomplete="current-password"
                minlength="6"
                class="field pr-10"
                placeholder="••••••••"
              />
              <button type="button" class="absolute right-2 top-1/2 -translate-y-1/2 btn-icon h-8 w-8" @click="mostrarSenha = !mostrarSenha">
                <AppIcon :name="mostrarSenha ? 'visibility_off' : 'visibility'" :size="18" />
              </button>
            </div>
            <p v-if="modo === 'signup'" class="mt-1 text-xs text-taupe">Mínimo de 6 caracteres.</p>
          </div>

          <button type="submit" class="btn-primary w-full" :disabled="auth.loading || !auth.configured">
            <span v-if="auth.loading" class="ai-spinner-sm" />
            <AppIcon v-else :name="modo === 'login' ? 'login' : 'person_add'" :size="18" />
            {{ modo === 'login' ? 'Entrar' : 'Criar conta' }}
          </button>
        </form>

        <p class="mt-5 text-center text-xs text-taupe">
          {{ modo === 'login' ? 'Não tem conta?' : 'Já tem conta?' }}
          <button class="text-lime hover:underline" @click="modo = modo === 'login' ? 'signup' : 'login'">
            {{ modo === 'login' ? 'Crie uma agora' : 'Entrar' }}
          </button>
        </p>
      </div>

      <p class="mt-6 text-center text-xs text-taupe/70">Seus dados ficam protegidos por linha (RLS) no Supabase.</p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import BrandLogo from '@/components/BrandLogo.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import SegmentedControl from '@/components/ui/SegmentedControl.vue'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/composables/useToast'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()
const toast = useToast()

const modo = ref('login')
const mostrarSenha = ref(false)
const form = ref({ email: '', senha: '' })

async function enviar () {
  if (!auth.configured) {
    toast.error('Configure o Supabase no .env antes de continuar.')
    return
  }
  if (modo.value === 'login') {
    const r = await auth.signIn(form.value.email, form.value.senha)
    if (r.ok) {
      toast.success('Bem-vindo de volta!')
      redirecionar()
    } else {
      toast.error(r.error)
    }
  } else {
    const r = await auth.signUp(form.value.email, form.value.senha)
    if (r.ok) {
      if (r.precisaConfirmar) {
        toast.success('Conta criada! Confirme o e-mail enviado para ativar o acesso.', { timeout: 6000 })
        modo.value = 'login'
      } else {
        toast.success('Conta criada com sucesso!')
        redirecionar()
      }
    } else {
      toast.error(r.error)
    }
  }
}

function redirecionar () {
  const dest = route.query.redirect || '/'
  router.replace(dest)
}
</script>

<style scoped>
.ai-spinner-sm {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 2px solid rgba(0, 0, 0, 0.3);
  border-top-color: #000;
  animation: spin 0.7s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
</style>
