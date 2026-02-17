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
        @click="loadPricing"
        class="mt-2 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700"
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
      <div class="flex gap-2">
        <button
          @click="showResetConfirm = true"
          class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          Auf Standard zurücksetzen
        </button>
      </div>
    </div>

    <!-- FITS-Aufschlag -->
    <div class="bg-white rounded-xl shadow p-6">
      <h2 class="text-lg font-semibold text-gray-800 mb-4">FITS-Aufschlag</h2>
      <div class="flex items-center gap-4">
        <label class="text-sm font-medium text-gray-700">Aufschlag:</label>
        <input
          v-model.number="localMarkup"
          type="number"
          step="0.01"
          min="0"
          max="1"
          class="w-32 border border-gray-300 rounded-lg px-3 py-2 text-sm"
        />
        <span class="text-sm text-gray-600">{{ (localMarkup * 100).toFixed(1) }}%</span>
        <button
          @click="saveMarkup"
          class="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-hover"
        >
          Speichern
        </button>
      </div>
    </div>

    <!-- Completion Models -->
    <div class="bg-white rounded-xl shadow overflow-hidden">
      <div class="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <h2 class="text-lg font-semibold text-gray-800">Completion Models</h2>
        <button
          @click="showAddModelModal = true"
          class="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-hover"
        >
          + Modell hinzufügen
        </button>
      </div>
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Modell</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Eingabe (€/1M Tokens)
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Ausgabe (€/1M Tokens)
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Cached Eingabe (€/1M Tokens)
              </th>
              <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Aktionen</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="model in modelPricing" :key="model.modelName">
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {{ model.modelName }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <input
                  v-model.number="model.inputPrice"
                  type="number"
                  step="0.01"
                  min="0"
                  class="w-32 border border-gray-300 rounded px-2 py-1 text-sm"
                  @blur="updateModelPricing(model)"
                />
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <input
                  v-model.number="model.outputPrice"
                  type="number"
                  step="0.01"
                  min="0"
                  class="w-32 border border-gray-300 rounded px-2 py-1 text-sm"
                  @blur="updateModelPricing(model)"
                />
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <input
                  v-model.number="model.cachedInputPrice"
                  type="number"
                  step="0.01"
                  min="0"
                  class="w-32 border border-gray-300 rounded px-2 py-1 text-sm"
                  placeholder="Optional"
                  @blur="updateModelPricing(model)"
                />
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button
                  v-if="model.modelName !== 'unknown'"
                  @click="deleteModelPricing(model.modelName)"
                  class="text-red-600 hover:text-red-900"
                >
                  Löschen
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Image Models -->
    <div class="bg-white rounded-xl shadow overflow-hidden">
      <div class="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <h2 class="text-lg font-semibold text-gray-800">Image Models</h2>
        <button
          @click="showAddImageModal = true"
          class="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-hover"
        >
          + Modell hinzufügen
        </button>
      </div>
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Modell</th>
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
              <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Aktionen</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="model in imagePricing" :key="model.modelName">
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {{ model.modelName }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <input
                  v-model.number="model.standardPrice"
                  type="number"
                  step="0.01"
                  min="0"
                  class="w-32 border border-gray-300 rounded px-2 py-1 text-sm"
                  @blur="updateImagePricing(model)"
                />
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <input
                  v-model.number="model.hdPrice"
                  type="number"
                  step="0.01"
                  min="0"
                  class="w-32 border border-gray-300 rounded px-2 py-1 text-sm"
                  @blur="updateImagePricing(model)"
                />
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <input
                  v-model.number="model.standardPriceLarge"
                  type="number"
                  step="0.01"
                  min="0"
                  class="w-32 border border-gray-300 rounded px-2 py-1 text-sm"
                  placeholder="Optional"
                  @blur="updateImagePricing(model)"
                />
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <input
                  v-model.number="model.hdPriceLarge"
                  type="number"
                  step="0.01"
                  min="0"
                  class="w-32 border border-gray-300 rounded px-2 py-1 text-sm"
                  placeholder="Optional"
                  @blur="updateImagePricing(model)"
                />
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button
                  v-if="model.modelName !== 'unknown'"
                  @click="deleteImagePricing(model.modelName)"
                  class="text-red-600 hover:text-red-900"
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
          @click="showAddEmbeddingModal = true"
          class="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-hover"
        >
          + Modell hinzufügen
        </button>
      </div>
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Modell</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Preis (€/1000 Tokens)
              </th>
              <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Aktionen</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="model in embeddingPricing" :key="model.modelName">
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {{ model.modelName }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <input
                  v-model.number="model.pricePer1000Tokens"
                  type="number"
                  step="0.000001"
                  min="0"
                  class="w-32 border border-gray-300 rounded px-2 py-1 text-sm"
                  @blur="updateEmbeddingPricing(model)"
                />
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button
                  v-if="model.modelName !== 'unknown'"
                  @click="deleteEmbeddingPricing(model.modelName)"
                  class="text-red-600 hover:text-red-900"
                >
                  Löschen
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Reset Confirmation Modal -->
    <div
      v-if="showResetConfirm"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      @click.self="showResetConfirm = false"
    >
      <div class="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">Auf Standard zurücksetzen?</h3>
        <p class="text-sm text-gray-600 mb-6">
          Alle angepassten Preise werden auf die Standardwerte zurückgesetzt. Diese Aktion kann nicht
          rückgängig gemacht werden.
        </p>
        <div class="flex justify-end gap-2">
          <button
            @click="showResetConfirm = false"
            class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Abbrechen
          </button>
          <button
            @click="handleReset"
            class="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700"
          >
            Zurücksetzen
          </button>
        </div>
      </div>
    </div>

    <!-- Add Model Modal -->
    <div
      v-if="showAddModelModal"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      @click.self="showAddModelModal = false"
    >
      <div class="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">Neues Completion-Modell hinzufügen</h3>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Modellname</label>
            <input
              v-model="newModel.modelName"
              type="text"
              class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              placeholder="z.B. gpt-4-turbo"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Eingabe-Preis (€/1M Tokens)
            </label>
            <input
              v-model.number="newModel.inputPrice"
              type="number"
              step="0.01"
              min="0"
              class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Ausgabe-Preis (€/1M Tokens)
            </label>
            <input
              v-model.number="newModel.outputPrice"
              type="number"
              step="0.01"
              min="0"
              class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Cached Eingabe-Preis (€/1M Tokens, optional)
            </label>
            <input
              v-model.number="newModel.cachedInputPrice"
              type="number"
              step="0.01"
              min="0"
              class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>
        </div>
        <div class="flex justify-end gap-2 mt-6">
          <button
            @click="showAddModelModal = false"
            class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Abbrechen
          </button>
          <button
            @click="handleAddModel"
            class="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-hover"
          >
            Hinzufügen
          </button>
        </div>
      </div>
    </div>

    <!-- Add Image Model Modal -->
    <div
      v-if="showAddImageModal"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      @click.self="showAddImageModal = false"
    >
      <div class="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">Neues Image-Modell hinzufügen</h3>
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
              v-model.number="newImageModel.standardPrice"
              type="number"
              step="0.01"
              min="0"
              class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              HD-Preis (€/100 Bilder)
            </label>
            <input
              v-model.number="newImageModel.hdPrice"
              type="number"
              step="0.01"
              min="0"
              class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>
        </div>
        <div class="flex justify-end gap-2 mt-6">
          <button
            @click="showAddImageModal = false"
            class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Abbrechen
          </button>
          <button
            @click="handleAddImageModel"
            class="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-hover"
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
        <h3 class="text-lg font-semibold text-gray-900 mb-4">Neues Embedding-Modell hinzufügen</h3>
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
              v-model.number="newEmbeddingModel.pricePer1000Tokens"
              type="number"
              step="0.000001"
              min="0"
              class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>
        </div>
        <div class="flex justify-end gap-2 mt-6">
          <button
            @click="showAddEmbeddingModal = false"
            class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Abbrechen
          </button>
          <button
            @click="handleAddEmbeddingModel"
            class="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-hover"
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

<script setup lang="ts">
import { usePricingManagement } from '@/composables/usePricingManagement'
import type {
  ModelPricing,
  ImageModelPricing,
  EmbeddingModelPricing,
} from '@/config/pricing'
import AppHeader from '@/components/layout/AppHeader.vue'
import AppSidebar from '@/components/layout/AppSidebar.vue'
import { useAuth } from '@/composables/useAuth'
import { useDebug } from '@/composables/useDebug'
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { hasPermission } from '@/auth/keycloak'

const router = useRouter()

// Prüfe Admin-Berechtigung
if (!hasPermission('canUseAdminFeatures')) {
  router.push('/')
}

const {
  userProfile,
  highestRole,
  handleLogout,
} = useAuth()

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
} = usePricingManagement()

const localMarkup = ref(markupPercentage.value)
const showResetConfirm = ref(false)
const showAddModelModal = ref(false)
const showAddImageModal = ref(false)
const showAddEmbeddingModal = ref(false)

const newModel = ref<ModelPricing>({
  modelName: '',
  inputPrice: 0,
  outputPrice: 0,
})

const newImageModel = ref<ImageModelPricing>({
  modelName: '',
  standardPrice: 0,
  hdPrice: 0,
})

const newEmbeddingModel = ref<EmbeddingModelPricing>({
  modelName: '',
  pricePer1000Tokens: 0,
})

const saveMarkup = async () => {
  markupPercentage.value = localMarkup.value
  // Speichern wird automatisch durch watch ausgelöst
}

const handleReset = async () => {
  await resetToDefaults()
  localMarkup.value = markupPercentage.value
  showResetConfirm.value = false
}

const handleAddModel = () => {
  if (newModel.value.modelName && newModel.value.inputPrice > 0 && newModel.value.outputPrice > 0) {
    addModelPricing({ ...newModel.value })
    newModel.value = { modelName: '', inputPrice: 0, outputPrice: 0 }
    showAddModelModal.value = false
  }
}

const handleAddImageModel = () => {
  if (
    newImageModel.value.modelName &&
    newImageModel.value.standardPrice > 0 &&
    newImageModel.value.hdPrice > 0
  ) {
    addImagePricing({ ...newImageModel.value })
    newImageModel.value = { modelName: '', standardPrice: 0, hdPrice: 0 }
    showAddImageModal.value = false
  }
}

const handleAddEmbeddingModel = () => {
  if (
    newEmbeddingModel.value.modelName &&
    newEmbeddingModel.value.pricePer1000Tokens > 0
  ) {
    addEmbeddingPricing({ ...newEmbeddingModel.value })
    newEmbeddingModel.value = { modelName: '', pricePer1000Tokens: 0 }
    showAddEmbeddingModal.value = false
  }
}

onMounted(async () => {
  // Preise werden bereits von usePricingManagement geladen
  // Warte kurz bis sie geladen sind
  await new Promise((resolve) => setTimeout(resolve, 100))
  localMarkup.value = markupPercentage.value
})
</script>
