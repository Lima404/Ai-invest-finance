import { reactive } from 'vue'

const state = reactive({ active: 0, message: '' })

export function useLoading () {
  return {
    state,
    show (message = 'Carregando...') {
      state.message = message
      state.active++
    },
    hide () {
      state.active = Math.max(0, state.active - 1)
    }
  }
}
