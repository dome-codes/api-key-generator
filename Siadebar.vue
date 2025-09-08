<template>
  <div class="sidebar bg-background border-r border-border h-full">
    <!-- Sidebar Header -->
    <div class="p-4 border-b border-border">
      <h3 class="text-lg font-semibold text-foreground">Chat-Historie</h3>
      <p class="text-sm text-muted-foreground">Ihre vorherigen Gespräche</p>
    </div>

    <!-- Chat History -->
    <div class="flex-1 overflow-y-auto p-4">
      <div class="space-y-2">
        <div 
          v-for="chat in chatHistory" 
          :key="chat.id"
          class="p-3 rounded-lg cursor-pointer hover:bg-muted transition-colors"
          :class="{ 'bg-primary text-primary-foreground': chat.isActive }"
          @click="selectChat(chat.id)"
        >
          <div class="text-sm font-medium">{{ chat.title }}</div>
          <div class="text-xs opacity-70">{{ formatDate(chat.lastMessage) }}</div>
        </div>
      </div>
    </div>

    <!-- Sidebar Footer -->
    <div class="p-4 border-t border-border">
      <q-btn
        flat
        no-caps
        color="primary"
        icon="add"
        label="Neuer Chat"
        @click="createNewChat"
        class="w-full"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

interface Chat {
  id: string
  title: string
  lastMessage: Date
  isActive: boolean
}

interface Props {
  onClose?: () => void
}

const props = defineProps<Props>()

const chatHistory = ref<Chat[]>([
  {
    id: '1',
    title: 'Kennzahlen-Berechnung',
    lastMessage: new Date(Date.now() - 30000),
    isActive: true
  },
  {
    id: '2',
    title: 'CI/CD Pipeline Setup',
    lastMessage: new Date(Date.now() - 86400000),
    isActive: false
  },
  {
    id: '3',
    title: 'Vue.js Komponenten',
    lastMessage: new Date(Date.now() - 172800000),
    isActive: false
  }
])

function selectChat(chatId: string) {
  chatHistory.value.forEach(chat => {
    chat.isActive = chat.id === chatId
  })
  
  // Hier würde normalerweise der Chat geladen werden
  console.log('Selected chat:', chatId)
}

function createNewChat() {
  const newChat: Chat = {
    id: Date.now().toString(),
    title: 'Neuer Chat',
    lastMessage: new Date(),
    isActive: true
  }
  
  chatHistory.value.forEach(chat => chat.isActive = false)
  chatHistory.value.unshift(newChat)
  
  console.log('Created new chat:', newChat.id)
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}
</script>
