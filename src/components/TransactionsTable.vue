<template>
  <div class="ai-card overflow-hidden">
    <!-- topo -->
    <div class="flex flex-wrap items-center gap-3 border-b border-line p-4">
      <h3 class="font-display text-base">{{ title }}</h3>
      <div class="relative ml-auto w-full sm:w-64">
        <AppIcon name="search" :size="18" class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-taupe" />
        <input v-model="busca" type="text" placeholder="Buscar..." class="field pl-9" />
      </div>
    </div>

    <div class="overflow-x-auto">
      <table class="w-full text-sm">
        <thead>
          <tr class="border-b border-line text-left">
            <th v-for="col in columns" :key="col.key"
              class="select-none px-4 py-3 text-xs uppercase tracking-wide text-taupe"
              :class="[col.align === 'right' ? 'text-right' : '', col.sortable ? 'cursor-pointer hover:text-white' : '']"
              @click="col.sortable && sortBy(col.key)"
            >
              <span class="inline-flex items-center gap-1" :class="col.align === 'right' ? 'flex-row-reverse' : ''">
                {{ col.label }}
                <AppIcon v-if="sort.key === col.key" :name="sort.desc ? 'arrow_drop_down' : 'arrow_drop_up'" :size="18" />
              </span>
            </th>
            <th class="px-4 py-3"></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="t in paginadas" :key="t.id" class="border-b border-line/60 transition-colors hover:bg-white/[0.02]">
            <td class="whitespace-nowrap px-4 py-3 text-taupe">{{ formatDate(t.data) }}</td>
            <td class="px-4 py-3">{{ t.descricao }}</td>
            <td class="px-4 py-3">
              <span class="chip bg-white/5" :style="{ color: colorFor(t.categoria) }">
                <AppIcon :name="iconFor(t.categoria)" :size="14" />
                {{ t.categoria }}
              </span>
            </td>
            <td class="px-4 py-3">
              <span class="rounded-md border border-line px-2 py-0.5 text-xs text-taupe">{{ t.origem }}</span>
            </td>
            <td class="whitespace-nowrap px-4 py-3 text-right font-bold" :class="t.tipo === 'receita' ? 'text-lime' : 'text-danger'">
              {{ t.tipo === 'receita' ? '+' : '−' }} {{ formatBRL(t.valor) }}
            </td>
            <td class="px-4 py-3 text-right">
              <div class="flex justify-end gap-1">
                <button class="btn-icon" title="Editar" @click="$emit('edit', t)"><AppIcon name="edit" :size="18" /></button>
                <button class="btn-icon hover:text-danger!" title="Excluir" @click="excluir(t)"><AppIcon name="delete" :size="18" /></button>
              </div>
            </td>
          </tr>
          <tr v-if="!filtradas.length">
            <td :colspan="columns.length + 1" class="px-4 py-10 text-center text-taupe">Nenhum lançamento encontrado.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- paginacao -->
    <div v-if="totalPaginas > 1" class="flex items-center justify-between border-t border-line p-3 text-sm">
      <span class="text-taupe">{{ filtradas.length }} lançamento(s)</span>
      <div class="flex items-center gap-2">
        <button class="btn-icon" :disabled="pagina === 1" @click="pagina--"><AppIcon name="chevron_left" :size="20" /></button>
        <span class="text-taupe">{{ pagina }} / {{ totalPaginas }}</span>
        <button class="btn-icon" :disabled="pagina === totalPaginas" @click="pagina++"><AppIcon name="chevron_right" :size="20" /></button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import { formatBRL, formatDate } from '@/utils/format'
import { categoryColor, categoryIcon } from '@/utils/categories'
import { useFinanceStore } from '@/stores/finance'
import { useToast } from '@/composables/useToast'
import { confirm } from '@/composables/useConfirm'

const props = defineProps({
  rows: { type: Array, default: () => [] },
  title: { type: String, default: 'Lançamentos' }
})
defineEmits(['edit'])

const store = useFinanceStore()
const toast = useToast()

const busca = ref('')
const pagina = ref(1)
const porPagina = 12
const sort = ref({ key: 'data', desc: true })

const columns = [
  { key: 'data', label: 'Data', sortable: true },
  { key: 'descricao', label: 'Descrição', sortable: true },
  { key: 'categoria', label: 'Categoria', sortable: true },
  { key: 'origem', label: 'Origem', sortable: true },
  { key: 'valor', label: 'Valor', sortable: true, align: 'right' }
]

const filtradas = computed(() => {
  const q = busca.value.trim().toLowerCase()
  let list = props.rows
  if (q) {
    list = list.filter((t) =>
      [t.descricao, t.categoria, t.origem].some((v) => (v || '').toLowerCase().includes(q))
    )
  }
  const { key, desc } = sort.value
  return [...list].sort((a, b) => {
    let r
    if (key === 'valor') r = a.valor - b.valor
    else r = String(a[key] || '').localeCompare(String(b[key] || ''))
    return desc ? -r : r
  })
})

const totalPaginas = computed(() => Math.max(1, Math.ceil(filtradas.value.length / porPagina)))
const paginadas = computed(() => filtradas.value.slice((pagina.value - 1) * porPagina, pagina.value * porPagina))

watch([filtradas, totalPaginas], () => {
  if (pagina.value > totalPaginas.value) pagina.value = totalPaginas.value
})

function sortBy (key) {
  if (sort.value.key === key) sort.value.desc = !sort.value.desc
  else sort.value = { key, desc: false }
}

function colorFor (n) { return categoryColor(n) }
function iconFor (n) { return categoryIcon(n) }

async function excluir (row) {
  const ok = await confirm({
    title: 'Excluir lançamento',
    message: `Remover "${row.descricao}" (${formatBRL(row.valor)})?`,
    okLabel: 'Excluir',
    danger: true
  })
  if (ok) {
    store.remove(row.id)
    toast.info('Lançamento removido', { icon: 'delete' })
  }
}
</script>
