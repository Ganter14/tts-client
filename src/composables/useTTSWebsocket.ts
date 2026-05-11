import { WSMessageChunk, WSMessageEnd, WSMessageStart, WSMessageType } from '@api/model'
import { useWebSocket, createSharedComposable } from '@vueuse/core'
import { useUserSettings } from './useUserSettings'
import { ref } from 'vue'

export const useTTSWebsocket = createSharedComposable(
  (
    onStart?: (data: WSMessageStart) => void,
    onChunk?: (data: WSMessageChunk) => void,
    onEnd?: (data: WSMessageEnd) => void
  ) => {
    const onStartCallback = ref(onStart ?? (() => {}))
    const onChunkCallback = ref(onChunk ?? (() => {}))
    const onEndCallback = ref(onEnd ?? (() => {}))
    const isConnected = ref(false)
    const isError = ref(false)

    const { clientId } = useUserSettings()
    const { open, close, status } = useWebSocket(`ws://localhost:8000/api/ws?client_id=${clientId.value}`, {
      immediate: false,
      autoReconnect: {
        retries: 5,
        delay: retries => Math.min(1000 * 2 ** (retries - 1), 30000)
      },
      onConnected(_ws) {
        console.log('Connected to TTS websocket!')
        isConnected.value = true
      },
      onDisconnected(_ws, event) {
        console.log('Disconnected from TTS websocket!', event.code)
        isConnected.value = false
      },
      onError(_ws, event) {
        console.error('Error on TTS websocket:', event)
        isError.value = true
        isConnected.value = status.value === 'OPEN'
      },
      onMessage(_ws, event) {
        const data = JSON.parse(event.data) as WSMessageChunk | WSMessageEnd | WSMessageStart
        if (data.type === WSMessageType.tts_start) {
          onStartCallback.value(data)
        } else if (data.type === WSMessageType.audio_chunk) {
          onChunkCallback.value(data)
        } else if (data.type === WSMessageType.tts_end) {
          onEndCallback.value(data)
        }
      }
    })

    return {
      connect: open,
      disconnect: close,
      onStart: onStartCallback,
      onChunk: onChunkCallback,
      onEnd: onEndCallback,
      status,
      isConnected,
      isError
    }
  }
)
