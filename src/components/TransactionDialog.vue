<template>
  <Modal
    :open="open"
    @update:open="$emit('update:open', $event)"
    :title="editId ? 'Editar lançamento' : (form.tipo === 'receita' ? 'Nova receita' : 'Nova despesa')"
    description="Formulário de lançamento financeiro"
  >
    <div class="space-y-4">
      <SegmentedControl
        v-model="form.tipo"
        full-width
        :options="[
          { value: 'receita', label: 'Entrada (receita)', icon: 'south_west' },
          { value: 'despesa', label: 'Saída (despesa)', icon: 'north_east' }
        ]"
      />

      <div>
        <label class="field-label">Descrição</label>
        <input v-model="form.descricao" class="field" placeholder="Ex.: Salário, Mercado, Uber..." />
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="field-label">Valor (R$)</label>
          <input v-model.number="form.valor" type="number" min="0" step="0.01" class="field" placeholder="0,00" />
        </div>
        <div>
          <label class="field-label">Data</label>
          <input v-model="form.data" type="date" class="field" />
        </div>
      </div>

      <div>
        <label class="field-label">Categoria</label>
        <Select v-model="form.categoria" :options="categoriaOptions" :icon-for="iconFor" :color-for="colorFor" placeholder="Selecione a categoria" />
      </div>

      <div>
        <label class="field-label">Observação (opcional)</label>
        <textarea v-model="form.observacao" rows="2" class="field resize-none" />
      </div>
    </div>

    <template #footer>
      <button class="btn-ghost" @click="$emit('update:open', false)">Cancelar</button>
      <button class="btn-primary" :disabled="!valido" @click="salvar">{{ editId ? 'Salvar' : 'Adicionar' }}</button>
    </template>
  </Modal>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import Modal from '@/components/ui/Modal.vue'
import Select from '@/components/ui/Select.vue'
import SegmentedControl from '@/components/ui/SegmentedControl.vue'
import { useFinanceStore } from '@/stores/finance'
import { categoryColor, categoryIcon } from '@/utils/categories'
import { toISODate } from '@/utils/format'
import { useToast } from '@/composables/useToast'

const props = defineProps({
  open: Boolean,
  tipoInicial: { type: String, default: 'despesa' },
  edit: { type: Object, default: null }
})
const emit = defineEmits(['update:open'])

const store = useFinanceStore()
const toast = useToast()
const editId = ref(null)
const form = ref(blank(props.tipoInicial))

function blank (tipo) {
  return { tipo: tipo || 'despesa', descricao: '', valor: null, data: toISODate(new Date()), categoria: '', observacao: '' }
}

const categoriaOptions = computed(() =>
  (form.value.tipo === 'receita' ? store.categoriasReceita : store.categoriasDespesa).map((c) => c.nome)
)
const valido = computed(() => form.value.descricao && Number(form.value.valor) > 0 && form.value.data)

function iconFor (n) { return categoryIcon(n) }
function colorFor (n) { return categoryColor(n) }

watch(() => form.value.tipo, () => {
  if (!categoriaOptions.value.includes(form.value.categoria)) {
    form.value.categoria = categoriaOptions.value[categoriaOptions.value.length - 1]
  }
})

watch(() => props.open, (open) => {
  if (!open) return
  if (props.edit) {
    editId.value = props.edit.id
    form.value = {
      tipo: props.edit.tipo,
      descricao: props.edit.descricao,
      valor: props.edit.valor,
      data: props.edit.data,
      categoria: props.edit.categoria,
      observacao: props.edit.observacao || ''
    }
  } else {
    editId.value = null
    form.value = blank(props.tipoInicial)
    form.value.categoria = categoriaOptions.value[categoriaOptions.value.length - 1]
  }
})

function salvar () {
  if (!valido.value) return
  if (editId.value) {
    store.update(editId.value, { ...form.value })
    toast.success('Lançamento atualizado')
  } else {
    store.add({ ...form.value })
    toast.success('Lançamento adicionado')
  }
  emit('update:open', false)
}
</script>
