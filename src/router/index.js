import { createRouter, createWebHashHistory } from 'vue-router'
import routes from './routes'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHashHistory(),
  routes,
  scrollBehavior: () => ({ left: 0, top: 0 })
})

// Guarda de autenticacao
router.beforeEach((to) => {
  const auth = useAuthStore()

  // rotas que exigem login
  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return { name: 'login', query: to.fullPath !== '/' ? { redirect: to.fullPath } : {} }
  }

  // ja logado tentando acessar /login -> manda pro dashboard
  if (to.name === 'login' && auth.isAuthenticated) {
    return { name: 'dashboard' }
  }

  return true
})

export default router
