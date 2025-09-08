<template>
  <div class="flex flex-col h-full">
    <!-- Header -->
    <div class="border-b border-border bg-background p-4 lg:p-6">
      <h2 class="text-lg font-semibold text-foreground">Chat-Assistent</h2>
      <p class="text-sm text-muted-foreground">Stellen Sie mir gerne Ihre Fragen</p>
    </div>

    <!-- Messages -->
    <div class="flex-1 overflow-y-auto p-4 lg:p-6 space-y-4">
      <ChatMessage 
        v-for="message in messages" 
        :key="message.id" 
        :message="message" 
      />

      <div v-if="isTyping" class="flex justify-start">
        <div class="bg-card rounded-lg p-3 max-w-xs lg:max-w-md shadow-sm">
          <div class="flex space-x-1">
            <div class="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
            <div class="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style="animation-delay: 0.1s"></div>
            <div class="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style="animation-delay: 0.2s"></div>
          </div>
        </div>
      </div>

      <div ref="messagesEndRef" />
    </div>

    <!-- Input -->
    <div class="border-t border-border bg-background p-4 lg:p-6">
      <div class="flex space-x-2">
        <q-input
          v-model="inputValue"
          @keyup.enter="handleSendMessage"
          placeholder="Schreiben Sie Ihre Nachricht..."
          class="flex-1"
          :disable="isTyping"
          outlined
          dense
        />
        <q-btn
          @click="handleSendMessage"
          :disable="!inputValue.trim() || isTyping"
          color="primary"
          icon="send"
          round
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { nextTick, onMounted, ref } from 'vue'
import ChatMessage from './ChatMessage.vue'
import type { ChatResponse, Message } from './types'

const messages = ref<Message[]>([
  {
    id: "1",
    content: "Hallo! Ich bin Ihr AI-Assistent. Wie kann ich Ihnen heute helfen?",
    isUser: false,
    timestamp: new Date(),
  },
  {
    id: "2",
    content: "",
    isUser: false,
    timestamp: new Date(Date.now() - 30000),
    chatResponse: {
      title: "Definition der berechneten Kennzahlen",
      question: "Wie werden die Kennzahlen berechnet?",
      overall_summary_list: [
        "Die Excel-Formelsammlung enthält alle Rechenregeln.",
        "Das Handbuch ergänzt diese durch textliche Definitionen und Beispiele."
      ],
      answers: [
        {
          tool: "ExcelQueryEngine",
          confidence: 0.91,
          summary_list: "Die Datei 'VMDB_Formelsammlung.xlsx' enthält die Definitionen der Kennzahlen.",
          references: [
            {
              source: "vmdb_formelsammlung.xlsx",
              url: "https://intranet.deka/docs/vmdb_formelsammlung.xlsx",
              page: null,
              section_title: "Formeln Kennzahlenbasis",
              highlighted_text: "Alle Kennzahlenberechnungen sind in einer separaten Datei in der Hilfekachel abgele",
              explicit_answer: "Die Definitionen der Kennzahlen befinden sich in der Datei 'VMDB_Formelsammlung.xlsx'",
              doc_type: "Excel",
              confidence: 0.94
            },
            {
              source: "vtest.xlsx",
              url: "https://intranet.deka/docs/vtest.xlsx",
              page: null,
              section_title: "Formeln Amortisation",
              highlighted_text: "Amortisation inkl. mietfreier Zeiten = Gesamtkosten / (gesamte Erträge Laufzeit in",
              explicit_answer: "Die Amortisation wird berechnet, indem die Gesamtkosten durch die gesamten Erträge mul",
              doc_type: "Excel",
              confidence: 0.89
            }
          ]
        },
        {
          tool: "PDFQueryEngine",
          confidence: 0.87,
          summary_list: "Das Handbuch liefert Definitionen zu Erträgen, Kosten und Amortisation.",
          references: [
            {
              source: "kennzahlen_handbuch.pdf",
              url: "https://intranet.deka/docs/kennzahlen_handbuch.pdf",
              page: 12,
              section_title: "Berechnungsgrundlagen",
              highlighted_text: "Erträge (1. Jahr): Summe aus Mieterträgen p.a., sonstigen Erträgen p.a. und Ertrag aus!",
              explicit_answer: "Erträge im ersten Jahr ergeben sich aus der Summe von Mieterträgen, sonstigen Erträgen un",
              doc_type: "PDF",
              confidence: 0.92
            },
            {
              source: "kennzahlen_handbuch.pdf",
              url: "https://intranet.deka/docs/kennzahlen_handbuch.pdf",
              page: 13,
              section_title: "Kosten und Amortisation",
              highlighted_text: "Kosten gesamt = Summe aus mietfreien Zeiten, Maklerkosten, Beratungskosten...",
              explicit_answer: "Die Gesamtkosten setzen sich aus Mietfrei-Zeiten, Makler- und Beratungskosten sowie weiter",
              doc_type: "PDF",
              confidence: 0.88
            }
          ]
        }
      ],
      timestamp: "2025-09-05T20:10:00Z"
    }
  }
])

