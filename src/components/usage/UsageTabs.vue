<script setup lang="ts">
import { hasPermission } from '@/auth/keycloak'
import { ref, watch, computed } from 'vue'
import { useUrlFilters } from '@/composables/useUrlFilters'
import AIUsageContent from './ai/AIUsageContent.vue'
import ExtractionUsageContent from './extraction/ExtractionUsageContent.vue'

const { getQueryParam, setQueryParam } = useUrlFilters()

const isApiAdmin = computed(() => hasPermission('canUseAdminFeatures'))

// Haupt-Tab: 'own' oder 'admin'
const activeMainTab = ref<'own' | 'admin'>((getQueryParam('tab') as 'own' | 'admin') || 'own')

// Unter-Tab: 'ai' (Standard) oder 'extraction' – AI-Nutzung ist beim Öffnen des Bereichs Nutzung vorausgewählt
const activeUsageType = ref<'ai' | 'extraction'>(
  getQueryParam('usageType') === 'extraction' ? 'extraction' : 'ai',
)

// URL aktualisieren wenn Haupt-Tab gewechselt wird
const handleMainTabChange = (tab: 'own' | 'admin') => {
  activeMainTab.value = tab
  setQueryParam('tab', tab)
}

// URL aktualisieren wenn Usage-Typ gewechselt wird
const handleUsageTypeChange = (type: 'ai' | 'extraction') => {
  activeUsageType.value = type
  setQueryParam('usageType', type)
}

// Watch für Tab-Änderungen
watch(activeMainTab, (newTab) => {
  setQueryParam('tab', newTab)
})

watch(activeUsageType, (newType) => {
  setQueryParam('usageType', newType)
})
</script>

<template>
  <div>
    <!-- Haupt-Tabs: Meine Nutzung vs Admin-Nutzung -->
    <div class="border-b border-gray-200 mb-6">
      <nav class="-mb-px flex space-x-8">
        <button
          :class="[
            activeMainTab === 'own'
              ? 'border-primary text-primary'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
            'whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm',
          ]"
          @click="handleMainTabChange('own')"
        >
          <svg class="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
          Meine Nutzung
        </button>

        <button
          v-if="isApiAdmin"
          :class="[
            activeMainTab === 'admin'
              ? 'border-primary text-primary'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
            'whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm',
          ]"
          @click="handleMainTabChange('admin')"
        >
          <svg class="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
          Admin-Nutzung (Alle Konten)
        </button>
      </nav>
    </div>

    <!-- Unter-Tabs: AI Nutzung vs Extraction -->
    <div class="border-b border-gray-200 mb-6">
      <nav class="-mb-px flex space-x-8">
        <button
          :class="[
            activeUsageType === 'ai'
              ? 'border-primary text-primary'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
            'whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm',
          ]"
          @click="handleUsageTypeChange('ai')"
        >
          <svg class="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
            />
          </svg>
          AI Nutzung
        </button>

        <button
          :class="[
            activeUsageType === 'extraction'
              ? 'border-primary text-primary'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
            'whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm',
          ]"
          @click="handleUsageTypeChange('extraction')"
        >
          <svg class="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          Document Intelligence (Extraction)
        </button>
      </nav>
    </div>

    <!-- Content basierend auf Haupt-Tab und Usage-Typ -->
    <AIUsageContent v-if="activeUsageType === 'ai'" :use-admin-api="activeMainTab === 'admin'" />
    <ExtractionUsageContent
      v-else-if="activeUsageType === 'extraction'"
      :use-admin-api="activeMainTab === 'admin'"
    />
  </div>
</template>
