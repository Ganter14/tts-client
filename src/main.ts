import { createApp } from 'vue'

import vuetify from '@/plugins/vuetify'

import App from './App.vue'
import { router } from './router'

createApp(App)
  .use(router)
  .use(vuetify)
  .mount('#app')
  .$nextTick(() => {
    postMessage({ payload: 'removeLoading' }, '*')
  })
