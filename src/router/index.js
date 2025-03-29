import { createRouter, createWebHistory } from 'vue-router'
import { supabase } from '../lib/supabase'

import LoginView from '../views/LoginView.vue'
import RegisterView from '../views/RegisterView.vue'
import HomeView from '../views/HomeView.vue'
import ListaDetalleView from '../views/ListaDetalleView.vue'

const routes = [
  { path: '/', name: 'Login', component: LoginView },
  { path: '/register', component: RegisterView },
  { path: '/home', name: 'Home', component: HomeView, meta: { requiresAuth: true } },
  { path: '/listas/:id', name: 'ListaDetalle', component: ListaDetalleView, meta: { requiresAuth: true } },
  { path: '/:pathMatch(.*)*', redirect: '/' }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 🔐 Verifica sesión antes de entrar a rutas protegidas
router.beforeEach(async (to, from, next) => {
  if (!to.meta.requiresAuth) {
    return next()
  }

  const { data } = await supabase.auth.getSession()
  const user = data.session?.user

  if (!user) {
    return next('/') // Si no está autenticado, redirige al login
  }

  return next()
})

export default router
