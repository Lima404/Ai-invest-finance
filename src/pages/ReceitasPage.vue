<template>
  <div class="p-4 sm:p-6 lg:p-8">
    <div class="mb-6 flex flex-wrap items-center gap-3">
      <div>
        <h1 class="font-display text-3xl">Receitas</h1>
        <p class="text-taupe">Entradas de dinheiro — salário, freelance, investimentos…</p>
      </div>
      <button class="btn-primary ml-auto" @click="novo"><AppIcon name="add" :size="18" /> Nova receita</button>
    </div>

    <div class="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
      <KpiCard label="Total de receitas" :value="store.totalReceitas" icon="trending_up" color="#C6F806" accent />
      <KpiCard label="Maior receita" :value="maior" icon="star" color="#FFFFFF" />
      <KpiCard label="Média por lançamento" :value="media" icon="functions" color="#B7ACA3" />
    </div>

    <div class="ai-card mb-4 flex items-start gap-3 p-4 text-sm">
      <AppIcon name="lightbulb" :size="20" class="text-lime" />
      <p>
        Dica: cadastre receitas manualmente ou importe um
        <RouterLink :to="{ name: 'importar' }" class="text-lime hover:underline">contracheque em PDF</RouterLink>
        para lançar o salário automaticamente.
      </p>
    </div>

    <TransactionsTable :rows="receitas" title="Receitas do período" @edit="editar" />

    <TransactionDialog v-model:open="dialog" tipo-inicial="receita" :edit="editing" />
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

const receitas = computed(() => store.filtradas.filter((t) => t.tipo === 'receita'))
const maior = computed(() => receitas.value.reduce((m, t) => Math.max(m, t.valor), 0))
const media = computed(() => receitas.value.length ? store.totalReceitas / receitas.value.length : 0)

function novo () { editing.value = null; dialog.value = true }
function editar (row) { editing.value = row; dialog.value = true }
</script>
