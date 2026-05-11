<script setup lang="ts">
import { useTTSController, useVTubeStudioAPI } from '@/composables';

const { startTTS, stopTTS, ttsStatus, startLipsync, stopLipsync, lipsyncStatus } = useTTSController()
const { isAuthenticated, status: vtsStatus, open: openVTS } = useVTubeStudioAPI()

function ttsToggle() {
  if (ttsStatus.value === 'OPEN') {
    stopTTS()
  } else {
    startTTS()
  }
}

function connectToVTS() {
  openVTS()
}

function lipsyncToggle() {
  if (lipsyncStatus.value) {
    stopLipsync()
  } else {
    startLipsync()
  }
}
</script>

<template>
  <div class="d-flex mb-5">
    <v-btn @click="ttsToggle" class="mr-2">TTS: {{ ttsStatus === 'OPEN' ? 'Stop' : 'Start' }}</v-btn>
    <v-btn @click="lipsyncToggle" class="mr-2">Lipsync: {{ lipsyncStatus ? 'Stop' : 'Start' }}</v-btn>
  </div>

  <div class="d-flex align-center">
    <div class="mr-2">
      <p>
        VTS: {{ isAuthenticated ? 'Authenticated' : 'Not Authenticated' }}
      </p>
      <p>Connection status: {{ vtsStatus === 'OPEN' ? 'Connected' : 'Disconnected' }}</p>
    </div>
    <v-btn @click="connectToVTS()" :disabled="vtsStatus === 'OPEN'">Connect to VTS</v-btn>
  </div>
</template>
