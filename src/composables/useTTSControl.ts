import { createSharedComposable } from '@vueuse/core'
import { WSMessageStart, WSMessageChunk, WSMessageEnd } from '@api/model'
import { useAudioContext } from './useAudioContext'
import { useTTSWebsocket } from './useTTSWebsocket'
import { useLipsync } from './useLipsync'

export const useTTSControl = createSharedComposable(() => {
  const { addChunk, mediaDestination } = useAudioContext()
  const { open, close, status: websocketStatus } = useTTSWebsocket(onWebsocketStart, onWebsocketChunk, onWebsocketEnd)
  const { lipsync, connectLipsyncToStream, startLipsyncLoop, stopLipsyncLoop, dispose, lipsyncStatus, initLipsync } =
    useLipsync()

  function onWebsocketStart(data: WSMessageStart) {
    console.log('Start:', data.request_id)
  }

  function onWebsocketChunk(data: WSMessageChunk) {
    lipsync.value.audioContext.resume()
    addChunk(data.chunk_data, data.chunk_index, Number(data.sr))
  }

  function onWebsocketEnd(data: WSMessageEnd) {
    console.log('End:', data.request_id)
  }

  const startTTS = () => {
    open()
  }
  const stopTTS = () => {
    close()
  }
  const startLipsync = () => {
    initLipsync()
    connectLipsyncToStream(mediaDestination.value.stream)
    startLipsyncLoop()
  }
  const stopLipsync = () => {
    stopLipsyncLoop()
    dispose()
  }
  return {
    startTTS,
    stopTTS,
    startLipsync,
    stopLipsync,
    ttsStatus: websocketStatus,
    lipsyncStatus
  }
})
