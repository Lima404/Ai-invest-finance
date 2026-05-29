<template>
  <div class="p-4 sm:p-6 lg:p-8">
    <div class="mb-6 flex flex-wrap items-center gap-3">
      <div>
        <h1 class="font-display text-3xl">Orçamento</h1>
        <p class="text-taupe">Metas de gasto mensais por categoria — referência: <b class="text-lime">{{ mesLabel }}</b></p>
      </div>
      <button class="btn-primary ml-auto" @click="abrirEditor()"><AppIcon name="add_task" :size="18" /> Definir meta</button>
    </div>

    <!-- Resumo -->
    <div class="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <KpiCard label="Orçamento total" :value="resumo.limiteTotal" icon="savings" color="#FFFFFF" accent />
      <KpiCard label="Gasto no mês" :value="resumo.gastoTotal" icon="trending_down" :color="resumo.pct >= 100 ? '#FF4D4D' : '#C6F806'" />
      <KpiCard label="Disponível" :value="resumo.restante" icon="account_balance_wallet" :color="resumo.restante >= 0 ? '#C6F806' : '#FF4D4D'" />
      <div class="ai-card flex flex-col justify-center p-5">
        <p class="text-xs uppercase tracking-wide text-taupe">Uso do orçamento</p>
        <p class="font-display text-2xl" :class="pctColor(resumo.pct)">{{ resumo.pct.toFixed(0) }}%</p>
        <ProgressBar :value="resumo.pct" :color="barColor(resumo.pct)" :size="8" class="mt-2" />
      </div>
    </div>

    <!-- Alertas -->
    <div v-if="resumo.estouradas || resumo.emAlerta" class="ai-card mb-4 flex items-center gap-3 p-4 text-sm">
      <AppIcon name="notifications_active" :size="20" class="text-warn" />
      <span v-if="resumo.estouradas" class="font-medium text-danger">{{ resumo.estouradas }} categoria(s) estourou(aram) a meta.</span>
      <span v-if="resumo.emAlerta" class="text-warn">{{ resumo.emAlerta }} categoria(s) acima de 80%.</span>
    </div>

    <!-- Lista -->
    <div class="ai-card p-5">
      <h2 class="mb-4 font-display text-base">Metas por categoria</h2>

      <div v-if="!status.length" class="flex flex-col items-center py-10 text-center text-taupe">
        <AppIcon name="flag" :size="40" class="mb-2 text-lime" />
        Nenhuma meta definida ainda.
        <button class="btn-ghost mt-2" @click="abrirEditor()">Definir minha primeira meta</button>
      </div>

      <div v-for="(item, idx) in status" :key="item.categoria" class="py-4" :class="idx > 0 ? 'border-t border-line' : ''">
        <div class="mb-1.5 flex items-center gap-3">
          <div class="flex h-9 w-9 items-center justify-center rounded-xl bg-white/5" :style="{ color: cor(item.categoria) }">
            <AppIcon :name="icone(item.categoria)" :size="20" />
          </div>
          <div class="min-w-0 flex-1">
            <p class="font-medium">{{ item.categoria }}</p>
            <p class="text-xs text-taupe">{{ formatBRL(item.gasto) }} de {{ formatBRL(item.limite) }}</p>
          </div>
          <div class="text-right">
            <p class="font-bold" :class="pctColor(item.pct)">{{ item.pct.toFixed(0) }}%</p>
            <p class="text-xs" :class="item.restante >= 0 ? 'text-taupe' : 'text-danger'">
              {{ item.restante >= 0 ? 'restam ' : 'excedeu ' }}{{ formatBRL(Math.abs(item.restante)) }}
            </p>
          </div>
          <button class="btn-icon" title="Editar" @click="abrirEditor(item)"><AppIcon name="edit" :size="18" /></button>
          <button class="btn-icon hover:text-danger!" title="Remover" @click="excluir(item)"><AppIcon name="delete" :size="18" /></button>
        </div>
        <ProgressBar :value="item.pct" :color="barColor(item.pct)" :size="10" />
      </div>
    </div>

    <!-- Editor -->
    <Modal v-model:open="editor" :title="editandoCategoria ? 'Editar meta' : 'Nova meta'" description="Definição de meta de orçamento">
      <div class="space-y-4">
        <div>
          <label class="field-label">Categoria de despesa</label>
          <Select v-model="form.categoria" :options="categoriasDisponiveis" :icon-for="icone" :color-for="cor"
            placeholder="Selecione a categoria" :disabled="!!editandoCategoria" />
        </div>
        <div>
          <label class="field-label">Limite mensal (R$)</label>
          <input v-model.number="form.limite" type="number" min="0" step="0.01" class="field" placeholder="0,00" />
        </div>
      </div>
      <template #footer>
        <button class="btn-ghost" @click="editor = false">Cancelar</button>
        <button class="btn-primary" :disabled="!form.categoria || !(form.limite > 0)" @click="salvar">Salvar meta</button>
      </template>
    </Modal>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import KpiCard from '@/components/KpiCard.vue'
import ProgressBar from '@/components/ui/ProgressBar.vue'
import Modal from '@/components/ui/Modal.vue'
import Select from '@/components/ui/Select.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import { useFinanceStore } from '@/stores/finance'
import { formatBRL, formatMonthLabel } from '@/utils/format'
import { categoryColor, categoryIcon } from '@/utils/categories'
import { useToast } from '@/composables/useToast'

const store = useFinanceStore()
const toast = useToast()

const editor = ref(false)
const editandoCategoria = ref(null)
const form = ref({ categoria: '', limite: null })

const status = computed(() => store.statusOrcamento)
const resumo = computed(() => store.resumoOrcamento)
const mesLabel = computed(() => formatMonthLabel(store.mesOrcamento))

const categoriasDisponiveis = computed(() => {
  const todas = store.categoriasDespesa.map((c) => c.nome)
  if (editandoCategoria.value) return todas
  return todas.filter((c) => !(c in store.budgets))
})

function cor (n) { return categoryColor(n) }
function icone (n) { return categoryIcon(n) }
function pctColor (pct) { return pct >= 100 ? 'text-danger' : pct >= 80 ? 'text-warn' : 'text-lime' }
function barColor (pct) { return pct >= 100 ? '#FF4D4D' : pct >= 80 ? '#FBBF24' : '#C6F806' }

function abrirEditor (item = null) {
  if (item) {
    editandoCategoria.value = item.categoria
    form.value = { categoria: item.categoria, limite: item.limite }
  } else {
    editandoCategoria.value = null
    form.value = { categoria: categoriasDisponiveis.value[0] || '', limite: null }
  }
  editor.value = true
}

function salvar () {
  store.setBudget(form.value.categoria, form.value.limite)
  toast.success('Meta salva')
  editor.value = false
}

function excluir (item) {
  store.removeBudget(item.categoria)
  toast.info(`Meta de ${item.categoria} removida`, { icon: 'delete' })
}
</script>
