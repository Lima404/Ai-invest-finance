<template>
  <div class="p-4 sm:p-6 lg:p-8">
    <div class="mb-6 flex flex-wrap items-center gap-3">
      <div>
        <h1 class="font-display text-3xl">Despesas</h1>
        <p class="text-taupe">Saídas de dinheiro — cadastre manualmente ou importe extratos e faturas</p>
      </div>
      <div class="ml-auto flex gap-2">
        <RouterLink :to="{ name: 'importar' }" class="btn-outline"><AppIcon name="upload_file" :size="18" /> Importar</RouterLink>
        <button class="btn-primary" @click="novo"><AppIcon name="add" :size="18" /> Nova despesa</button>
      </div>
    </div>

    <div class="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
      <KpiCard label="Total de despesas" :value="store.totalDespesas" icon="trending_down" color="#FF4D4D" accent />
      <KpiCard label="Maior despesa" :value="maior" icon="priority_high" color="#FFFFFF" />
      <KpiCard label="Maior categoria" :value="topCat.total" icon="category" color="#B7ACA3" :hint="topCat.categoria" />
    </div>

    <TransactionsTable :rows="despesas" title="Despesas do período" @edit="editar" />

    <TransactionDialog v-model:open="dialog" tipo-inicial="despesa" :edit="editing" />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { RouterLink } from 'vue-router'
import KpiCard from '@/components/KpiCard.vue'
import TransactionsTable from '@/components/TransactionsTable.vue'
import TransactionDialog from '@/components/TransactionDialog.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import { useFinanceStore } from '@/stores/finance'

const store = useFinanceStore()
const dialog = ref(false)
const editing = ref(null)

const despesas = computed(() => store.filtradas.filter((t) => t.tipo === 'despesa'))
const maior = computed(() => despesas.value.reduce((m, t) => Math.max(m, t.valor), 0))
const topCat = computed(() => store.porCategoria[0] || { categoria: '—', total: 0 })

function novo () { editing.value = null; dialog.value = true }
function editar (row) { editing.value = row; dialog.value = true }
</script>
