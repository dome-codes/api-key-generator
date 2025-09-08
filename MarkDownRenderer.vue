<template>
  <div class="markdown-content">
    <div v-html="processedContent"></div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  content: string
}

const props = defineProps<Props>()

const processedContent = computed(() => {
  return props.content
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, '<code class="bg-gray-100 px-1 py-0.5 rounded text-sm">$1</code>')
    .replace(/```([\s\S]*?)```/g, '<pre class="bg-gray-800 text-white p-4 rounded overflow-x-auto"><code>$1</code></pre>')
    .replace(/\n/g, '<br>')
})
</script>
