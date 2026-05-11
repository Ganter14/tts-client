<script setup lang="ts">
import { useUserSettings } from '@/composables'

const { clientId, vtsAddress, vtsPort } = useUserSettings()
</script>

<template>
  <div>
    <v-text-field v-model="clientId" label="Twitch nickname" />
    <v-text-field v-model="vtsAddress" label="VTS address" />
    <v-text-field v-model="vtsPort" label="VTS port" />
  </div>
</template>
