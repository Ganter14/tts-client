import { createSharedComposable, useLocalStorage } from '@vueuse/core'

export const useUserSettings = createSharedComposable(() => {
  const clientId = useLocalStorage('clientId', 'test')
  const vtsAuthenticationToken = useLocalStorage('vtsAuthenticationToken', '')
  const vtsPort = useLocalStorage('vtsPort', '8001')
  const vtsAddress = useLocalStorage('vtsAddress', 'localhost')
  return {
    clientId,
    vtsAuthenticationToken,
    vtsPort,
    vtsAddress
  }
})
