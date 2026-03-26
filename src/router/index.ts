import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  { path: '/', component: () => import('@/views/Main.vue'), name: 'main' },
  { path: '/settings', component: () => import('@/views/Settings.vue'), name: 'settings' }
]

export const router = createRouter({
  history: createWebHistory(),
  routes
})
