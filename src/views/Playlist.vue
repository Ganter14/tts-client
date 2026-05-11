<script setup lang="ts">
import { useAudioQueue, useAudioPlayer } from '@/composables';

const { audioQueue } = useAudioQueue()
const { playSingleRequest, isPlaying, currentRequestId, playbackControls, playMessagesStream, isPlayingStream } = useAudioPlayer()
</script>

<template>
  <div>
    <v-empty-state v-if="!audioQueue.items.length" title="Нет сообщений"/>
    <p>currentRequestId: {{ currentRequestId }}</p>
    <p>isPlaying: {{ isPlaying }}</p>
    <p>isPlayingStream: {{ isPlayingStream }}</p>

    <v-row>
      <v-col>
        <v-btn @click="playMessagesStream()">start stream</v-btn>
      </v-col>
      <v-col>
        <v-btn @click="playbackControls.pause()">pause</v-btn>
      </v-col>
      <v-col>
        <v-btn @click="playbackControls.resume()">resume</v-btn>
      </v-col>
      <v-col>
        <v-btn @click="playbackControls.skip()">skip</v-btn>
      </v-col>
      <v-col>
        <v-btn @click="playbackControls.stop()">stop</v-btn>
      </v-col>
    </v-row>
    <div class="d-flex flex-column-reverse ga-1 my-2">
      <v-card v-for="audioItem in audioQueue.items" :key="audioItem.requestId">
        <v-card-text>
          <p>{{ audioItem.requestId }}</p>
          <p>{{ audioItem.isAllChunksReady }}</p>
          <p>{{ audioItem.status }}</p>
        </v-card-text>
        <v-card-actions>
          <v-btn color="primary" variant="flat" @click="playSingleRequest(audioItem)" :loading="audioItem.status === 'playing'">Воспроизвести</v-btn>
          <v-btn color="secondary" variant="flat" @click="playMessagesStream(audioItem)">Продолжить поток с этого сообщения</v-btn>
          <v-btn color="error" variant="flat">Удалить из очереди</v-btn>
        </v-card-actions>
      </v-card>
    </div>
  </div>
</template>
