import { createRouter, createWebHistory } from 'vue-router'
import { supabase } from '../lib/supabase'

import LoginView from '../views/LoginView.vue'
import RegisterView from '../views/RegisterView.vue'
import HomeView from '../views/HomeView.vue'

const routes = [
  { path: '/', name: 'Login', component: LoginView },
  { path: '/register', component: RegisterView },
  { path: '/home', name: 'Home', component: HomeView, meta: { requiresAuth: true } },
  { path: '/:pathMatch(.*)*', redirect: '/' }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 🔐 Verifica sesión antes de entrar a rutas protegidas
router.beforeEach(async (to, from, next) => {
  const { data } = await supabase.auth.getSession()
  const user = data.session?.user

  // 🔐 Evitar acceso a login y register si ya está autenticado
  if ((to.path === '/' || to.path === '/register') && user) {
    return next('/home')
  }

  // 🔐 Proteger rutas que requieren autenticación
  if (to.meta.requiresAuth && !user) {
    return next('/')
  }

  return next()
})

export default router
