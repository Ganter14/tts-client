import { computed, ref, Ref, shallowRef } from 'vue'
import { Lipsync, VISEMES } from 'wawa-lipsync'
import { createSharedComposable } from '@vueuse/core'
import { clamp, lerp, smoothstep } from '@/utils/math'
import { useVTubeStudioAPI } from './useVTubeStudioAPI'

type LipsyncRuntime = {
  features: Lipsync['features']
  audioContext: AudioContext
  analyser: AnalyserNode
  processAudio: () => void
  viseme: VISEMES
}

const visemeToVtsMap: Record<VISEMES, { mouthOpen: number; mothForm: number }> = {
  [VISEMES.sil]: {
    mothForm: 0.5,
    mouthOpen: 0
  },
  [VISEMES.PP]: {
    mothForm: 0.4,
    mouthOpen: 0
  },
  [VISEMES.FF]: {
    mothForm: 0.45,
    mouthOpen: 0.15
  },
  [VISEMES.TH]: {
    mothForm: -0.6,
    mouthOpen: 0.4
  },
  [VISEMES.DD]: {
    mothForm: -0.6,
    mouthOpen: 0.65
  },
  [VISEMES.kk]: {
    mothForm: -0.26,
    mouthOpen: 0.65
  },
  [VISEMES.CH]: {
    mothForm: -0.9,
    mouthOpen: 0.55
  },
  [VISEMES.SS]: {
    mothForm: -2,
    mouthOpen: 0.05
  },
  [VISEMES.nn]: {
    mothForm: 0.05,
    mouthOpen: 0.5
  },
  [VISEMES.RR]: {
    mothForm: -2,
    mouthOpen: 0.2
  },
  [VISEMES.aa]: {
    mothForm: 0.35,
    mouthOpen: 0.5
  },
  [VISEMES.E]: {
    mothForm: 1,
    mouthOpen: 0.3
  },
  [VISEMES.I]: {
    mothForm: 0.25,
    mouthOpen: 0.3
  },
  [VISEMES.O]: {
    mothForm: -0.8,
    mouthOpen: 0.9
  },
  [VISEMES.U]: {
    mothForm: -1.35,
    mouthOpen: 0.3
  }
}

export const useLipsync = createSharedComposable(() => {
  const { injectParameterData, status: vtsStatus, isAuthenticated: vtsIsAuthenticated } = useVTubeStudioAPI()
  const vtsConnected = computed(() => vtsStatus.value === 'OPEN' && vtsIsAuthenticated.value)
  const lipsync = shallowRef(new Lipsync() as unknown as LipsyncRuntime)
  let lipsyncInput: MediaStreamAudioSourceNode | null = null
  const viseme: Ref<VISEMES> = ref(VISEMES.sil)
  const lipsyncStatus = ref(false)
  const needInit = ref(false)
  let rafId = 0
  const mouthOpen = ref(0)
  const mothForm = ref(0)

  function initLipsync() {
    if (!needInit.value) return
    lipsync.value = new Lipsync({ fftSize: 1024, historySize: 10 }) as unknown as LipsyncRuntime
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
        console.log('Viseme:', viseme.value)
      }
      if (vtsConnected.value) {
        const { mouthOpen: targetMouthOpen, mothForm: targetMouthForm } = visemeToVtsMap[lipsync.value.viseme]
        const newMouthOpen = lerp(mouthOpen.value, targetMouthOpen, 0.5)
        const newMothForm = lerp(mothForm.value, targetMouthForm, 0.5)
        mouthOpen.value = newMouthOpen
        mothForm.value = newMothForm
        injectParameterData(newMouthOpen, newMothForm)
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
