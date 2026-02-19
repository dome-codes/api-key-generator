<script setup lang="ts">
import { ref, watch } from 'vue'

interface Props {
  markup: number
}

interface Emits {
  (e: 'update', value: number): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const localMarkup = ref(props.markup)
const localMarkupString = ref(String(props.markup))

watch(
  () => props.markup,
  (newValue) => {
    localMarkup.value = newValue
    localMarkupString.value = String(newValue)
  },
)

watch(localMarkup, (newValue) => {
  emit('update', newValue)
})

const handleMarkupEnter = () => {
  const num = parseFloat(localMarkupString.value)
  if (!isNaN(num) && num >= 0 && num <= 1) {
    localMarkup.value = num
    localMarkupString.value = String(num)
  } else {
    localMarkupString.value = String(localMarkup.value)
  }
}

const handleMarkupBlur = () => {
  handleMarkupEnter()
}
</script>

<template>
  <div class="bg-white rounded-xl shadow p-6">
    <h2 class="text-lg font-semibold text-gray-800 mb-4">FITS-Aufschlag</h2>
    <div class="flex items-center gap-4">
      <label class="text-sm font-medium text-gray-700">Aufschlag:</label>
      <input
        :value="localMarkupString"
        type="text"
        pattern="[0-9]*\.?[0-9]*"
        inputmode="decimal"
        class="w-32 border border-gray-300 rounded-lg px-3 py-2 text-sm"
        @input="localMarkupString = ($event.target as HTMLInputElement).value"
        @keyup.enter="handleMarkupEnter"
        @blur="handleMarkupBlur"
      />
      <span class="text-sm text-gray-600">{{ (localMarkup * 100).toFixed(1) }}%</span>
    </div>
  </div>
</template>
