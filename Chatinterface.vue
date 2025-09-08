<template>
  <div class="flex h-full bg-background">
    <!-- Mobile menu button -->
    <div class="lg:hidden fixed top-4 left-4 z-50">
      <q-btn
        flat
        round
        icon="menu"
        @click="sidebarOpen = !sidebarOpen"
        class="bg-background shadow-md"
      />
    </div>

    <!-- Sidebar -->
    <div
      :class="`
        fixed inset-y-0 left-0 z-40 w-80 transform transition-transform duration-300 ease-in-out
        lg:relative lg:translate-x-0 lg:z-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `"
    >
      <Sidebar @close="sidebarOpen = false" />
    </div>

    <!-- Overlay for mobile -->
    <div 
      v-if="sidebarOpen" 
      class="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden" 
      @click="sidebarOpen = false" 
    />

    <!-- Main chat area -->
    <div class="flex-1 flex flex-col min-w-0">
      <ChatArea />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import ChatArea from './ChatArea.vue'
import Sidebar from './Sidebar.vue'

const sidebarOpen = ref(false)
</script>
