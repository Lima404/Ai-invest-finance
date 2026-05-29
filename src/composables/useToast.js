import { reactive } from 'vue'

let seq = 0
const state = reactive({ items: [] })

function push (message, opts = {}) {
  const id = ++seq
  state.items.push({
    id,
    message,
    variant: opts.variant || 'default', // default | success | error | warning
    icon: opts.icon
  })
  setTimeout(() => dismiss(id), opts.timeout || 3200)
  return id
}

function dismiss (id) {
  const i = state.items.findIndex((t) => t.id === id)
  if (i !== -1) state.items.splice(i, 1)
}

export function useToast () {
  return {
    state,
    dismiss,
    notify: push,
    success: (m, o = {}) => push(m, { ...o, variant: 'success', icon: o.icon || 'check_circle' }),
    error: (m, o = {}) => push(m, { ...o, variant: 'error', icon: o.icon || 'error' }),
    warning: (m, o = {}) => push(m, { ...o, variant: 'warning', icon: o.icon || 'warning' }),
    info: (m, o = {}) => push(m, { ...o, variant: 'default', icon: o.icon || 'info' })
  }
}
