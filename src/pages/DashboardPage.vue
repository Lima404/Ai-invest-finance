<template>
  <div class="p-4 sm:p-6 lg:p-8">
    <div class="mb-6">
      <h1 class="font-display text-3xl">Dashboard</h1>
      <p class="text-taupe">{{ periodoLabel }}</p>
    </div>

    <!-- KPIs -->
    <div class="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <KpiCard label="Receitas" :value="store.totalReceitas" icon="trending_up" color="#C6F806" />
      <KpiCard label="Despesas" :value="store.totalDespesas" icon="trending_down" color="#FF4D4D" />
      <KpiCard label="Saldo" :value="store.saldo" icon="account_balance_wallet" :color="store.saldo >= 0 ? '#C6F806' : '#FF4D4D'" accent />
      <KpiCard label="Taxa de economia" :value="0" icon="savings" color="#FFFFFF" :hint="taxaEconomia" />
    </div>

    <div class="grid grid-cols-1 gap-4 lg:grid-cols-12">
      <div class="ai-card p-5 lg:col-span-7">
        <div class="mb-4 flex items-center justify-between">
          <h2 class="font-display text-base">Evolução mensal</h2>
          <AppIcon name="bar_chart" :size="20" class="text-lime" />
        </div>
        <BarChart :data="serieChart" />
      </div>

      <div class="ai-card p-5 lg:col-span-5">
        <div class="mb-4 flex items-center justify-between">
          <h2 class="font-display text-base">Despesas por categoria</h2>
          <AppIcon name="donut_large" :size="20" class="text-lime" />
        </div>
        <DonutChart :items="store.porCategoria" />
      </div>
    </div>

    <!-- Orcamento do mes -->
    <div v-if="orcamento.length" class="ai-card mt-4 p-5">
      <div class="mb-4 flex items-center justify-between">
        <h2 class="font-display text-base">Orçamento do mês</h2>
        <RouterLink :to="{ name: 'orcamento' }" class="text-sm text-lime hover:underline">Gerenciar metas</RouterLink>
      </div>
      <div class="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
        <div v-for="item in orcamento" :key="item.categoria">
          <div class="mb-1 flex items-center gap-2">
            <AppIcon :name="iconFor(item.categoria)" :size="18" :style="{ color: colorFor(item.categoria) }" />
            <span class="flex-1 truncate text-sm">{{ item.categoria }}</span>
            <span class="text-xs font-bold" :class="pctColor(item.pct)">{{ item.pct.toFixed(0) }}%</span>
          </div>
          <ProgressBar :value="item.pct" :color="barColor(item.pct)" :size="8" />
          <p class="mt-1 text-xs text-taupe">{{ formatBRL(item.gasto) }} / {{ formatBRL(item.limite) }}</p>
        </div>
      </div>
    </div>

    <!-- Ultimos lancamentos -->
    <div class="ai-card mt-4 p-5">
      <div class="mb-3 flex items-center justify-between">
        <h2 class="font-display text-base">Últimos lançamentos</h2>
        <RouterLink :to="{ name: 'despesas' }" class="text-sm text-lime hover:underline">Ver despesas</RouterLink>
      </div>
      <ul class="divide-y divide-line/60">
        <li v-for="t in ultimos" :key="t.id" class="flex items-center gap-3 py-3">
          <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5" :style="{ color: colorFor(t.categoria) }">
            <AppIcon :name="iconFor(t.categoria)" :size="20" />
          </div>
          <div class="min-w-0 flex-1">
            <p class="truncate">{{ t.descricao }}</p>
            <p class="truncate text-xs text-taupe">{{ formatDate(t.data) }} · {{ t.categoria }} · {{ t.origem }}</p>
          </div>
          <span class="font-bold" :class="t.tipo === 'receita' ? 'text-lime' : 'text-danger'">
            {{ t.tipo === 'receita' ? '+' : '−' }} {{ formatBRL(t.valor) }}
          </span>
        </li>
        <li v-if="!ultimos.length" class="py-8 text-center text-taupe">
          Nenhum lançamento ainda. Adicione manualmente ou
          <RouterLink :to="{ name: 'importar' }" class="text-lime hover:underline">importe um arquivo</RouterLink>.
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import KpiCard from '@/components/KpiCard.vue'
import { BarChart } from '@/components/ui/chart-bar'
import { DonutChart } from '@/components/ui/chart-donut'
import ProgressBar from '@/components/ui/ProgressBar.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import { useFinanceStore } from '@/stores/finance'
import { formatBRL, formatDate, formatMonthLabel } from '@/utils/format'
import { categoryColor, categoryIcon } from '@/utils/categories'

const store = useFinanceStore()

const periodoLabel = computed(() => store.filtroMes ? `Período: ${formatMonthLabel(store.filtroMes)}` : 'Todos os períodos')

const serieChart = computed(() =>
  store.serieMensal.map((s) => ({ label: formatMonthLabel(s.mes), receitas: s.receitas, despesas: s.despesas }))
)

const taxaEconomia = computed(() => {
  if (!store.totalReceitas) return 'Sem receitas no período'
  return `${((store.saldo / store.totalReceitas) * 100).toFixed(1)}% da renda foi poupada`
})

const ultimos = computed(() =>
  [...store.filtradas].sort((a, b) => (b.data + b.criadoEm).localeCompare(a.data + a.criadoEm)).slice(0, 6)
)

const orcamento = computed(() => store.statusOrcamento.slice(0, 6))

function pctColor (pct) { return pct >= 100 ? 'text-danger' : pct >= 80 ? 'text-warn' : 'text-lime' }
function barColor (pct) { return pct >= 100 ? '#FF4D4D' : pct >= 80 ? '#FBBF24' : '#C6F806' }
function colorFor (n) { return categoryColor(n) }
function iconFor (n) { return categoryIcon(n) }
</script>
