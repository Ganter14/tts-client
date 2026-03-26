<script setup lang="ts">
import { ref } from 'vue';
import { useTTSControl } from '@/composables';

const drawer = ref(false)
const { ttsStatus, lipsyncStatus } = useTTSControl()
</script>

<template>
  <v-app>
    <v-layout>
      <v-navigation-drawer v-model="drawer">
        <v-list-item link title="Главная" :to="{ name: 'main' }"></v-list-item>
        <v-list-item link title="История"></v-list-item>
        <v-list-item link title="Настройки" :to="{ name: 'settings' }"></v-list-item>
      </v-navigation-drawer>
      <v-app-bar>
        <v-app-bar-nav-icon variant="text" @click.stop="drawer = !drawer"></v-app-bar-nav-icon>
        <v-spacer />
        <div class="d-flex align-center mr-2">
          <span class="text-body-small mr-1">ТТС: </span>
          <v-tooltip text="Соединение с ТТС сервером" location="bottom">
            <template #activator="{ props }">
              <v-sheet :color="ttsStatus === 'OPEN'? 'green' : 'red'" rounded="circle" width="10" height="10" v-bind="props"/>
            </template>
          </v-tooltip>
        </div>
        <div class="d-flex align-center mr-2">
          <span class="text-body-small mr-1">Lipsync: </span>
          <v-tooltip text="Соединение с VTube Studio" location="bottom">
            <template #activator="{ props }">
              <v-sheet :color="lipsyncStatus ? 'green' : 'red'" rounded="circle" width="10" height="10" v-bind="props"/>
            </template>
          </v-tooltip>
        </div>
        <v-btn icon="mdi-cog" :to="{ name: 'settings' }" />
      </v-app-bar>
      <v-main>
        <v-container>
          <router-view />
        </v-container>
      </v-main>
    </v-layout>
  </v-app>
</template>
