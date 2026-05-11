import { createSharedComposable } from '@vueuse/core'
import { AudioQueueItem, useAudioContext, useAudioQueue, isAsyncArrayAbortError } from '@/composables'
import { ref } from 'vue'

export const useAudioPlayer = createSharedComposable(() => {
  const {
    audioContext,
    hasActiveSources,
    addChunk: addChunkToAudioContext,
    audioContextStatus,
    audioControls: audioContextControls
  } = useAudioContext()
  const { getNextAudioItem } = useAudioQueue()
  const currentAudioItem = ref<AudioQueueItem | null>(null)
  const currentRequestId = ref<string | null>(null)
  const isPlayingStream = ref(false)
  let streamAbortController: AbortController | null = null

  const stopPlayback = () => {
    isPlayingStream.value = false
    streamAbortController?.abort()
    currentAudioItem.value?.abortController.abort()
    audioContextControls.stop()
    currentAudioItem.value?.markComplete()
    currentRequestId.value = null
  }

  const skipCurrentItem = async () => {
    currentAudioItem.value?.abortController.abort()
    audioContextControls.stop()
    await audioContextControls.resume()
  }

  const playChunks = async (audioItem: AudioQueueItem) => {
    currentAudioItem.value = audioItem
    audioItem.reset()
    if (audioContext.value.state === 'suspended') await audioContext.value.resume()
    audioItem.markPlaying()
    const promises = []
    try {
      const chunksGenerator = audioItem.getChunks(true)
      while (true) {
        if (audioItem.abortController.signal.aborted) {
          break
        }
        const { value: chunk, done } = await chunksGenerator.next()
        if (done) break
        if (chunk) promises.push(addChunkToAudioContext(chunk.chunk_data, chunk.chunk_index, parseInt(chunk.sr)))
      }
    } catch (e) {
      if (isAsyncArrayAbortError(e)) console.log('Play chunks aborted')
    } finally {
      await Promise.all(promises)
      audioItem.markComplete()
    }
  }

  const playSingleRequest = async (audioItem: AudioQueueItem) => {
    stopPlayback()
    await playChunks(audioItem)
  }

  const playMessagesStream = async (audioItem?: AudioQueueItem) => {
    audioContextControls.stop()
    isPlayingStream.value = true
    streamAbortController?.abort()
    streamAbortController = new AbortController()
    const fromRequestId = audioItem?.requestId
    const gen = getNextAudioItem(fromRequestId, streamAbortController.signal)
    try {
      while (true) {
        const { value: audioItem } = await gen.next()
        await playChunks(audioItem)
      }
    } catch (e) {
      if (isAsyncArrayAbortError(e)) {
        isPlayingStream.value = false
      }
    }
  }

  return {
    isPlaying: hasActiveSources,
    isPlayingStream,
    playSingleRequest,
    playMessagesStream,
    currentRequestId,
    audioContextStatus,
    playbackControls: {
      pause: audioContextControls.pause,
      resume: audioContextControls.resume,
      skip: skipCurrentItem,
      stop: stopPlayback
    }
  }
})
