<script setup lang="ts">
import { useTTSControl } from '@/composables';

const { startTTS, stopTTS, startLipsync, stopLipsync, ttsStatus, lipsyncStatus } = useTTSControl()

function ttsToggle() {
  if (ttsStatus.value === 'OPEN') {
    stopTTS()
  } else {
    startTTS()
  }
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
  <div class="d-flex">
    <v-btn @click="ttsToggle" class="mr-2">TTS: {{ ttsStatus === 'OPEN' ? 'Stop' : 'Start' }}</v-btn>
    <v-btn @click="lipsyncToggle">Lipsync: {{ lipsyncStatus ? 'Stop' : 'Start' }}</v-btn>
  </div>
</template>
