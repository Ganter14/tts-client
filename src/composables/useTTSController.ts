import { createSharedComposable } from '@vueuse/core'
import { WSMessageStart, WSMessageChunk, WSMessageEnd } from '@api/model'
import { useAudioQueue, useAudioContext, useTTSWebsocket, useLipsync, useVTubeStudioAPI } from '@/composables'

export const useTTSController = createSharedComposable(() => {
  const {
    connect: connectTTS,
    disconnect: disconnectTTS,
    onStart: onTTSStartMessage,
    onChunk: onTTSChunkMessage,
    onEnd: onTTSEndMessage,
    status: websocketStatus,
    isConnected: isTTSConnected,
    isError: isTTSError
  } = useTTSWebsocket()
  const { addChunk: addChunkToAudioContext, mediaDestination } = useAudioContext()
  const { addAudioItem, removeItem, addChunk: addChunkToQueue } = useAudioQueue()
  const {
    open: connectVTS,
    close: disconnectVTS,
    status: vtsStatus,
    isConnected: isVTSConnected,
    isError: isVTSError
  } = useVTubeStudioAPI()
  const { lipsync, connectLipsyncToStream, startLipsyncLoop, stopLipsyncLoop, dispose, lipsyncStatus, initLipsync } =
    useLipsync()

  function onTTSStart(data: WSMessageStart) {
    console.log('Start:', data.request_id)
    addAudioItem(data.request_id, data.request_id, data.request_id)
  }

  function onTTSChunk(data: WSMessageChunk) {
    addChunkToQueue(data)
    // lipsync.value.audioContext.resume()
    // addChunkToAudioContext(data.chunk_data, data.chunk_index, Number(data.sr))
  }

  function onTTSEnd(data: WSMessageEnd) {
    console.log('End:', data.request_id)
  }
  onTTSStartMessage.value = onTTSStart
  onTTSChunkMessage.value = onTTSChunk
  onTTSEndMessage.value = onTTSEnd
  connectTTS()

  const startTTS = () => {
    connectTTS()
  }
  const stopTTS = () => {
    disconnectTTS()
  }
  const connectToVTS = () => {
    connectVTS()
  }
  const disconnectFromVTS = () => {
    disconnectVTS()
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
    ttsStatus: websocketStatus,
    connectToVTS,
    disconnectFromVTS,
    vtsStatus,
    startLipsync,
    stopLipsync,
    lipsyncStatus
  }
})
