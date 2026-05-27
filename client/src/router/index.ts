import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('../views/HomeView.vue'),
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/LoginView.vue'),
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('../views/RegisterView.vue'),
    },
    {
      path: '/levels/:world',
      name: 'level-select',
      component: () => import('../views/LevelSelectView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/game/:world/:level',
      name: 'game',
      component: () => import('../views/GameView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/select/:world/:level',
      name: 'plant-select',
      component: () => import('../views/PlantSelectView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/shop',
      name: 'shop',
      component: () => import('../views/ShopView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/rank',
      name: 'rank',
      component: () => import('../views/RankView.vue'),
    },
    {
      path: '/profile',
      name: 'profile',
      component: () => import('../views/ProfileView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/guide',
      name: 'plant-guide',
      component: () => import('../views/PlantGuideView.vue'),
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/',
    },
  ],
})

router.beforeEach((to, _from, next) => {
  if (to.meta.requiresAuth) {
    const auth = useAuthStore()
    if (!auth.isLoggedIn) {
      return next('/login')
    }
  }
  next()
})

export default router
