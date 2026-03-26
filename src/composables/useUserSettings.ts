import { createSharedComposable, useLocalStorage } from '@vueuse/core'

export const useUserSettings = createSharedComposable(() => {
  const clientId = useLocalStorage('clientId', 'test')
  return {
    clientId
  }
})
