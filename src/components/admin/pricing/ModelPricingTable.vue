<script setup lang="ts">
import type { ModelPricing } from '@/config/pricing'
import { ref } from 'vue'

interface Props {
  models: ModelPricing[]
  isLoading?: boolean
}

interface Emits {
  (e: 'update', model: ModelPricing): void
  (e: 'delete', modelName: string): void
  (e: 'add', model: ModelPricing): void
}

const props = withDefaults(defineProps<Props>(), {
  isLoading: false,
})

const emit = defineEmits<Emits>()

// State für Editing-Management
interface EditingState {
  originalValue: number | undefined
  currentValue: string
}
const editingState = ref<Record<string, EditingState>>({})
const inputRefs = ref<Record<string, HTMLInputElement | null>>({})

// Helper-Funktionen für Editing
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

const startEditing = (model: ModelPricing, field: string) => {
  const key = getEditingKey(model.modelName, field)
  editingState.value[key] = {
    originalValue: model[field as keyof ModelPricing] as number | undefined,
    currentValue: (model[field as keyof ModelPricing] as number | undefined)?.toString() || '',
  }
}

const handleInputChange = (model: ModelPricing, field: string, value: string) => {
  const key = getEditingKey(model.modelName, field)
  if (editingState.value[key]) {
    editingState.value[key].currentValue = value
  } else {
    startEditing(model, field)
    const fallbackKey = getEditingKey(model.modelName, field)
    if (editingState.value[fallbackKey]) {
      editingState.value[fallbackKey].currentValue = value
    }
  }
}

const confirmEdit = (model: ModelPricing, field: string) => {
  const key = getEditingKey(model.modelName, field)
  const editing = editingState.value[key]
  if (!editing) return

  const num = parseFloat(editing.currentValue)
  const updatedModel = { ...model }

  if (!isNaN(num) && num >= 0) {
    updatedModel[field as keyof ModelPricing] = num as never
  } else if (
    editing.currentValue === '' ||
    editing.currentValue === null ||
    editing.currentValue === undefined
  ) {
    // Optional fields können leer sein
    if (field === 'cachedInputPrice' || field === 'reasoningPrice') {
      updatedModel[field as keyof ModelPricing] = undefined as never
    } else {
      updatedModel[field as keyof ModelPricing] = 0 as never
    }
  } else {
    // Ungültiger Wert, zurücksetzen auf Original
    updatedModel[field as keyof ModelPricing] = (editing.originalValue ?? 0) as never
  }

  emit('update', updatedModel)

  // Editing-State entfernen
  delete editingState.value[key]
}

const cancelEdit = (modelName: string, field: string) => {
  const key = getEditingKey(modelName, field)
  delete editingState.value[key]
  // Input-Feld fokussieren entfernen
  const inputRef = inputRefs.value[key]
  if (inputRef) {
    inputRef.blur()
  }
}

// Add Model Modal
const showAddModelModal = ref(false)
const newModel = ref<ModelPricing>({
  modelName: '',
  inputPrice: 0,
  outputPrice: 0,
  cachedInputPrice: undefined,
  reasoningPrice: undefined,
})

const setInputValue = (model: any, field: string, value: string) => {
  model[field] = value
}

const handleModalInputBlur = (model: any, field: string) => {
  const value = model[field]
  if (typeof value === 'string') {
    const num = parseFloat(value)
    if (!isNaN(num) && num >= 0) {
      model[field] = num
    } else if (value === '' || value === null || value === undefined) {
      if (field === 'cachedInputPrice' || field === 'reasoningPrice') {
        model[field] = undefined
      } else {
        model[field] = 0
      }
    } else {
      const current = model[field]
      model[field] = typeof current === 'number' ? current : 0
    }
  }
}

const handleAddModel = () => {
  const inputPrice =
    typeof newModel.value.inputPrice === 'string'
      ? parseFloat(newModel.value.inputPrice)
      : newModel.value.inputPrice
  const outputPrice =
    typeof newModel.value.outputPrice === 'string'
      ? parseFloat(newModel.value.outputPrice)
      : newModel.value.outputPrice
  const cachedInputPrice =
    typeof newModel.value.cachedInputPrice === 'string'
      ? newModel.value.cachedInputPrice === ''
        ? undefined
        : parseFloat(newModel.value.cachedInputPrice)
      : newModel.value.cachedInputPrice
  const reasoningPrice =
    typeof newModel.value.reasoningPrice === 'string'
      ? newModel.value.reasoningPrice === ''
        ? undefined
        : parseFloat(newModel.value.reasoningPrice)
      : newModel.value.reasoningPrice

  if (
    newModel.value.modelName &&
    !isNaN(inputPrice) &&
    inputPrice > 0 &&
    !isNaN(outputPrice) &&
    outputPrice > 0
  ) {
    emit('add', {
      modelName: newModel.value.modelName,
      inputPrice,
      outputPrice,
      cachedInputPrice: isNaN(cachedInputPrice as number) ? undefined : cachedInputPrice,
      reasoningPrice: isNaN(reasoningPrice as number) ? undefined : reasoningPrice,
    })
    newModel.value = {
      modelName: '',
      inputPrice: 0,
      outputPrice: 0,
      cachedInputPrice: undefined,
      reasoningPrice: undefined,
    }
    showAddModelModal.value = false
  }
}
</script>

