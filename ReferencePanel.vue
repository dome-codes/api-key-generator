<template>
  <div class="reference-panel q-pa-md bg-grey-1 rounded">
    <div class="text-subtitle2 q-mb-sm">Alle Quellen:</div>
    <div v-for="reference in references" :key="reference.url" class="q-mb-xs">
      <div class="reference-item p-2 bg-white rounded cursor-pointer hover:bg-grey-2 transition-colors" @click="openReference(reference.url)">
        <div class="flex items-center gap-2">
          <q-icon :name="getFileIcon(reference.doc_type)" :color="getFileColor(reference.doc_type)" />
          <div class="flex-1">
            <div class="text-sm font-medium">{{ reference.source }}</div>
            <div v-if="reference.section_title" class="text-xs text-grey-6">{{ reference.section_title }}</div>
            <div v-if="reference.page" class="text-xs text-grey-6">Seite {{ reference.page }}</div>
          </div>
          <q-badge outline :label="`${Math.round(reference.confidence * 100)}%`" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Reference } from './types';

interface Props {
  references: Reference[]
}

const props = defineProps<Props>()

function getFileIcon(docType: string): string {
  switch (docType.toLowerCase()) {
    case 'pdf':
      return 'picture_as_pdf'
    case 'excel':
      return 'table_chart'
    case 'word':
      return 'description'
    default:
      return 'description'
  }
}

function getFileColor(docType: string): string {
  switch (docType.toLowerCase()) {
    case 'pdf':
      return 'red'
    case 'excel':
      return 'green'
    case 'word':
      return 'blue'
    default:
      return 'grey'
  }
}

function openReference(url: string) {
  window.open(url, '_blank')
}
</script>
