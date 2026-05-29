import { reactive } from 'vue'

const state = reactive({
  open: false,
  title: '',
  message: '',
  okLabel: 'Confirmar',
  cancelLabel: 'Cancelar',
  danger: false,
  _resolve: null
})

// Uso: const ok = await confirm({ title, message, danger: true })
export function confirm (opts = {}) {
  state.title = opts.title || 'Confirmar ação'
  state.message = opts.message || ''
  state.okLabel = opts.okLabel || 'Confirmar'
  state.cancelLabel = opts.cancelLabel || 'Cancelar'
  state.danger = !!opts.danger
  state.open = true
  return new Promise((resolve) => {
    state._resolve = resolve
  })
}

export function _settle (value) {
  state.open = false
  if (state._resolve) state._resolve(value)
  state._resolve = null
}

export function useConfirmState () {
  return state
}
