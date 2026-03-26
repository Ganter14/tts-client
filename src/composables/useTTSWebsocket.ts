import { WSMessageChunk, WSMessageEnd, WSMessageStart, WSMessageType } from '@api/model'
import { useWebSocket, createSharedComposable } from '@vueuse/core'
import { useUserSettings } from './useUserSettings'

export const useTTSWebsocket = createSharedComposable(
  (
    onStart: (data: WSMessageStart) => void,
    onChunk: (data: WSMessageChunk) => void,
    onEnd: (data: WSMessageEnd) => void
  ) => {
    const { clientId } = useUserSettings()
    const { open, close, status } = useWebSocket(`ws://localhost:8000/api/ws?client_id=${clientId.value}`, {
      onConnected(_ws) {
        console.log('Connected!')
      },
      onDisconnected(_ws, event) {
        console.log('Disconnected!', event.code)
      },
      onError(_ws, event) {
        console.error('Error:', event)
      },
      onMessage(_ws, event) {
        const data = JSON.parse(event.data) as WSMessageChunk | WSMessageEnd | WSMessageStart
        if (data.type === WSMessageType.tts_start) {
          onStart(data)
        } else if (data.type === WSMessageType.audio_chunk) {
          onChunk(data)
        } else if (data.type === WSMessageType.tts_end) {
          onEnd(data)
        }
      }
    })

    return {
      open,
      close,
      status
    }
  }
)