const inputValue = ref("")
const isTyping = ref(false)
const messagesEndRef = ref<HTMLElement>()

const scrollToBottom = async () => {
  await nextTick()
  messagesEndRef.value?.scrollIntoView({ behavior: "smooth" })
}

const handleSendMessage = async () => {
  if (!inputValue.value.trim()) return

  const userMessage: Message = {
    id: Date.now().toString(),
    content: inputValue.value,
    isUser: true,
    timestamp: new Date(),
  }

  messages.value.push(userMessage)
  const question = inputValue.value
  inputValue.value = ""
  isTyping.value = true

  await scrollToBottom()

  // Simulate API call with JSON response
  setTimeout(async () => {
    try {
      // Hier würde normalerweise ein API-Call stattfinden
      const chatResponse: ChatResponse = await mockApiCall(question)
      
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: "", // Content wird aus chatResponse generiert
        isUser: false,
        timestamp: new Date(),
        chatResponse: chatResponse
      }
      
      messages.value.push(botMessage)
    } catch (error) {
      console.error('API Error:', error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: "Entschuldigung, es ist ein Fehler aufgetreten. Bitte versuchen Sie es erneut.",
        isUser: false,
        timestamp: new Date(),
      }
      messages.value.push(errorMessage)
    }
    
    isTyping.value = false
    await scrollToBottom()
  }, 2000)
}

// Mock API function - hier würde der echte API-Call stehen
const mockApiCall = async (question: string): Promise<ChatResponse> => {
  // Simuliert API-Delay
  await new Promise(resolve => setTimeout(resolve, 1500))
  
  // Mock response basierend auf der Frage
  return {
    title: "Antwort auf Ihre Frage",
    question: question,
    overall_summary_list: [
      "Die Antwort wurde aus verschiedenen Quellen zusammengestellt.",
      "Alle Informationen sind mit Quellenangaben versehen."
    ],
    answers: [
      {
        tool: "DatabaseQueryEngine",
        confidence: 0.95,
        summary_list: `Basierend auf Ihrer Frage "${question}" wurden relevante Informationen gefunden.`,
        references: [
          {
            source: "datenbank.pdf",
            url: "https://intranet.deka/docs/datenbank.pdf",
            page: 1,
            section_title: "Allgemeine Informationen",
            highlighted_text: "Relevante Informationen zu Ihrer Anfrage",
            explicit_answer: "Die Antwort auf Ihre Frage finden Sie in der Datenbank.",
            doc_type: "PDF",
            confidence: 0.95
          }
        ]
      }
    ],
    timestamp: new Date().toISOString()
  }
}

onMounted(() => {
  scrollToBottom()
})
</script>
