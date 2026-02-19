<script setup lang="ts">
import { usePricingManagement } from '@/composables/usePricingManagement'
import type { ModelPricing, ImageModelPricing, EmbeddingModelPricing } from '@/config/pricing'
import AppHeader from '@/components/layout/AppHeader.vue'
import AppSidebar from '@/components/layout/AppSidebar.vue'
import ModelPricingTable from '@/components/admin/pricing/ModelPricingTable.vue'
import PricingUpload from '@/components/admin/pricing/PricingUpload.vue'
import PricingMarkupInput from '@/components/admin/pricing/PricingMarkupInput.vue'
import DeleteConfirmModal from '@/components/admin/pricing/DeleteConfirmModal.vue'
import ResetConfirmModal from '@/components/admin/pricing/ResetConfirmModal.vue'
import { useAuth } from '@/composables/useAuth'
import { useDebug } from '@/composables/useDebug'
import { ref, onMounted, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { hasPermission } from '@/auth/keycloak'
import { pricingService } from '@/services/pricingService'

const router = useRouter()

// Prüfe Admin-Berechtigung
if (!hasPermission('canUseAdminFeatures')) {
  router.push('/')
}

const { userProfile, highestRole, handleLogout } = useAuth()

const userRolesForHeader = computed(() => [String(highestRole.value)])
const { isDevelopment, showDebugMode } = useDebug()

const {
  modelPricing,
  imagePricing,
  embeddingPricing,
  markupPercentage,
  isLoading,
  error: pricingError,
  loadPricing,
  updateModelPricing,
  deleteModelPricing,
  addModelPricing,
  updateImagePricing,
  deleteImagePricing,
  addImagePricing,
  updateEmbeddingPricing,
  deleteEmbeddingPricing,
  addEmbeddingPricing,
  resetToDefaults,
  savePricing,
  uploadPricing,
} = usePricingManagement()

const showResetConfirm = ref(false)
const showDeleteConfirmModal = ref(false)
const deleteModelType = ref<'model' | 'image' | 'embedding' | null>(null)
const deleteModelName = ref<string>('')
const showAddImageModal = ref(false)
const showAddEmbeddingModal = ref(false)
const uploadError = ref<string | null>(null)
const uploadSuccess = ref(false)

// State für Editing-Management (nur noch für Image und Embedding)
interface EditingState {
  originalValue: number | undefined
  currentValue: string
}
const editingState = ref<Record<string, EditingState>>({})
const inputRefs = ref<Record<string, HTMLInputElement | null>>({})

// Helper-Funktionen für Editing (nur noch für Image und Embedding)
const getEditingKey = (modelName: string, field: string) => `${modelName}::${field}`
const isEditing = (modelName: string, field: string) =>
  !!editingState.value[getEditingKey(modelName, field)]
const getEditingValue = (modelName: string, field: string) =>
  editingState.value[getEditingKey(modelName, field)]?.currentValue
const setInputRef = (modelName: string, field: string, el: any) => {
  if (el && el instanceof HTMLInputElement) {
    inputRefs.value[getEditingKey(modelName, field)] = el
  }
}

const startEditing = (modelName: string, field: string, originalValue: number | undefined) => {
  const key = getEditingKey(modelName, field)
  editingState.value[key] = {
    originalValue,
    currentValue: originalValue?.toString() || '',
  }
}

const handleInputChange = (model: any, field: string, value: string) => {
  const key = getEditingKey(model.modelName, field)
  if (editingState.value[key]) {
    editingState.value[key].currentValue = value
  } else {
    startEditing(model.modelName, field, model[field])
    const fallbackKey = getEditingKey(model.modelName, field)
    if (editingState.value[fallbackKey]) {
      editingState.value[fallbackKey].currentValue = value
    }
  }
}

const confirmEdit = (model: any, field: string) => {
  const key = getEditingKey(model.modelName, field)
  const editing = editingState.value[key]
  if (!editing) return

  const num = parseFloat(editing.currentValue)
  if (!isNaN(num) && num >= 0) {
    model[field] = num
  } else if (
    editing.currentValue === '' ||
    editing.currentValue === null ||
    editing.currentValue === undefined
  ) {
    // Optional fields können leer sein
    if (field === 'standardPriceLarge' || field === 'hdPriceLarge') {
      model[field] = undefined
    } else {
      model[field] = 0
    }
  } else {
    // Ungültiger Wert, zurücksetzen auf Original
    model[field] = editing.originalValue ?? 0
  }

  // Automatisch speichern basierend auf Modell-Typ
  if ('standardPrice' in model || 'hdPrice' in model) {
    updateImagePricing(model)
  } else if ('pricePer1000Tokens' in model) {
    updateEmbeddingPricing(model)
  }

  // Editing-State entfernen
  delete editingState.value[key]
}

const cancelEdit = (modelName: string, field: string) => {
  const key = getEditingKey(modelName, field)
  delete editingState.value[key]
  const inputRef = inputRefs.value[key]
  if (inputRef) {
    inputRef.blur()
  }
}

const newImageModel = ref<ImageModelPricing>({
  modelName: '',
  standardPrice: 0,
  hdPrice: 0,
})

const newEmbeddingModel = ref<EmbeddingModelPricing>({
  modelName: '',
  pricePer1000Tokens: 0,
})

// Hilfsfunktion für Input-Zuweisung (umgeht TypeScript-Fehler)
const setInputValue = (model: any, field: string, value: string) => {
  model[field] = value
}

// Für Modal-Inputs: Konvertiert String zu Number, speichert aber nicht automatisch
const handleModalInputBlur = (model: any, field: string) => {
  const value = model[field]
  if (typeof value === 'string') {
    const num = parseFloat(value)
    if (!isNaN(num) && num >= 0) {
      model[field] = num
    } else if (value === '' || value === null || value === undefined) {
      // Optional fields können leer sein
      if (
        field === 'cachedInputPrice' ||
        field === 'reasoningPrice' ||
        field === 'standardPriceLarge' ||
        field === 'hdPriceLarge'
      ) {
        model[field] = undefined
      } else {
        model[field] = 0
      }
    } else {
      // Ungültiger Wert, zurücksetzen
      const current = model[field]
      model[field] = typeof current === 'number' ? current : 0
    }
  }
}

// Zeigt Bestätigungsdialog für Löschen
const showDeleteConfirm = (type: 'model' | 'image' | 'embedding', modelName: string) => {
  deleteModelType.value = type
  deleteModelName.value = modelName
  showDeleteConfirmModal.value = true
}

// Führt Löschung nach Bestätigung aus
const handleDeleteConfirm = () => {
  if (deleteModelType.value === 'model') {
    deleteModelPricing(deleteModelName.value)
  } else if (deleteModelType.value === 'image') {
    deleteImagePricing(deleteModelName.value)
  } else if (deleteModelType.value === 'embedding') {
    deleteEmbeddingPricing(deleteModelName.value)
  }
  showDeleteConfirmModal.value = false
  deleteModelType.value = null
  deleteModelName.value = ''
}

const handleFileUpload = async (file: File) => {
  uploadError.value = null
  uploadSuccess.value = false

  // Prüfe Dateityp
  if (!file.name.endsWith('.json')) {
    uploadError.value = 'Ungültiger Dateityp: Bitte laden Sie eine JSON-Datei hoch (.json)'
    setTimeout(() => {
      uploadError.value = null
    }, 10000)
    return
  }

  try {
    await uploadPricing(file)
    pricingService.reloadPricing()
    uploadSuccess.value = true
    setTimeout(() => {
      uploadSuccess.value = false
    }, 3000)
  } catch (error) {
    console.error('Fehler beim Hochladen:', error)
    uploadError.value = error instanceof Error ? error.message : 'Fehler beim Hochladen der Datei'
    setTimeout(() => {
      uploadError.value = null
    }, 10000)
  }
}

const handleReset = async () => {
  await resetToDefaults()
  showResetConfirm.value = false
}

const handleModelUpdate = (model: ModelPricing) => {
  updateModelPricing(model)
}

const handleModelDelete = (modelName: string) => {
  deleteModelType.value = 'model'
  deleteModelName.value = modelName
  showDeleteConfirmModal.value = true
}

const handleModelAdd = (model: ModelPricing) => {
  addModelPricing(model)
}

const handleAddImageModel = () => {
  const standardPrice =
    typeof newImageModel.value.standardPrice === 'string'
      ? parseFloat(newImageModel.value.standardPrice)
      : newImageModel.value.standardPrice
  const hdPrice =
    typeof newImageModel.value.hdPrice === 'string'
      ? parseFloat(newImageModel.value.hdPrice)
      : newImageModel.value.hdPrice

  if (
    newImageModel.value.modelName &&
    !isNaN(standardPrice) &&
    standardPrice > 0 &&
    !isNaN(hdPrice) &&
    hdPrice > 0
  ) {
    addImagePricing({
      modelName: newImageModel.value.modelName,
      standardPrice,
      hdPrice,
    })
    newImageModel.value = { modelName: '', standardPrice: 0, hdPrice: 0 }
    showAddImageModal.value = false
  }
}

const handleAddEmbeddingModel = () => {
  const pricePer1000Tokens =
    typeof newEmbeddingModel.value.pricePer1000Tokens === 'string'
      ? parseFloat(newEmbeddingModel.value.pricePer1000Tokens)
      : newEmbeddingModel.value.pricePer1000Tokens

  if (newEmbeddingModel.value.modelName && !isNaN(pricePer1000Tokens) && pricePer1000Tokens > 0) {
    addEmbeddingPricing({
      modelName: newEmbeddingModel.value.modelName,
      pricePer1000Tokens,
    })
    newEmbeddingModel.value = { modelName: '', pricePer1000Tokens: 0 }
    showAddEmbeddingModal.value = false
  }
}

const handleMarkupUpdate = (value: number) => {
  markupPercentage.value = value
}

onMounted(async () => {
  // Preise werden bereits von usePricingManagement geladen
  await new Promise((resolve) => setTimeout(resolve, 100))
})
</script>

<template>
  <div class="min-h-screen bg-gray-50 flex">
    <AppSidebar />
    <div class="flex-1 flex flex-col min-h-screen">
      <AppHeader
        :user-profile="userProfile"
        :user-roles="userRolesForHeader"
        :is-development="isDevelopment"
        :show-debug-mode="showDebugMode"
        @logout="handleLogout"
      />
      <main class="flex-1 bg-gray-50 p-6 space-y-6">
        <!-- Loading State -->
        <div v-if="isLoading" class="text-center py-8">
          <p class="text-gray-600">Preise werden geladen...</p>
        </div>

        <!-- Error State -->
        <div v-else-if="pricingError" class="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <p class="text-sm text-red-600">{{ pricingError }}</p>
          <button
            class="mt-2 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700"
            @click="loadPricing"
          >
            Erneut versuchen
          </button>
        </div>

        <!-- Content -->
        <template v-else>
          <div class="flex items-center justify-between">
            <div>
              <h1 class="text-2xl font-bold text-gray-900">Preisverwaltung</h1>
              <p class="text-sm text-gray-600 mt-1">
                Verwalten Sie die Preise für Azure OpenAI und Document Intelligence Modelle
              </p>
            </div>
          </div>

          <!-- Info-Box: Speicherung -->
          <div class="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-4">
            <div class="flex items-start">
              <svg
                class="w-4 h-4 text-gray-500 mr-2 mt-0.5 flex-shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fill-rule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clip-rule="evenodd"
                />
              </svg>
              <div class="flex-1">
                <div class="text-sm text-gray-700">
                  <p>
                    <strong>Speicherung:</strong> Änderungen werden automatisch gespeichert
                    (Enter-Taste oder Fokus-Verlust). Verwenden Sie die Download/Upload-Funktionen,
                    um Preise als JSON-Datei zu exportieren oder zu importieren.
                  </p>
                  <p class="mt-2">
                    <strong>Reasoning-Tokens:</strong> Werden aktuell zu Output-Tokens addiert.
                    Falls Sie einen separaten Reasoning-Preis definieren, wird dieser verwendet
                    (sobald die Berechnung angepasst ist).
                  </p>
                </div>
              </div>
            </div>
          </div>

          <PricingUpload
            :upload-error="uploadError"
            :upload-success="uploadSuccess"
            @upload="handleFileUpload"
            @download="savePricing"
            @reset="showResetConfirm = true"
            @clear-error="uploadError = null"
            @clear-success="uploadSuccess = false"
          />

          <PricingMarkupInput :markup="markupPercentage" @update="handleMarkupUpdate" />

          <ModelPricingTable
            :models="modelPricing"
            :is-loading="isLoading"
            @update="handleModelUpdate"
            @delete="handleModelDelete"
            @add="handleModelAdd"
          />

          <!-- Image Models -->
          <div class="bg-white rounded-xl shadow overflow-hidden">
            <div class="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 class="text-lg font-semibold text-gray-800">Image Models</h2>
              <button
                class="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-hover"
                @click="showAddImageModal = true"
              >
                + Modell hinzufügen
              </button>
            </div>
            <div class="overflow-x-auto">
              <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                  <tr>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Modell
                    </th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Standard (€/100 Bilder)
                    </th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      HD (€/100 Bilder)
                    </th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Standard Large (€/100 Bilder)
                    </th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      HD Large (€/100 Bilder)
                    </th>
                    <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Aktionen
                    </th>
                  </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
                  <tr v-for="model in imagePricing" :key="model.modelName">
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {{ model.modelName }}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <div class="relative inline-block">
                        <input
                          :ref="(el) => setInputRef(model.modelName, 'standardPrice', el)"
                          :value="
                            getEditingValue(model.modelName, 'standardPrice') ??
                            (model.standardPrice?.toString() || '')
                          "
                          type="text"
                          pattern="[0-9]*\.?[0-9]*"
                          inputmode="decimal"
                          class="w-32 border border-gray-300 rounded px-8 py-1 text-sm pr-8"
                          @input="
                            handleInputChange(
                              model,
                              'standardPrice',
                              ($event.target as HTMLInputElement).value,
                            )
                          "
                          @focus="
                            startEditing(model.modelName, 'standardPrice', model.standardPrice)
                          "
                          @keyup.enter="confirmEdit(model, 'standardPrice')"
                          @keyup.escape="cancelEdit(model.modelName, 'standardPrice')"
                        />
                        <div
                          v-if="isEditing(model.modelName, 'standardPrice')"
                          class="absolute right-1 top-1/2 -translate-y-1/2 flex gap-1"
                        >
                          <button
                            class="p-0.5 text-green-600 hover:text-green-700 hover:bg-green-50 rounded"
                            title="Bestätigen"
                            @click="confirmEdit(model, 'standardPrice')"
                          >
                            <svg
                              class="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              stroke-width="2"
                              viewBox="0 0 24 24"
                            >
                              <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          </button>
                          <button
                            class="p-0.5 text-red-600 hover:text-red-700 hover:bg-red-50 rounded"
                            title="Abbrechen"
                            @click="cancelEdit(model.modelName, 'standardPrice')"
                          >
                            <svg
                              class="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              stroke-width="2"
                              viewBox="0 0 24 24"
                            >
                              <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                d="M6 18L18 6M6 6l12 12"
                              />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <div class="relative inline-block">
                        <input
                          :ref="(el) => setInputRef(model.modelName, 'hdPrice', el)"
                          :value="
                            getEditingValue(model.modelName, 'hdPrice') ??
                            (model.hdPrice?.toString() || '')
                          "
                          type="text"
                          pattern="[0-9]*\.?[0-9]*"
                          inputmode="decimal"
                          class="w-32 border border-gray-300 rounded px-8 py-1 text-sm pr-8"
                          @input="
                            handleInputChange(
                              model,
                              'hdPrice',
                              ($event.target as HTMLInputElement).value,
                            )
                          "
                          @focus="startEditing(model.modelName, 'hdPrice', model.hdPrice)"
                          @keyup.enter="confirmEdit(model, 'hdPrice')"
                          @keyup.escape="cancelEdit(model.modelName, 'hdPrice')"
                        />
                        <div
                          v-if="isEditing(model.modelName, 'hdPrice')"
                          class="absolute right-1 top-1/2 -translate-y-1/2 flex gap-1"
                        >
                          <button
                            class="p-0.5 text-green-600 hover:text-green-700 hover:bg-green-50 rounded"
                            title="Bestätigen"
                            @click="confirmEdit(model, 'hdPrice')"
                          >
                            <svg
                              class="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              stroke-width="2"
                              viewBox="0 0 24 24"
                            >
                              <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          </button>
                          <button
                            class="p-0.5 text-red-600 hover:text-red-700 hover:bg-red-50 rounded"
                            title="Abbrechen"
                            @click="cancelEdit(model.modelName, 'hdPrice')"
                          >
                            <svg
                              class="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              stroke-width="2"
                              viewBox="0 0 24 24"
                            >
                              <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                d="M6 18L18 6M6 6l12 12"
                              />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <div class="relative inline-block">
                        <input
                          :ref="(el) => setInputRef(model.modelName, 'standardPriceLarge', el)"
                          :value="
                            getEditingValue(model.modelName, 'standardPriceLarge') ??
                            (model.standardPriceLarge?.toString() || '')
                          "
                          type="text"
                          pattern="[0-9]*\.?[0-9]*"
                          inputmode="decimal"
                          class="w-32 border border-gray-300 rounded px-8 py-1 text-sm pr-8"
                          placeholder="Optional"
                          @input="
                            handleInputChange(
                              model,
                              'standardPriceLarge',
                              ($event.target as HTMLInputElement).value,
                            )
                          "
                          @focus="
                            startEditing(
                              model.modelName,
                              'standardPriceLarge',
                              model.standardPriceLarge,
                            )
                          "
                          @keyup.enter="confirmEdit(model, 'standardPriceLarge')"
                          @keyup.escape="cancelEdit(model.modelName, 'standardPriceLarge')"
                        />
                        <div
                          v-if="isEditing(model.modelName, 'standardPriceLarge')"
                          class="absolute right-1 top-1/2 -translate-y-1/2 flex gap-1"
                        >
                          <button
                            class="p-0.5 text-green-600 hover:text-green-700 hover:bg-green-50 rounded"
                            title="Bestätigen"
                            @click="confirmEdit(model, 'standardPriceLarge')"
                          >
                            <svg
                              class="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              stroke-width="2"
                              viewBox="0 0 24 24"
                            >
                              <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          </button>
                          <button
                            class="p-0.5 text-red-600 hover:text-red-700 hover:bg-red-50 rounded"
                            title="Abbrechen"
                            @click="cancelEdit(model.modelName, 'standardPriceLarge')"
                          >
                            <svg
                              class="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              stroke-width="2"
                              viewBox="0 0 24 24"
                            >
                              <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                d="M6 18L18 6M6 6l12 12"
                              />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <div class="relative inline-block">
                        <input
                          :ref="(el) => setInputRef(model.modelName, 'hdPriceLarge', el)"
                          :value="
                            getEditingValue(model.modelName, 'hdPriceLarge') ??
                            (model.hdPriceLarge?.toString() || '')
                          "
                          type="text"
                          pattern="[0-9]*\.?[0-9]*"
                          inputmode="decimal"
                          class="w-32 border border-gray-300 rounded px-8 py-1 text-sm pr-8"
                          placeholder="Optional"
                          @input="
                            handleInputChange(
                              model,
                              'hdPriceLarge',
                              ($event.target as HTMLInputElement).value,
                            )
                          "
                          @focus="startEditing(model.modelName, 'hdPriceLarge', model.hdPriceLarge)"
                          @keyup.enter="confirmEdit(model, 'hdPriceLarge')"
                          @keyup.escape="cancelEdit(model.modelName, 'hdPriceLarge')"
                        />
                        <div
                          v-if="isEditing(model.modelName, 'hdPriceLarge')"
                          class="absolute right-1 top-1/2 -translate-y-1/2 flex gap-1"
                        >
                          <button
                            class="p-0.5 text-green-600 hover:text-green-700 hover:bg-green-50 rounded"
                            title="Bestätigen"
                            @click="confirmEdit(model, 'hdPriceLarge')"
                          >
                            <svg
                              class="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              stroke-width="2"
                              viewBox="0 0 24 24"
                            >
                              <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          </button>
                          <button
                            class="p-0.5 text-red-600 hover:text-red-700 hover:bg-red-50 rounded"
                            title="Abbrechen"
                            @click="cancelEdit(model.modelName, 'hdPriceLarge')"
                          >
                            <svg
                              class="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              stroke-width="2"
                              viewBox="0 0 24 24"
                            >
                              <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                d="M6 18L18 6M6 6l12 12"
                              />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        v-if="model.modelName !== 'unknown'"
                        class="text-red-600 hover:text-red-900"
                        @click="showDeleteConfirm('image', model.modelName)"
                      >
                        Löschen
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Embedding Models -->
          <div class="bg-white rounded-xl shadow overflow-hidden">
            <div class="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 class="text-lg font-semibold text-gray-800">Embedding Models</h2>
              <button
                class="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-hover"
                @click="showAddEmbeddingModal = true"
              >
                + Modell hinzufügen
              </button>
            </div>
            <div class="overflow-x-auto">
              <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                  <tr>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Modell
                    </th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Preis (€/1000 Tokens)
                    </th>
                    <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Aktionen
                    </th>
                  </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
                  <tr v-for="model in embeddingPricing" :key="model.modelName">
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {{ model.modelName }}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <div class="relative inline-block">
                        <input
                          :ref="(el) => setInputRef(model.modelName, 'pricePer1000Tokens', el)"
                          :value="
                            getEditingValue(model.modelName, 'pricePer1000Tokens') ??
                            (model.pricePer1000Tokens?.toString() || '')
                          "
                          type="text"
                          pattern="[0-9]*\.?[0-9]*"
                          inputmode="decimal"
                          class="w-32 border border-gray-300 rounded px-8 py-1 text-sm pr-8"
                          @input="
                            handleInputChange(
                              model,
                              'pricePer1000Tokens',
                              ($event.target as HTMLInputElement).value,
                            )
                          "
                          @focus="
                            startEditing(
                              model.modelName,
                              'pricePer1000Tokens',
                              model.pricePer1000Tokens,
                            )
                          "
                          @keyup.enter="confirmEdit(model, 'pricePer1000Tokens')"
                          @keyup.escape="cancelEdit(model.modelName, 'pricePer1000Tokens')"
                        />
                        <div
                          v-if="isEditing(model.modelName, 'pricePer1000Tokens')"
                          class="absolute right-1 top-1/2 -translate-y-1/2 flex gap-1"
                        >
                          <button
                            class="p-0.5 text-green-600 hover:text-green-700 hover:bg-green-50 rounded"
                            title="Bestätigen"
                            @click="confirmEdit(model, 'pricePer1000Tokens')"
                          >
                            <svg
                              class="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              stroke-width="2"
                              viewBox="0 0 24 24"
                            >
                              <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          </button>
                          <button
                            class="p-0.5 text-red-600 hover:text-red-700 hover:bg-red-50 rounded"
                            title="Abbrechen"
                            @click="cancelEdit(model.modelName, 'pricePer1000Tokens')"
                          >
                            <svg
                              class="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              stroke-width="2"
                              viewBox="0 0 24 24"
                            >
                              <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                d="M6 18L18 6M6 6l12 12"
                              />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        v-if="model.modelName !== 'unknown'"
                        class="text-red-600 hover:text-red-900"
                        @click="showDeleteConfirm('embedding', model.modelName)"
                      >
                        Löschen
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <DeleteConfirmModal
            :show="showDeleteConfirmModal"
            :model-name="deleteModelName"
            :model-type="deleteModelType || 'model'"
            @confirm="handleDeleteConfirm"
            @cancel="showDeleteConfirmModal = false"
          />

          <ResetConfirmModal
            :show="showResetConfirm"
            @confirm="handleReset"
            @cancel="showResetConfirm = false"
          />

          <!-- Add Image Model Modal -->
          <div
            v-if="showAddImageModal"
            class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            @click.self="showAddImageModal = false"
          >
            <div class="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 class="text-lg font-semibold text-gray-900 mb-4">
                Neues Image-Modell hinzufügen
              </h3>
              <div class="space-y-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Modellname</label>
                  <input
                    v-model="newImageModel.modelName"
                    type="text"
                    class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    placeholder="z.B. dall-e-4"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">
                    Standard-Preis (€/100 Bilder)
                  </label>
                  <input
                    :value="newImageModel.standardPrice?.toString() || ''"
                    type="text"
                    pattern="[0-9]*\.?[0-9]*"
                    inputmode="decimal"
                    class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    @input="
                      setInputValue(
                        newImageModel,
                        'standardPrice',
                        ($event.target as HTMLInputElement).value,
                      )
                    "
                    @keyup.enter="handleModalInputBlur(newImageModel, 'standardPrice')"
                    @blur="handleModalInputBlur(newImageModel, 'standardPrice')"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">
                    HD-Preis (€/100 Bilder)
                  </label>
                  <input
                    :value="newImageModel.hdPrice?.toString() || ''"
                    type="text"
                    pattern="[0-9]*\.?[0-9]*"
                    inputmode="decimal"
                    class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    @input="
                      setInputValue(
                        newImageModel,
                        'hdPrice',
                        ($event.target as HTMLInputElement).value,
                      )
                    "
                    @keyup.enter="handleModalInputBlur(newImageModel, 'hdPrice')"
                    @blur="handleModalInputBlur(newImageModel, 'hdPrice')"
                  />
                </div>
              </div>
              <div class="flex justify-end gap-2 mt-6">
                <button
                  class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                  @click="showAddImageModal = false"
                >
                  Abbrechen
                </button>
                <button
                  class="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-hover"
                  @click="handleAddImageModel"
                >
                  Hinzufügen
                </button>
              </div>
            </div>
          </div>

          <!-- Add Embedding Model Modal -->
          <div
            v-if="showAddEmbeddingModal"
            class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            @click.self="showAddEmbeddingModal = false"
          >
            <div class="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 class="text-lg font-semibold text-gray-900 mb-4">
                Neues Embedding-Modell hinzufügen
              </h3>
              <div class="space-y-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Modellname</label>
                  <input
                    v-model="newEmbeddingModel.modelName"
                    type="text"
                    class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    placeholder="z.B. text-embedding-4"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">
                    Preis (€/1000 Tokens)
                  </label>
                  <input
                    :value="newEmbeddingModel.pricePer1000Tokens?.toString() || ''"
                    type="text"
                    pattern="[0-9]*\.?[0-9]*"
                    inputmode="decimal"
                    class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    @input="
                      setInputValue(
                        newEmbeddingModel,
                        'pricePer1000Tokens',
                        ($event.target as HTMLInputElement).value,
                      )
                    "
                    @keyup.enter="handleModalInputBlur(newEmbeddingModel, 'pricePer1000Tokens')"
                    @blur="handleModalInputBlur(newEmbeddingModel, 'pricePer1000Tokens')"
                  />
                </div>
              </div>
              <div class="flex justify-end gap-2 mt-6">
                <button
                  class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                  @click="showAddEmbeddingModal = false"
                >
                  Abbrechen
                </button>
                <button
                  class="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-hover"
                  @click="handleAddEmbeddingModel"
                >
                  Hinzufügen
                </button>
              </div>
            </div>
          </div>
        </template>
      </main>
    </div>
  </div>
</template>
