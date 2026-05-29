<template>
  <div class="p-4 sm:p-6 lg:p-8">
    <h1 class="font-display text-3xl">Categorias</h1>
    <p class="mb-6 text-taupe">Categorias usadas na classificação automática de receitas e despesas.</p>

    <div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <div class="ai-card p-5">
        <h2 class="mb-4 font-display text-base text-lime">Receitas</h2>
        <ul class="space-y-1">
          <li v-for="c in store.categoriasReceita" :key="c.nome" class="flex items-center gap-3 py-1.5">
            <div class="flex h-9 w-9 items-center justify-center rounded-xl bg-white/5" :style="{ color: c.color }">
              <AppIcon :name="c.icon" :size="20" />
            </div>
            <span class="flex-1">{{ c.nome }}</span>
            <span class="text-taupe">{{ formatBRL(totalPorCat(c.nome, 'receita')) }}</span>
          </li>
        </ul>
      </div>

      <div class="ai-card p-5">
        <h2 class="mb-4 font-display text-base text-danger">Despesas</h2>
        <ul class="space-y-1">
          <li v-for="c in store.categoriasDespesa" :key="c.nome" class="flex items-center gap-3 py-1.5">
            <div class="flex h-9 w-9 items-center justify-center rounded-xl bg-white/5" :style="{ color: c.color }">
              <AppIcon :name="c.icon" :size="20" />
            </div>
            <span class="flex-1">{{ c.nome }}</span>
            <span class="text-taupe">{{ formatBRL(totalPorCat(c.nome, 'despesa')) }}</span>
          </li>
        </ul>
      </div>
    </div>

    <div class="ai-card mt-4 flex flex-wrap items-center gap-3 p-5">
      <div>
        <h2 class="font-display text-base">Dados</h2>
        <p class="text-xs text-taupe">Os dados são salvos localmente no seu navegador.</p>
      </div>
      <button class="btn-danger ml-auto" @click="limpar"><AppIcon name="delete_sweep" :size="18" /> Apagar todos os dados</button>
    </div>
  </div>
</template>

<script setup>
import AppIcon from '@/components/ui/AppIcon.vue'
import { useFinanceStore } from '@/stores/finance'
import { formatBRL } from '@/utils/format'
import { useToast } from '@/composables/useToast'
import { confirm } from '@/composables/useConfirm'

const store = useFinanceStore()
const toast = useToast()

function totalPorCat (nome, tipo) {
  return store.transactions.filter((t) => t.tipo === tipo && t.categoria === nome).reduce((a, t) => a + Number(t.valor || 0), 0)
}

async function limpar () {
  const ok = await confirm({
    title: 'Apagar todos os dados',
    message: 'Isso remove todas as receitas e despesas salvas. Não pode ser desfeito.',
    okLabel: 'Apagar tudo',
    danger: true
  })
  if (ok) {
    const limpou = await store.clearAll()
    if (limpou) toast.info('Todos os dados foram apagados', { icon: 'delete_sweep' })
  }
}
</script>
