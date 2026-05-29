const routes = [
  {
    path: '/login',
    name: 'login',
    component: () => import('@/pages/LoginPage.vue'),
    meta: { public: true }
  },
  {
    path: '/',
    component: () => import('@/layouts/MainLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      { path: '', name: 'dashboard', component: () => import('@/pages/DashboardPage.vue') },
      { path: 'receitas', name: 'receitas', component: () => import('@/pages/ReceitasPage.vue') },
      { path: 'despesas', name: 'despesas', component: () => import('@/pages/DespesasPage.vue') },
      { path: 'orcamento', name: 'orcamento', component: () => import('@/pages/OrcamentoPage.vue') },
      { path: 'importar', name: 'importar', component: () => import('@/pages/ImportacaoPage.vue') },
      { path: 'categorias', name: 'categorias', component: () => import('@/pages/CategoriasPage.vue') }
    ]
  },
  { path: '/:catchAll(.*)*', component: () => import('@/pages/ErrorNotFound.vue') }
]

export default routes
