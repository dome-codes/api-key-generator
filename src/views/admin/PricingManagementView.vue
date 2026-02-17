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
              <strong>Speicherung:</strong> Änderungen werden automatisch gespeichert (Enter-Taste oder Fokus-Verlust).
              Verwenden Sie die Download/Upload-Funktionen, um Preise als JSON-Datei zu exportieren oder zu importieren.
            </p>
            <p class="mt-2">
              <strong>Reasoning-Tokens:</strong> Werden aktuell zu Output-Tokens addiert. Falls Sie einen separaten Reasoning-Preis
              definieren, wird dieser verwendet (sobald die Berechnung angepasst ist).
            </p>
          </div>
        </div>
      </div>
    </div>

    <div class="flex items-center justify-between">
      <div></div>
      <div class="flex gap-2">
        <label class="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-hover cursor-pointer flex items-center gap-2">
          <input
            type="file"
            accept=".json"
            @change="handleFileUpload"
            class="hidden"
            ref="fileInputRef"
          />
          <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          Preise hochladen
        </label>
        <button
          @click="savePricing"
          class="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-hover flex items-center gap-2"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Preise herunterladen
        </button>
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
          :value="localMarkupString"
          @input="localMarkupString = ($event.target as HTMLInputElement).value"
          type="text"
          pattern="[0-9]*\.?[0-9]*"
          inputmode="decimal"
          class="w-32 border border-gray-300 rounded-lg px-3 py-2 text-sm"
          @keyup.enter="handleMarkupEnter"
          @blur="handleMarkupBlur"
        />
        <span class="text-sm text-gray-600">{{ (localMarkup * 100).toFixed(1) }}%</span>
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
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Reasoning (€/1M Tokens)
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
                  :value="model.inputPrice?.toString() || ''"
                  @input="setInputValue(model, 'inputPrice', ($event.target as HTMLInputElement).value)"
                  type="text"
                  pattern="[0-9]*\.?[0-9]*"
                  inputmode="decimal"
                  class="w-32 border border-gray-300 rounded px-2 py-1 text-sm"
                  @keyup.enter="handleInputBlur(model, 'inputPrice')"
                  @blur="handleInputBlur(model, 'inputPrice')"
                />
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <input
                  :value="model.outputPrice?.toString() || ''"
                  @input="setInputValue(model, 'outputPrice', ($event.target as HTMLInputElement).value)"
                  type="text"
                  pattern="[0-9]*\.?[0-9]*"
                  inputmode="decimal"
                  class="w-32 border border-gray-300 rounded px-2 py-1 text-sm"
                  @keyup.enter="handleInputBlur(model, 'outputPrice')"
                  @blur="handleInputBlur(model, 'outputPrice')"
                />
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <input
                  :value="model.cachedInputPrice?.toString() || ''"
                  @input="setInputValue(model, 'cachedInputPrice', ($event.target as HTMLInputElement).value)"
                  type="text"
                  pattern="[0-9]*\.?[0-9]*"
                  inputmode="decimal"
                  class="w-32 border border-gray-300 rounded px-2 py-1 text-sm"
                  placeholder="Optional"
                  @keyup.enter="handleInputBlur(model, 'cachedInputPrice')"
                  @blur="handleInputBlur(model, 'cachedInputPrice')"
                />
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <input
                  :value="model.reasoningPrice?.toString() || ''"
                  @input="setInputValue(model, 'reasoningPrice', ($event.target as HTMLInputElement).value)"
                  type="text"
                  pattern="[0-9]*\.?[0-9]*"
                  inputmode="decimal"
                  class="w-32 border border-gray-300 rounded px-2 py-1 text-sm"
                  placeholder="Optional"
                  @keyup.enter="handleInputBlur(model, 'reasoningPrice')"
                  @blur="handleInputBlur(model, 'reasoningPrice')"
                />
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button
                  v-if="model.modelName !== 'unknown'"
                  @click="showDeleteConfirm('model', model.modelName)"
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
                  :value="model.standardPrice?.toString() || ''"
                  @input="setInputValue(model, 'standardPrice', ($event.target as HTMLInputElement).value)"
                  type="text"
                  pattern="[0-9]*\.?[0-9]*"
                  inputmode="decimal"
                  class="w-32 border border-gray-300 rounded px-2 py-1 text-sm"
                  @keyup.enter="handleInputBlur(model, 'standardPrice')"
                  @blur="handleInputBlur(model, 'standardPrice')"
                />
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <input
                  :value="model.hdPrice?.toString() || ''"
                  @input="setInputValue(model, 'hdPrice', ($event.target as HTMLInputElement).value)"
                  type="text"
                  pattern="[0-9]*\.?[0-9]*"
                  inputmode="decimal"
                  class="w-32 border border-gray-300 rounded px-2 py-1 text-sm"
                  @keyup.enter="handleInputBlur(model, 'hdPrice')"
                  @blur="handleInputBlur(model, 'hdPrice')"
                />
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <input
                  :value="model.standardPriceLarge?.toString() || ''"
                  @input="setInputValue(model, 'standardPriceLarge', ($event.target as HTMLInputElement).value)"
                  type="text"
                  pattern="[0-9]*\.?[0-9]*"
                  inputmode="decimal"
                  class="w-32 border border-gray-300 rounded px-2 py-1 text-sm"
                  placeholder="Optional"
                  @keyup.enter="handleInputBlur(model, 'standardPriceLarge')"
                  @blur="handleInputBlur(model, 'standardPriceLarge')"
                />
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <input
                  :value="model.hdPriceLarge?.toString() || ''"
                  @input="setInputValue(model, 'hdPriceLarge', ($event.target as HTMLInputElement).value)"
                  type="text"
                  pattern="[0-9]*\.?[0-9]*"
                  inputmode="decimal"
                  class="w-32 border border-gray-300 rounded px-2 py-1 text-sm"
                  placeholder="Optional"
                  @keyup.enter="handleInputBlur(model, 'hdPriceLarge')"
                  @blur="handleInputBlur(model, 'hdPriceLarge')"
                />
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button
                  v-if="model.modelName !== 'unknown'"
                  @click="showDeleteConfirm('image', model.modelName)"
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
                  :value="model.pricePer1000Tokens?.toString() || ''"
                  @input="setInputValue(model, 'pricePer1000Tokens', ($event.target as HTMLInputElement).value)"
                  type="text"
                  pattern="[0-9]*\.?[0-9]*"
                  inputmode="decimal"
                  class="w-32 border border-gray-300 rounded px-2 py-1 text-sm"
                  @keyup.enter="handleInputBlur(model, 'pricePer1000Tokens')"
                  @blur="handleInputBlur(model, 'pricePer1000Tokens')"
                />
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button
                  v-if="model.modelName !== 'unknown'"
                  @click="showDeleteConfirm('embedding', model.modelName)"
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

    <!-- Delete Confirmation Modal -->
    <div
      v-if="showDeleteConfirmModal"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      @click.self="showDeleteConfirmModal = false"
    >
      <div class="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">Modell wirklich löschen?</h3>
        <p class="text-sm text-gray-600 mb-6">
          Möchten Sie das Modell <strong>{{ deleteModelName }}</strong> wirklich löschen? Diese Aktion kann nicht
          rückgängig gemacht werden.
        </p>
        <div class="flex justify-end gap-2">
          <button
            @click="showDeleteConfirmModal = false"
            class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Abbrechen
          </button>
          <button
            @click="handleDeleteConfirm"
            class="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700"
          >
            Löschen
          </button>
        </div>
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
              :value="newModel.inputPrice?.toString() || ''"
              @input="setInputValue(newModel, 'inputPrice', ($event.target as HTMLInputElement).value)"
              type="text"
              pattern="[0-9]*\.?[0-9]*"
              inputmode="decimal"
              class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
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
              @input="setInputValue(newModel, 'outputPrice', ($event.target as HTMLInputElement).value)"
              type="text"
              pattern="[0-9]*\.?[0-9]*"
              inputmode="decimal"
              class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
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
              @input="setInputValue(newModel, 'cachedInputPrice', ($event.target as HTMLInputElement).value)"
              type="text"
              pattern="[0-9]*\.?[0-9]*"
              inputmode="decimal"
              class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              placeholder="Optional"
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
              @input="setInputValue(newModel, 'reasoningPrice', ($event.target as HTMLInputElement).value)"
              type="text"
              pattern="[0-9]*\.?[0-9]*"
              inputmode="decimal"
              class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              placeholder="Falls Reasoning-Tokens separat berechnet werden sollen"
              @keyup.enter="handleModalInputBlur(newModel, 'reasoningPrice')"
              @blur="handleModalInputBlur(newModel, 'reasoningPrice')"
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
              :value="newImageModel.standardPrice?.toString() || ''"
              @input="setInputValue(newImageModel, 'standardPrice', ($event.target as HTMLInputElement).value)"
              type="text"
              pattern="[0-9]*\.?[0-9]*"
              inputmode="decimal"
              class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
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
              @input="setInputValue(newImageModel, 'hdPrice', ($event.target as HTMLInputElement).value)"
              type="text"
              pattern="[0-9]*\.?[0-9]*"
              inputmode="decimal"
              class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              @keyup.enter="handleModalInputBlur(newImageModel, 'hdPrice')"
              @blur="handleModalInputBlur(newImageModel, 'hdPrice')"
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
              :value="newEmbeddingModel.pricePer1000Tokens?.toString() || ''"
              @input="setInputValue(newEmbeddingModel, 'pricePer1000Tokens', ($event.target as HTMLInputElement).value)"
              type="text"
              pattern="[0-9]*\.?[0-9]*"
              inputmode="decimal"
              class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              @keyup.enter="handleModalInputBlur(newEmbeddingModel, 'pricePer1000Tokens')"
              @blur="handleModalInputBlur(newEmbeddingModel, 'pricePer1000Tokens')"
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
import { ref, onMounted, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { hasPermission } from '@/auth/keycloak'
import { pricingService } from '@/services/pricingService'

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
  savePricing,
  uploadPricing,
} = usePricingManagement()

