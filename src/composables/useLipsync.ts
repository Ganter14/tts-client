import { ref, Ref, shallowRef } from 'vue'
import { Lipsync, VISEMES } from 'wawa-lipsync'
import { createSharedComposable } from '@vueuse/core'

type LipsyncRuntime = {
  audioContext: AudioContext
  analyser: AnalyserNode
  processAudio: () => void
  viseme: VISEMES
}

export const useLipsync = createSharedComposable(() => {
  const lipsync = shallowRef(new Lipsync() as unknown as LipsyncRuntime)
  let lipsyncInput: MediaStreamAudioSourceNode | null = null
  const viseme: Ref<VISEMES> = ref(lipsync.value.viseme)
  const lipsyncStatus = ref(false)
  const needInit = ref(false)
  let rafId = 0

  function initLipsync() {
    if (!needInit.value) return
    lipsync.value = new Lipsync() as unknown as LipsyncRuntime
    viseme.value = lipsync.value.viseme
    lipsyncStatus.value = false
    rafId = 0
    lipsyncInput = null
    needInit.value = false
  }

  function connectLipsyncToStream(stream: MediaStream) {
    lipsync.value.audioContext.resume()
    lipsyncInput?.disconnect()
    lipsyncInput = lipsync.value.audioContext.createMediaStreamSource(stream)
    lipsyncInput.connect(lipsync.value.analyser)
  }

  function startLipsyncLoop() {
    lipsyncStatus.value = true
    const tick = () => {
      lipsync.value.processAudio()
      viseme.value = lipsync.value.viseme
      if (viseme.value !== VISEMES.sil) {
        console.log('viseme', viseme.value)
      }
      rafId = requestAnimationFrame(tick)
    }
    rafId = requestAnimationFrame(tick)
  }

  function stopLipsyncLoop() {
    lipsyncStatus.value = false
    cancelAnimationFrame(rafId)
    rafId = 0
    needInit.value = true
  }

  function dispose() {
    stopLipsyncLoop()
    lipsyncInput?.disconnect()
    lipsyncInput = null
    lipsync.value.audioContext.close()
  }

  return {
    lipsync,
    viseme,
    connectLipsyncToStream,
    startLipsyncLoop,
    stopLipsyncLoop,
    dispose,
    lipsyncStatus,
    initLipsync
  }
})
