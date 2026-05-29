<template>
  <div class="p-4 sm:p-6 lg:p-8">
    <h1 class="font-display text-3xl">Importar arquivos</h1>
    <p class="mb-6 text-taupe">Extratos bancários, faturas de cartão (OFX / CSV / PDF) e contracheques (PDF).</p>

    <!-- Upload -->
    <div class="ai-card mb-4 p-5">
      <div class="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div
          class="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-line p-10 text-center transition-colors hover:border-lime hover:bg-lime/5 lg:col-span-2"
          :class="dragOver ? 'border-lime bg-lime/5' : ''"
          @dragover.prevent="dragOver = true"
          @dragleave.prevent="dragOver = false"
          @drop.prevent="onDrop"
          @click="pick"
        >
          <AppIcon name="cloud_upload" :size="42" class="text-lime" />
          <p class="mt-2 text-base">Arraste o arquivo aqui ou clique para selecionar</p>
          <p class="text-xs text-taupe">Formatos: .ofx .qfx .csv .pdf</p>
          <input ref="fileInput" type="file" accept=".ofx,.qfx,.csv,.txt,.pdf" hidden @change="onPick" />
        </div>
        <div>
          <p class="mb-2 text-xs uppercase tracking-wide text-taupe">Tipos suportados</p>
          <ul class="space-y-3">
            <li v-for="t in tiposInfo" :key="t.label" class="flex items-start gap-3">
              <AppIcon :name="t.icon" :size="20" class="mt-0.5 text-lime" />
              <div>
                <p class="text-sm">{{ t.label }}</p>
                <p class="text-xs text-taupe">{{ t.desc }}</p>
              </div>
            </li>
          </ul>
        </div>
      </div>
    </div>

    <!-- Mapeamento CSV -->
    <div v-if="parsed && parsed.formato === 'CSV'" class="ai-card mb-4 p-5">
      <h2 class="mb-4 font-display text-base">Mapeamento de colunas (CSV)</h2>
      <div class="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div>
          <label class="field-label">Data</label>
          <Select v-model="csvMap.dateKey" :options="headerOpts" placeholder="—" />
        </div>
        <div>
          <label class="field-label">Descrição</label>
          <Select v-model="csvMap.descKey" :options="headerOpts" placeholder="—" />
        </div>
        <div>
          <label class="field-label">Valor</label>
          <Select v-model="csvMap.valueKey" :options="headerOpts" placeholder="—" />
        </div>
        <div class="flex items-end pb-2">
          <Switch v-model="csvMap.sinalInvertido" label="Inverter sinal" />
        </div>
      </div>
      <button class="btn-ghost mt-3" @click="reaplicarCsv"><AppIcon name="refresh" :size="18" /> Reaplicar mapeamento</button>
    </div>

    <!-- Revisao -->
    <div v-if="parsed" class="ai-card p-5">
      <div class="mb-4 flex flex-wrap items-center gap-3">
        <div>
          <h2 class="font-display text-base">Revisão — {{ parsed.fileName }}</h2>
          <p class="text-xs text-taupe">
            {{ parsed.origem }} · {{ parsed.formato }} · {{ itens.length }} lançamento(s) detectado(s)
            <span v-if="parsed.tipoDoc === 'contracheque'"> · contracheque</span>
          </p>
        </div>
        <div class="ml-auto flex items-center gap-3">
          <span v-if="duplicadosCount" class="chip bg-warn/15 text-warn">{{ duplicadosCount }} duplicata(s)</span>
          <Switch v-model="ocultarDuplicados" label="Ocultar duplicatas" />
        </div>
      </div>

      <!-- resumo contracheque -->
      <div v-if="parsed.resumo" class="mb-4 flex flex-wrap items-center gap-2 rounded-xl bg-surface-2 p-3 text-sm">
        <AppIcon name="receipt_long" :size="20" class="text-lime" />
        <span v-if="parsed.resumo.proventos">Proventos: <b>{{ formatBRL(parsed.resumo.proventos) }}</b></span>
        <span v-if="parsed.resumo.descontos">· Descontos: <b>{{ formatBRL(parsed.resumo.descontos) }}</b></span>
        <span v-if="parsed.resumo.liquido">· Líquido: <b class="text-lime">{{ formatBRL(parsed.resumo.liquido) }}</b></span>
        <span v-if="!parsed.resumo.proventos && !parsed.resumo.liquido" class="text-warn">Não foi possível ler os valores — confira/edite abaixo.</span>
      </div>

      <div v-if="!itens.length" class="flex items-center gap-3 rounded-xl bg-surface-2 p-4 text-sm">
        <AppIcon name="warning" :size="20" class="text-warn" />
        Nenhum lançamento reconhecido. Tente outro formato (OFX é o mais confiável) ou cadastre manualmente.
      </div>

      <!-- tabela de revisao -->
      <div v-else class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-line text-left text-xs uppercase tracking-wide text-taupe">
              <th class="px-2 py-2"><input type="checkbox" class="accent-lime" :checked="todosSelecionados" @change="toggleTodos($event.target.checked)" /></th>
              <th class="px-2 py-2">Data</th>
              <th class="px-2 py-2">Descrição</th>
              <th class="px-2 py-2">Tipo</th>
              <th class="px-2 py-2">Categoria</th>
              <th class="px-2 py-2 text-right">Valor</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(it, i) in itensVisiveis" :key="i" class="border-b border-line/60" :class="it._dup ? 'bg-warn/[0.06]' : ''">
              <td class="px-2 py-1.5"><input v-model="it._incluir" type="checkbox" class="accent-lime" /></td>
              <td class="px-2 py-1.5"><input v-model="it.data" type="date" class="field py-1.5! text-xs!" /></td>
              <td class="px-2 py-1.5"><input v-model="it.descricao" class="field py-1.5! min-w-[180px]" /></td>
              <td class="px-2 py-1.5">
                <SegmentedControl
                  v-model="it.tipo"
                  :options="[{ value: 'receita', icon: 'south_west' }, { value: 'despesa', icon: 'north_east' }]"
                  @update:model-value="onTipoChange(it)"
                />
              </td>
              <td class="px-2 py-1.5 min-w-[160px]">
                <Select v-model="it.categoria" :options="it.tipo === 'receita' ? catReceita : catDespesa" :icon-for="iconFor" :color-for="colorFor" />
              </td>
              <td class="px-2 py-1.5">
                <input v-model.number="it.valor" type="number" step="0.01"
                  class="field py-1.5! max-w-[120px] text-right" :class="it.tipo === 'receita' ? 'text-lime' : 'text-danger'" />
              </td>
              <td class="px-2">
                <AppIcon v-if="it._dup" name="content_copy" :size="18" class="text-warn" title="Possível duplicata" />
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="mt-4 flex flex-wrap items-center gap-3">
        <p class="text-sm text-taupe">
          {{ selecionados.length }} selecionado(s) ·
          <span class="text-lime">{{ formatBRL(totalReceitaSel) }}</span> receitas ·
          <span class="text-danger">{{ formatBRL(totalDespesaSel) }}</span> despesas
        </p>
        <div class="ml-auto flex gap-2">
          <button class="btn-ghost" @click="reset">Cancelar</button>
          <button class="btn-primary" :disabled="!selecionados.length" @click="confirmar">
            <AppIcon name="check" :size="18" /> Importar {{ selecionados.length }} lançamento(s)
          </button>
        </div>
      </div>
    </div>

    <!-- Historico -->
    <div v-if="historico.length" class="ai-card mt-4 p-5">
      <h2 class="mb-3 font-display text-base">Importações desta sessão</h2>
      <ul class="space-y-2">
        <li v-for="(h, i) in historico" :key="i" class="flex items-center gap-3 text-sm">
          <AppIcon name="task_alt" :size="20" class="text-lime" />
          <div>
            <p>{{ h.fileName }}</p>
            <p class="text-xs text-taupe">{{ h.origem }} · {{ h.count }} lançamento(s) importado(s)</p>
          </div>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import Select from '@/components/ui/Select.vue'
