import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  { path: '/', component: () => import('@/views/Main.vue'), name: 'main' },
  { path: '/settings', component: () => import('@/views/Settings.vue'), name: 'settings' },
  { path: '/playlist', component: () => import('@/views/Playlist.vue'), name: 'playlist' }
]

export const router = createRouter({
  history: createWebHistory(),
  routes
})
