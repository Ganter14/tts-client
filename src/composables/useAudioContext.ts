import { createSharedComposable } from '@vueuse/core'
import { computed, reactive, ref } from 'vue'

/** Base64 (опционально с префиксом data URL) → сырой ArrayBuffer для decodeAudioData */
function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const payload = base64.includes(',') ? base64.slice(base64.indexOf(',') + 1) : base64
  const binary = atob(payload)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes.buffer
}

export const useAudioContext = createSharedComposable(() => {
  const audioContext = ref<AudioContext>(new AudioContext({ latencyHint: 'playback', sampleRate: 24000 }))
  const audioContextStatus = computed<AudioContextState>(() => audioContext.value.state)
  const gainNode = audioContext.value.createGain()
  gainNode.gain.value = 0.5

  gainNode.connect(audioContext.value.destination)
  const mediaDestination = ref(audioContext.value.createMediaStreamDestination())
  gainNode.connect(mediaDestination.value)

  audioContext.value.resume()
  let nextStartTime: number | null = null

  const activeSources = reactive(new Set<AudioBufferSourceNode>())
  const hasActiveSources = computed(() => activeSources.size !== 0)
  function registerSource(source: AudioBufferSourceNode, onEnded: () => void) {
    activeSources.add(source)
    source.onended = () => {
      onEnded()
      activeSources.delete(source)
    }
  }

  async function addChunk(
    chunkData: string | ArrayBuffer,
    chunkIndex: number,
    sampleRate: number
  ): Promise<{ chunkIndex: number }> {
    return new Promise((resolve, reject) => {
      try {
        const data = typeof chunkData === 'string' ? base64ToArrayBuffer(chunkData) : chunkData
        const samples = new Float32Array(data.slice(0))
        const audioBuffer = audioContext.value.createBuffer(1, samples.length, sampleRate)
        const channel = audioBuffer.getChannelData(0)
        channel.set(samples)
        const source = audioContext.value.createBufferSource()
        source.connect(gainNode)
        source.buffer = audioBuffer
        registerSource(source, () => resolve({ chunkIndex }))
        const now = audioContext.value.currentTime
        if (nextStartTime === null || nextStartTime <= now) {
          nextStartTime = now
        }
        source.start(nextStartTime)
        nextStartTime += audioBuffer.duration
      } catch (error) {
        console.error('Error decoding audio chunk:', error)
        reject(error)
      }
    })
  }

  const audioControls = {
    pause: async () => await audioContext.value.suspend(),
    resume: async () => await audioContext.value.resume(),
    stop: () => {
      for (const source of activeSources) {
        source.stop()
        source.disconnect()
      }
      activeSources.clear()
      nextStartTime = null
    }
  }

  return {
    addChunk,
    audioContext,
    audioContextStatus,
    mediaDestination,
    audioControls,
    hasActiveSources
  }
})