import Switch from '@/components/ui/Switch.vue'
import SegmentedControl from '@/components/ui/SegmentedControl.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import { parseFile, remapCSV } from '@/utils/parsers'
import { useFinanceStore } from '@/stores/finance'
import { formatBRL } from '@/utils/format'
import { autoCategoria, categoryColor, categoryIcon } from '@/utils/categories'
import { useToast } from '@/composables/useToast'
import { useLoading } from '@/composables/useLoading'

const store = useFinanceStore()
const toast = useToast()
const loading = useLoading()

const fileInput = ref(null)
const dragOver = ref(false)
const parsed = ref(null)
const itens = ref([])
const ocultarDuplicados = ref(false)
const historico = ref([])
const csvMap = ref({ dateKey: null, descKey: null, valueKey: null, sinalInvertido: false })

const catReceita = computed(() => store.categoriasReceita.map((c) => c.nome))
const catDespesa = computed(() => store.categoriasDespesa.map((c) => c.nome))
const headerOpts = computed(() => parsed.value?.headers || [])

const tiposInfo = [
  { icon: 'account_balance', label: 'Extrato bancário', desc: 'OFX, CSV ou PDF' },
  { icon: 'credit_card', label: 'Fatura de cartão', desc: 'Movimentação de crédito' },
  { icon: 'receipt_long', label: 'Contracheque', desc: 'PDF — lança o salário' }
]

