import '@mdi/font/css/materialdesignicons.css'
import 'vuetify/styles'
import { createVuetify, VuetifyOptions } from 'vuetify'
import { ru } from 'vuetify/locale'

const vuetifyOptions: VuetifyOptions = {
  locale: {
    locale: 'ru',
    messages: { ru }
  },
  defaults: {
    VBtn: {
      variant: 'flat'
    }
  }
}

export default createVuetify(vuetifyOptions)
