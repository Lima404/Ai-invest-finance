<template>
  <div class="min-h-screen bg-app-gradient">
    <!-- Sidebar (desktop fixa / mobile drawer) -->
    <aside
      class="fixed inset-y-0 left-0 z-50 flex w-60 flex-col border-r border-line bg-black transition-transform lg:translate-x-0"
      :class="drawer ? 'translate-x-0' : '-translate-x-full'"
    >
      <div class="flex h-16 items-center border-b border-line px-5">
        <BrandLogo :size="30" subtitle="Gestão Financeira" />
      </div>

      <nav class="flex-1 space-y-1 overflow-y-auto p-3">
        <p class="px-3 pb-1 pt-2 font-display text-xs tracking-widest text-taupe">Menu</p>
        <RouterLink
          v-for="item in nav"
          :key="item.to"
          :to="{ name: item.to }"
          class="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-taupe transition-colors hover:bg-white/5 hover:text-white"
          active-class="bg-lime/10! text-lime! border border-lime/30"
          @click="drawer = false"
        >
          <AppIcon :name="item.icon" :size="20" />
          {{ item.label }}
        </RouterLink>
      </nav>

      <div class="space-y-2 p-3">
        <div class="ai-card-accent p-4">
          <p class="text-xs text-taupe">Saldo do período</p>
          <p class="font-display text-xl" :class="store.saldo >= 0 ? 'text-lime' : 'text-danger'">
            {{ formatBRL(store.saldo) }}
          </p>
        </div>
        <button class="btn-ghost w-full" @click="store.seedDemo()">
          <AppIcon name="science" :size="18" /> Dados de exemplo
        </button>

        <!-- Usuario + logout -->
        <div v-if="auth.isAuthenticated" class="flex items-center gap-2 rounded-xl border border-line p-2">
          <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-lime/15 text-xs font-bold text-lime">
            {{ auth.initials }}
          </div>
          <span class="min-w-0 flex-1 truncate text-xs text-taupe" :title="auth.email">{{ auth.email }}</span>
          <button class="btn-icon h-8 w-8" title="Sair" @click="sair">
            <AppIcon name="logout" :size="18" />
          </button>
        </div>
      </div>
    </aside>

    <!-- Overlay mobile -->
    <div v-if="drawer" class="fixed inset-0 z-40 bg-black/60 lg:hidden" @click="drawer = false" />

    <!-- Conteudo -->
    <div class="lg:pl-60">
      <header class="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-line bg-black/80 px-4 backdrop-blur-md sm:px-6">
        <button class="btn-icon lg:hidden" @click="drawer = !drawer">
          <AppIcon name="menu" :size="22" />
        </button>

        <div class="lg:hidden"><BrandLogo :size="26" :show-text="false" /></div>

        <div class="ml-auto flex items-center gap-2 sm:gap-3">
          <div class="w-40 sm:w-48">
            <Select v-model="mesSelecionado" :options="mesesOptions" placeholder="Período" />
          </div>
          <button class="btn-primary" @click="abrirNovo">
            <AppIcon name="add" :size="18" />
            <span class="hidden sm:inline">Novo lançamento</span>
          </button>
        </div>
      </header>

      <main>
        <RouterView />
      </main>
    </div>

    <TransactionDialog v-model:open="dialog" tipo-inicial="despesa" />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { RouterLink, RouterView, useRouter } from 'vue-router'
import BrandLogo from '@/components/BrandLogo.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import Select from '@/components/ui/Select.vue'
import TransactionDialog from '@/components/TransactionDialog.vue'
import { useFinanceStore } from '@/stores/finance'
import { useAuthStore } from '@/stores/auth'
import { formatBRL, formatMonthLabel } from '@/utils/format'
import { useToast } from '@/composables/useToast'
import { confirm } from '@/composables/useConfirm'

const store = useFinanceStore()
const auth = useAuthStore()
const router = useRouter()
const toast = useToast()
const drawer = ref(false)
const dialog = ref(false)

async function sair () {
  const ok = await confirm({ title: 'Sair da conta', message: 'Deseja encerrar a sessão?', okLabel: 'Sair' })
  if (!ok) return
  await auth.signOut()
  toast.info('Sessão encerrada', { icon: 'logout' })
  router.replace({ name: 'login' })
}

const nav = [
  { to: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
  { to: 'receitas', label: 'Receitas', icon: 'trending_up' },
  { to: 'despesas', label: 'Despesas', icon: 'trending_down' },
  { to: 'orcamento', label: 'Orçamento', icon: 'savings' },
  { to: 'importar', label: 'Importar arquivos', icon: 'upload_file' },
  { to: 'categorias', label: 'Categorias', icon: 'category' }
]

const mesesOptions = computed(() => [
  { label: 'Todos os períodos', value: '__all__' },
  ...store.meses.map((m) => ({ label: formatMonthLabel(m), value: m }))
])

const mesSelecionado = computed({
  get: () => store.filtroMes || '__all__',
  set: (v) => { store.filtroMes = v === '__all__' ? '' : v }
})

function abrirNovo () {
  dialog.value = true
}
</script>