const localMarkup = ref(markupPercentage.value)
const localMarkupString = ref(String(markupPercentage.value))
const fileInputRef = ref<HTMLInputElement | null>(null)
const showResetConfirm = ref(false)
const showDeleteConfirmModal = ref(false)
const deleteModelType = ref<'model' | 'image' | 'embedding' | null>(null)
const deleteModelName = ref<string>('')
const showAddModelModal = ref(false)
const showAddImageModal = ref(false)
const showAddEmbeddingModal = ref(false)

const newModel = ref<ModelPricing>({
  modelName: '',
  inputPrice: 0,
  outputPrice: 0,
  cachedInputPrice: undefined,
  reasoningPrice: undefined,
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

// Hilfsfunktion für Input-Zuweisung (umgeht TypeScript-Fehler)
const setInputValue = (model: any, field: string, value: string) => {
  model[field] = value
}

// Konvertiert String zu Number und speichert automatisch
const handleMarkupEnter = () => {
  const num = parseFloat(localMarkupString.value)
  if (!isNaN(num) && num >= 0 && num <= 1) {
    localMarkup.value = num
    markupPercentage.value = num
    localMarkupString.value = String(num)
  } else {
    localMarkupString.value = String(localMarkup.value)
  }
}

const handleMarkupBlur = () => {
  handleMarkupEnter()
}

// Konvertiert String-Input zu Number für alle Preis-Felder
const handleInputBlur = (model: any, field: string) => {
  const value = model[field]
  if (typeof value === 'string') {
    const num = parseFloat(value)
    if (!isNaN(num) && num >= 0) {
      model[field] = num
    } else if (value === '' || value === null || value === undefined) {
      // Optional fields können leer sein
      if (field === 'cachedInputPrice' || field === 'reasoningPrice' || field === 'standardPriceLarge' || field === 'hdPriceLarge') {
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
  // Automatisch speichern basierend auf Modell-Typ
  if ('inputPrice' in model || 'outputPrice' in model) {
    updateModelPricing(model)
  } else if ('standardPrice' in model || 'hdPrice' in model) {
    updateImagePricing(model)
  } else if ('pricePer1000Tokens' in model) {
    updateEmbeddingPricing(model)
  }
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
      if (field === 'cachedInputPrice' || field === 'reasoningPrice' || field === 'standardPriceLarge' || field === 'hdPriceLarge') {
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

const handleFileUpload = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  try {
    await uploadPricing(file)
    // Cache zurücksetzen, damit neue Daten geladen werden
    pricingService.reloadPricing()
    // File input zurücksetzen
    if (fileInputRef.value) {
      fileInputRef.value.value = ''
    }
  } catch (error) {
    console.error('Fehler beim Hochladen:', error)
    alert(error instanceof Error ? error.message : 'Fehler beim Hochladen der Datei')
  }
}

const handleReset = async () => {
  await resetToDefaults()
  localMarkup.value = markupPercentage.value
  showResetConfirm.value = false
}

const handleAddModel = () => {
  // Konvertiere Strings zu Numbers
  const inputPrice = typeof newModel.value.inputPrice === 'string' 
    ? parseFloat(newModel.value.inputPrice) 
    : newModel.value.inputPrice
  const outputPrice = typeof newModel.value.outputPrice === 'string' 
    ? parseFloat(newModel.value.outputPrice) 
    : newModel.value.outputPrice
  const cachedInputPrice = typeof newModel.value.cachedInputPrice === 'string'
    ? (newModel.value.cachedInputPrice === '' ? undefined : parseFloat(newModel.value.cachedInputPrice))
    : newModel.value.cachedInputPrice
  const reasoningPrice = typeof newModel.value.reasoningPrice === 'string'
    ? (newModel.value.reasoningPrice === '' ? undefined : parseFloat(newModel.value.reasoningPrice))
    : newModel.value.reasoningPrice

  if (newModel.value.modelName && !isNaN(inputPrice) && inputPrice > 0 && !isNaN(outputPrice) && outputPrice > 0) {
    addModelPricing({
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

const handleAddImageModel = () => {
  const standardPrice = typeof newImageModel.value.standardPrice === 'string'
    ? parseFloat(newImageModel.value.standardPrice)
    : newImageModel.value.standardPrice
  const hdPrice = typeof newImageModel.value.hdPrice === 'string'
    ? parseFloat(newImageModel.value.hdPrice)
    : newImageModel.value.hdPrice

  if (
    newImageModel.value.modelName &&
    !isNaN(standardPrice) && standardPrice > 0 &&
    !isNaN(hdPrice) && hdPrice > 0
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
  const pricePer1000Tokens = typeof newEmbeddingModel.value.pricePer1000Tokens === 'string'
    ? parseFloat(newEmbeddingModel.value.pricePer1000Tokens)
    : newEmbeddingModel.value.pricePer1000Tokens

  if (
    newEmbeddingModel.value.modelName &&
    !isNaN(pricePer1000Tokens) && pricePer1000Tokens > 0
  ) {
    addEmbeddingPricing({
      modelName: newEmbeddingModel.value.modelName,
      pricePer1000Tokens,
    })
    newEmbeddingModel.value = { modelName: '', pricePer1000Tokens: 0 }
    showAddEmbeddingModal.value = false
  }
}

// Watch für automatisches Speichern des Markup
watch(localMarkup, (newValue) => {
  markupPercentage.value = newValue
})

onMounted(async () => {
  // Preise werden bereits von usePricingManagement geladen
  // Warte kurz bis sie geladen sind
  await new Promise((resolve) => setTimeout(resolve, 100))
  localMarkup.value = markupPercentage.value
  localMarkupString.value = String(markupPercentage.value)
})
</script>
