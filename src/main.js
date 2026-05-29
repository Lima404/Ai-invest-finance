import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { useAuthStore } from './stores/auth'
import './assets/styles/main.css'

const app = createApp(App)
const pinia = createPinia()
app.use(pinia)

// Resolve a sessao existente ANTES de instalar o router,
// para a guarda de rota ja conhecer o estado de login no 1o carregamento.
const auth = useAuthStore(pinia)
auth.init().finally(() => {
  app.use(router)
  app.mount('#app')
})
