import { computed, ref } from 'vue'

export const useAudioContext = () => {
  const audioContext = ref<AudioContext>(new AudioContext({ latencyHint: 'interactive', sampleRate: 24000 }))
  const gainNode = audioContext.value.createGain()
  gainNode.connect(audioContext.value.destination)
  gainNode.gain.value = 0.5
  const audioContextStatus = computed<AudioContextState>(() => audioContext.value.state)

  const audioBuffers = ref<{ index: number; buffer: AudioBuffer }[]>([])
  audioContext.value.resume()
  const isPlaying = ref(false)

  const lookAhead = 0.03 // 30ms: небольшой запас на подготовку
  const scheduleHorizon = 0.25 // планируем вперёд на ~250ms
  const nextStartTime = ref<number | null>(null)
  let schedulerTimer: number | null = null

  const startScheduler = () => {
    if (schedulerTimer != null) return
    // Тикер подбрасывает новые буферы в таймлайн
    schedulerTimer = window.setInterval(() => {
      schedulePending()
    }, Math.max(10, Math.floor((lookAhead * 1000) / 2)))
  }

  const stopScheduler = () => {
    if (schedulerTimer != null) {
      clearInterval(schedulerTimer)
      schedulerTimer = null
    }
  }

  const addChunk = async (blob: Blob, chunkIndex: number) => {
    try {
      const wavData = await blob.arrayBuffer()
      const audioBuffer = await audioContext.value.decodeAudioData(wavData)
      audioBuffers.value.push({ index: chunkIndex, buffer: audioBuffer })
      audioBuffers.value.sort((a, b) => a.index - b.index)

      if (!isPlaying.value) {
        startPlayback()
      }
      schedulePending()
    } catch (error) {
      console.error('Error decoding audio chunk:', error)
    }
  }

  const startPlayback = () => {
    if (isPlaying.value) return
    isPlaying.value = true

    // Первое запланированное время старта — немного в будущем
    const now = audioContext.value.currentTime
    nextStartTime.value = now + lookAhead

    startScheduler()
    schedulePending()
  }

  const schedulePending = () => {
    if (!isPlaying.value) return
    if (audioBuffers.value.length === 0) return
    if (nextStartTime.value == null) {
      nextStartTime.value = audioContext.value.currentTime + lookAhead
    }

    const now = audioContext.value.currentTime
    // Планируем вперёд до горизонта
    while (audioBuffers.value.length > 0 && nextStartTime.value < now + scheduleHorizon) {
      const item = audioBuffers.value.shift()!
      const source = audioContext.value.createBufferSource()
      source.buffer = item.buffer
      source.connect(gainNode)

      // Стартуем без смещения; ставим начало не в прошлое
      const when = Math.max(nextStartTime.value, now + lookAhead)
      source.start(when)

      // Следующее окно старта = конец только что запланированного
      nextStartTime.value = when + item.buffer.duration - 0.005
    }
  }

  return {
    addChunk
  }
}