<template>
  <div class="bg-white rounded-xl shadow overflow-hidden">
    <div class="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
      <h2 class="text-lg font-semibold text-gray-800">Completion Models</h2>
      <button
        class="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-hover"
        @click="showAddModelModal = true"
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
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Reasoning (€/1M Tokens)
            </th>
            <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
              Aktionen
            </th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          <tr v-for="model in models" :key="model.modelName">
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
              {{ model.modelName }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <div class="relative inline-block">
                <input
                  :ref="(el) => setInputRef(model.modelName, 'inputPrice', el)"
                  :value="
                    getEditingValue(model.modelName, 'inputPrice') ??
                    (model.inputPrice?.toString() || '')
                  "
                  type="text"
                  pattern="[0-9]*\.?[0-9]*"
                  inputmode="decimal"
                  class="w-32 border border-gray-300 rounded px-8 py-1 text-sm pr-8"
                  @input="
                    handleInputChange(
                      model,
                      'inputPrice',
                      ($event.target as HTMLInputElement).value,
                    )
                  "
                  @focus="startEditing(model, 'inputPrice')"
                  @keyup.enter="confirmEdit(model, 'inputPrice')"
                  @keyup.escape="cancelEdit(model.modelName, 'inputPrice')"
                />
                <div
                  v-if="isEditing(model.modelName, 'inputPrice')"
                  class="absolute right-1 top-1/2 -translate-y-1/2 flex gap-1"
                >
                  <button
                    class="p-0.5 text-green-600 hover:text-green-700 hover:bg-green-50 rounded"
                    title="Bestätigen"
                    @click="confirmEdit(model, 'inputPrice')"
                  >
                    <svg
                      class="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      viewBox="0 0 24 24"
                    >
                      <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </button>
                  <button
                    class="p-0.5 text-red-600 hover:text-red-700 hover:bg-red-50 rounded"
                    title="Abbrechen"
                    @click="cancelEdit(model.modelName, 'inputPrice')"
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
                  :ref="(el) => setInputRef(model.modelName, 'outputPrice', el)"
                  :value="
                    getEditingValue(model.modelName, 'outputPrice') ??
                    (model.outputPrice?.toString() || '')
                  "
                  type="text"
                  pattern="[0-9]*\.?[0-9]*"
                  inputmode="decimal"
                  class="w-32 border border-gray-300 rounded px-8 py-1 text-sm pr-8"
                  @input="
                    handleInputChange(
                      model,
                      'outputPrice',
                      ($event.target as HTMLInputElement).value,
                    )
                  "
                  @focus="startEditing(model, 'outputPrice')"
                  @keyup.enter="confirmEdit(model, 'outputPrice')"
                  @keyup.escape="cancelEdit(model.modelName, 'outputPrice')"
                />
                <div
                  v-if="isEditing(model.modelName, 'outputPrice')"
                  class="absolute right-1 top-1/2 -translate-y-1/2 flex gap-1"
                >
                  <button
                    class="p-0.5 text-green-600 hover:text-green-700 hover:bg-green-50 rounded"
                    title="Bestätigen"
                    @click="confirmEdit(model, 'outputPrice')"
                  >
                    <svg
                      class="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      viewBox="0 0 24 24"
                    >
                      <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </button>
                  <button
                    class="p-0.5 text-red-600 hover:text-red-700 hover:bg-red-50 rounded"
                    title="Abbrechen"
                    @click="cancelEdit(model.modelName, 'outputPrice')"
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
                  :ref="(el) => setInputRef(model.modelName, 'cachedInputPrice', el)"
                  :value="
                    getEditingValue(model.modelName, 'cachedInputPrice') ??
                    (model.cachedInputPrice?.toString() || '')
                  "
                  type="text"
                  pattern="[0-9]*\.?[0-9]*"
                  inputmode="decimal"
                  class="w-32 border border-gray-300 rounded px-8 py-1 text-sm pr-8"
                  placeholder="Optional"
                  @input="
                    handleInputChange(
                      model,
                      'cachedInputPrice',
                      ($event.target as HTMLInputElement).value,
                    )
                  "
                  @focus="startEditing(model, 'cachedInputPrice')"
                  @keyup.enter="confirmEdit(model, 'cachedInputPrice')"
                  @keyup.escape="cancelEdit(model.modelName, 'cachedInputPrice')"
                />
                <div
                  v-if="isEditing(model.modelName, 'cachedInputPrice')"
                  class="absolute right-1 top-1/2 -translate-y-1/2 flex gap-1"
                >
                  <button
                    class="p-0.5 text-green-600 hover:text-green-700 hover:bg-green-50 rounded"
                    title="Bestätigen"
                    @click="confirmEdit(model, 'cachedInputPrice')"
                  >
                    <svg
                      class="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      viewBox="0 0 24 24"
                    >
                      <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </button>
                  <button
                    class="p-0.5 text-red-600 hover:text-red-700 hover:bg-red-50 rounded"
                    title="Abbrechen"
                    @click="cancelEdit(model.modelName, 'cachedInputPrice')"
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
                  :ref="(el) => setInputRef(model.modelName, 'reasoningPrice', el)"
                  :value="
                    getEditingValue(model.modelName, 'reasoningPrice') ??
                    (model.reasoningPrice?.toString() || '')
                  "
                  type="text"
                  pattern="[0-9]*\.?[0-9]*"
                  inputmode="decimal"
                  class="w-32 border border-gray-300 rounded px-8 py-1 text-sm pr-8"
                  placeholder="Optional"
                  @input="
                    handleInputChange(
                      model,
                      'reasoningPrice',
                      ($event.target as HTMLInputElement).value,
                    )
                  "
                  @focus="startEditing(model, 'reasoningPrice')"
                  @keyup.enter="confirmEdit(model, 'reasoningPrice')"
                  @keyup.escape="cancelEdit(model.modelName, 'reasoningPrice')"
                />
                <div
                  v-if="isEditing(model.modelName, 'reasoningPrice')"
                  class="absolute right-1 top-1/2 -translate-y-1/2 flex gap-1"
                >
                  <button
                    class="p-0.5 text-green-600 hover:text-green-700 hover:bg-green-50 rounded"
                    title="Bestätigen"
                    @click="confirmEdit(model, 'reasoningPrice')"
                  >
                    <svg
                      class="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      viewBox="0 0 24 24"
                    >
                      <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </button>
                  <button
                    class="p-0.5 text-red-600 hover:text-red-700 hover:bg-red-50 rounded"
                    title="Abbrechen"
                    @click="cancelEdit(model.modelName, 'reasoningPrice')"
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
                @click="emit('delete', model.modelName)"
              >
                Löschen
              </button>
            </td>
          </tr>
        </tbody>
      </table>
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
              :value="newModel.inputPrice?.toString() || ''"
              type="text"
              pattern="[0-9]*\.?[0-9]*"
              inputmode="decimal"
              class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              @input="
                setInputValue(newModel, 'inputPrice', ($event.target as HTMLInputElement).value)
              "
              @keyup.enter="handleModalInputBlur(newModel, 'inputPrice')"
              @blur="handleModalInputBlur(newModel, 'inputPrice')"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Ausgabe-Preis (€/1M Tokens)
            </label>
            <input
              :value="newModel.outputPrice?.toString() || ''"
              type="text"
              pattern="[0-9]*\.?[0-9]*"
              inputmode="decimal"
              class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              @input="
                setInputValue(newModel, 'outputPrice', ($event.target as HTMLInputElement).value)
              "
              @keyup.enter="handleModalInputBlur(newModel, 'outputPrice')"
              @blur="handleModalInputBlur(newModel, 'outputPrice')"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Cached Eingabe-Preis (€/1M Tokens, optional)
            </label>
            <input
              :value="newModel.cachedInputPrice?.toString() || ''"
              type="text"
              pattern="[0-9]*\.?[0-9]*"
              inputmode="decimal"
              class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              placeholder="Optional"
              @input="
                setInputValue(
                  newModel,
                  'cachedInputPrice',
                  ($event.target as HTMLInputElement).value,
                )
              "
              @keyup.enter="handleModalInputBlur(newModel, 'cachedInputPrice')"
              @blur="handleModalInputBlur(newModel, 'cachedInputPrice')"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Reasoning-Preis (€/1M Tokens, optional)
            </label>
            <input
              :value="newModel.reasoningPrice?.toString() || ''"
              type="text"
              pattern="[0-9]*\.?[0-9]*"
              inputmode="decimal"
              class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              placeholder="Falls Reasoning-Tokens separat berechnet werden sollen"
              @input="
                setInputValue(newModel, 'reasoningPrice', ($event.target as HTMLInputElement).value)
              "
              @keyup.enter="handleModalInputBlur(newModel, 'reasoningPrice')"
              @blur="handleModalInputBlur(newModel, 'reasoningPrice')"
            />
          </div>
        </div>
        <div class="flex justify-end gap-2 mt-6">
          <button
            class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            @click="showAddModelModal = false"
          >
            Abbrechen
          </button>
          <button
            class="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-hover"
            @click="handleAddModel"
          >
            Hinzufügen
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
