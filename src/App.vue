<script setup lang="ts">
import { useWebsocket } from '@/composables/useWebsocket'
import { useAudioContext } from '@/composables/useAudioContext'

const { addChunk } = useAudioContext()
let chunkIndex = 0

const { connect, status } = useWebsocket('ws://localhost:8000/ws', async event => {
  console.log('new message')
  if (event.data instanceof Blob) {
    addChunk(event.data, chunkIndex)
    chunkIndex++
  }
})
connect()
</script>

<template>
  <div>
    <div>Test Electron + Vue</div>
  </div>
</template>