function pick () { fileInput.value?.click() }
function onPick (e) { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = '' }
function onDrop (e) { dragOver.value = false; const f = e.dataTransfer.files?.[0]; if (f) handleFile(f) }

async function handleFile (file) {
  loading.show('Lendo arquivo...')
  try {
    const res = await parseFile(file)
    parsed.value = res
    if (res.formato === 'CSV' && res.detected) {
      csvMap.value = { dateKey: res.detected.dateKey, descKey: res.detected.descKey, valueKey: res.detected.valueKey, sinalInvertido: false }
    }
    prepararItens(res.transactions || [])
  } catch (err) {
    console.error(err)
    toast.error('Falha ao ler o arquivo: ' + (err.message || err))
  } finally {
    loading.hide()
  }
}

function prepararItens (list) {
  itens.value = list.map((t) => ({
    ...t,
    categoria: t.sugestaoCategoria || autoCategoria(t.descricao, t.tipo),
    _incluir: true,
    _dup: store.isDuplicate(t)
  }))
}

function reaplicarCsv () {
  if (!parsed.value?.rawRows) return
  prepararItens(remapCSV(parsed.value.rawRows, csvMap.value))
  toast.info('Mapeamento reaplicado', { icon: 'refresh' })
}

function onTipoChange (it) { it.categoria = autoCategoria(it.descricao, it.tipo) }

const itensVisiveis = computed(() => ocultarDuplicados.value ? itens.value.filter((i) => !i._dup) : itens.value)
const duplicadosCount = computed(() => itens.value.filter((i) => i._dup).length)
const selecionados = computed(() => itens.value.filter((i) => i._incluir))
const totalReceitaSel = computed(() => selecionados.value.filter((i) => i.tipo === 'receita').reduce((a, i) => a + Number(i.valor || 0), 0))
const totalDespesaSel = computed(() => selecionados.value.filter((i) => i.tipo === 'despesa').reduce((a, i) => a + Number(i.valor || 0), 0))
const todosSelecionados = computed(() => itensVisiveis.value.length > 0 && itensVisiveis.value.every((i) => i._incluir))

function toggleTodos (v) { itensVisiveis.value.forEach((i) => { i._incluir = v }) }
function colorFor (n) { return categoryColor(n) }
function iconFor (n) { return categoryIcon(n) }

async function confirmar () {
  const list = selecionados.value.map((i) => ({
    data: i.data, descricao: i.descricao, valor: i.valor, tipo: i.tipo, categoria: i.categoria, origem: i.origem, externalId: i.externalId
  }))
  const fileName = parsed.value.fileName
  const origem = parsed.value.origem
  loading.show('Salvando lançamentos...')
  let inseridos = []
  try {
    inseridos = await store.addMany(list)
  } finally {
    loading.hide()
  }
  if (!inseridos.length) return
  historico.value.unshift({ fileName, origem, count: inseridos.length })
  toast.success(`${inseridos.length} lançamento(s) importado(s) com sucesso!`)
  reset()
}

function reset () {
  parsed.value = null
  itens.value = []
  ocultarDuplicados.value = false
}
</script>
