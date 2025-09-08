<template>
  <div :class="`w-full ${message.isUser ? 'bg-background' : 'bg-muted/30'}`">
    <div class="max-w-4xl mx-auto px-4 py-4">
      <div :class="`flex ${message.isUser ? 'justify-end' : 'justify-start'} w-full`">
        <div
          :class="`
            flex ${message.isUser ? 'max-w-2xl' : 'w-full'} 
            ${message.isUser ? 'flex-row-reverse' : 'flex-row'} 
            items-start gap-3
          `"
        >
          <!-- Avatar -->
          <q-avatar size="32px" class="flex-shrink-0">
            <q-icon 
              :name="message.isUser ? 'person' : 'smart_toy'"
              :color="message.isUser ? 'primary' : 'grey-6'"
            />
          </q-avatar>

          <!-- Message Content -->
          <div :class="`${!message.isUser ? 'flex-1' : ''}`">
            <div :class="`${message.isUser ? 'bg-primary text-primary-foreground rounded-lg p-3' : ''}`">
              
              <!-- User Message (Simple) -->
              <div v-if="message.isUser" class="text-primary-foreground">
                {{ message.content }}
              </div>

              <!-- AI Response with Template -->
              <div v-else>
                <!-- Title -->
                <h1 v-if="message.chatResponse?.title" class="text-xl font-bold mb-3 text-foreground">
                  {{ message.chatResponse.title }}
                </h1>

                <!-- Question -->
                <h2 v-if="message.chatResponse?.question" class="text-lg font-semibold mb-2 text-foreground">
                  {{ message.chatResponse.question }}
                </h2>

                <!-- Overall Summary -->
                <div v-if="message.chatResponse?.overall_summary_list?.length" class="mb-4">
                  <h3 class="text-base font-semibold mb-2 text-foreground">Zusammenfassung</h3>
                  <ul class="list-disc list-inside mb-3 space-y-1 text-foreground">
                    <li v-for="summary in message.chatResponse.overall_summary_list" :key="summary" class="text-sm">
                      {{ summary }}
                    </li>
                  </ul>
                </div>

                <!-- Answers -->
                <div v-if="message.chatResponse?.answers?.length" class="space-y-4">
                  <div v-for="(answer, index) in message.chatResponse.answers" :key="index" class="answer-section">
                    <!-- Tool Badge -->
                    <div class="flex items-center gap-2 mb-2">
                      <q-badge :color="getToolColor(answer.tool)" :label="answer.tool" />
                      <q-badge outline :label="`${Math.round(answer.confidence * 100)}%`" />
                    </div>

                    <!-- Answer Summary -->
                    <p class="text-sm text-foreground mb-3">{{ answer.summary_list }}</p>

                    <!-- References for this answer -->
                    <div v-if="answer.references?.length" class="references-section">
                      <h4 class="text-sm font-semibold mb-2 text-foreground">Quellen:</h4>
                      <div class="space-y-2">
                        <div 
                          v-for="ref in answer.references" 
                          :key="ref.url"
                          class="reference-item p-2 bg-grey-1 rounded cursor-pointer hover:bg-grey-2 transition-colors"
                          @click="openReference(ref.url)"
                        >
                          <div class="flex items-center gap-2">
                            <q-icon :name="getFileIcon(ref.doc_type)" :color="getFileColor(ref.doc_type)" />
                            <div class="flex-1">
                              <div class="text-sm font-medium">{{ ref.source }}</div>
                              <div v-if="ref.section_title" class="text-xs text-grey-6">{{ ref.section_title }}</div>
                              <div v-if="ref.page" class="text-xs text-grey-6">Seite {{ ref.page }}</div>
                            </div>
                            <q-badge outline :label="`${Math.round(ref.confidence * 100)}%`" />
                          </div>
                          
                          <!-- Highlighted Text Preview -->
                          <div v-if="ref.highlighted_text" class="mt-2 p-2 bg-yellow-1 rounded text-xs">
                            <strong>Relevanter Text:</strong> {{ ref.highlighted_text }}
                          </div>
                          
                          <!-- Explicit Answer -->
                          <div v-if="ref.explicit_answer" class="mt-2 p-2 bg-blue-1 rounded text-xs">
                            <strong>Antwort:</strong> {{ ref.explicit_answer }}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Fallback: Simple Content -->
                <div v-if="!message.chatResponse" class="text-sm leading-relaxed">
                  <MarkdownRenderer :content="message.content" />
                </div>
              </div>

              <!-- Action Buttons -->
              <div v-if="!message.isUser" class="row full-width q-pb-sm q-pt-sm q-pl-xs button-container justify-start">
                <q-btn
                  flat
                  no-caps
                  size="sm"
                  icon="content_copy"
                  color="grey"
                  :label="$t('copy')"
                  @click="copyToClipBoard"
                  class="copy-btn"
                />
                <q-btn
                  v-if="hasReferences()"
                  flat
                  no-caps
                  size="sm"
                  :icon="expanded ? 'keyboard_arrow_up' : 'keyboard_arrow_down'"
                  color="grey"
                  :label="$t('sources')"
                  @click="toggleExpansion"
                  class="reference-btn"
                />
              </div>

              <!-- References Panel -->
              <q-slide-transition>
                <div v-show="expanded">
                  <ReferencePanel 
                    v-if="getAllReferences().length > 0" 
                    :references="getAllReferences()" 
                  />
                </div>
              </q-slide-transition>

              <!-- Timestamp -->
              <p
                :class="`text-xs mt-2 ${message.isUser ? 'text-primary-foreground/70' : 'text-muted-foreground'}`"
              >
                {{ formatTime(message.timestamp) }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useQuasarNotify } from '@/shared/composables/util/useQuasarNotify'
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import MarkdownRenderer from './MarkdownRenderer.vue'
import ReferencePanel from './ReferencePanel.vue'
import type { ChatResponse, Message, Reference } from './types'

interface ChatMessageProps {
  message: Message
}

const props = defineProps<ChatMessageProps>()
const quasarNotify = useQuasarNotify()
const { t } = useI18n()

const expanded = ref(false)

function hasReferences() {
  return getAllReferences().length > 0
}

function getAllReferences(): Reference[] {
  if (props.message.chatResponse?.answers) {
    return props.message.chatResponse.answers.flatMap(answer => answer.references || [])
  }
  return props.message.references || []
}

function getToolColor(tool: string): string {
  switch (tool) {
    case 'ExcelQueryEngine':
      return 'green'
    case 'PDFQueryEngine':
      return 'red'
    case 'DatabaseQueryEngine':
      return 'blue'
    default:
      return 'grey'
  }
}

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

function copyToClipBoard() {
  try {
    window.focus()
    
    let content = ''
    if (props.message.chatResponse) {
      content = generateStructuredContent(props.message.chatResponse)
    } else {
      content = props.message.content
    }
    
    const htmlContent = removeMarkdownHTML(content)
    const plainTextContent = removeMarkdownText(content)
    
    const htmlBlob = new Blob([htmlContent], { type: 'text/html' })
    const plainTextBlob = new Blob([plainTextContent], { type: 'text/plain' })
    const clipboardItem = new ClipboardItem({ 
      'text/html': htmlBlob, 
      'text/plain': plainTextBlob 
    })
    
    navigator.clipboard.write([clipboardItem])
    quasarNotify.getSuccessNotification('Nachricht wurde in die Zwischenablage kopiert')
  } catch (error) {
    console.log(error)
    quasarNotify.getErrorNotification(t('error.technical'))
  }
}

function generateStructuredContent(chatResponse: ChatResponse): string {
  let content = `# ${chatResponse.title}\n\n`
  
  if (chatResponse.question) {
    content += `## ${chatResponse.question}\n\n`
  }
  
  if (chatResponse.overall_summary_list?.length) {
    content += '### Zusammenfassung\n\n'
    chatResponse.overall_summary_list.forEach(summary => {
      content += `• ${summary}\n`
    })
    content += '\n'
  }
  
  chatResponse.answers.forEach((answer, index) => {
    content += `## Antwort ${index + 1} (${answer.tool})\n\n`
    content += `${answer.summary_list}\n\n`
    
    if (answer.references?.length) {
      content += '### Quellen:\n\n'
      answer.references.forEach(ref => {
        content += `**${ref.source}** (${ref.doc_type})\n`
        if (ref.section_title) content += `- Abschnitt: ${ref.section_title}\n`
        if (ref.page) content += `- Seite: ${ref.page}\n`
        if (ref.highlighted_text) content += `- Relevanter Text: ${ref.highlighted_text}\n`
        if (ref.explicit_answer) content += `- Antwort: ${ref.explicit_answer}\n`
        content += `- URL: ${ref.url}\n\n`
      })
    }
  })
  
  return content
}

function toggleExpansion() {
  expanded.value = !expanded.value
}

function openReference(url: string) {
  window.open(url, '_blank')
}

function formatTime(timestamp: Date) {
  return timestamp.toLocaleTimeString('de-DE', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

// Helper functions for markdown processing
function removeMarkdownHTML(content: string): string {
  return content
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, '<code>$1</code>')
    .replace(/\n/g, '<br>')
}

function removeMarkdownText(content: string): string {
  return content
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/`(.*?)`/g, '$1')
    .replace(/#{1,6}\s/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
}
</script>
