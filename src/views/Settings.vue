<script setup lang="ts">
import { useUserSettings } from '@/composables'

const { clientId } = useUserSettings()
</script>

<template>
  <div>
    <v-text-field v-model="clientId" label="Twitch nickname" />
  </div>
</template>
