import { createSharedComposable } from '@vueuse/core'
import { computed, Ref, ref, shallowRef } from 'vue'
import { Lipsync, VISEMES } from 'wawa-lipsync'

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

  const addChunk = async (chunkData: string | ArrayBuffer, chunkIndex: number, sampleRate: number) => {
    try {
      const data = typeof chunkData === 'string' ? base64ToArrayBuffer(chunkData) : chunkData
      const samples = new Float32Array(data.slice(0))
      const audioBuffer = audioContext.value.createBuffer(1, samples.length, sampleRate)
      const channel = audioBuffer.getChannelData(0)
      channel.set(samples)
      const source = audioContext.value.createBufferSource()
      source.connect(gainNode)
      source.buffer = audioBuffer

      // Синхронизация времени: планируем запуск на основе времени окончания предыдущего чанка
      const now = audioContext.value.currentTime

      // Если это первый чанк или произошел пропуск, устанавливаем время с небольшим буфером
      if (nextStartTime === null || nextStartTime <= now) {
        nextStartTime = now
      }

      source.start(nextStartTime)
      // Обновляем время для следующего чанка
      nextStartTime += audioBuffer.duration
    } catch (error) {
      console.error('Error decoding audio chunk:', error)
    }
  }

  return {
    addChunk,
    mediaDestination
  }
})
