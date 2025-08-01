<template>
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
    <UsageCapabilityCard
      title="Chat Completions"
      :requests="174"
      :chartHeights="[
        '20%',
        '40%',
        '20%',
        '80%',
        '20%',
        '40%',
        '20%',
        '60%',
        '20%',
        '40%',
        '20%',
        '60%',
      ]"
      footer="763.171K total tokens"
      :tokens-in="763171"
      :tokens-out="456789"
    />
    <UsageCapabilityCard
      title="Images"
      :requests="1"
      :chartHeights="[
        '20%',
        '20%',
        '20%',
        '20%',
        '20%',
        '20%',
        '80%',
        '20%',
        '20%',
        '20%',
        '20%',
        '20%',
      ]"
      footer="1 image"
      :tokens-in="0"
      :tokens-out="0"
    />
    <UsageCapabilityCard
      title="Web Searches"
      :requests="0"
      :chartHeights="[
        '20%',
        '20%',
        '20%',
        '20%',
        '20%',
        '20%',
        '20%',
        '20%',
        '20%',
        '20%',
        '20%',
        '20%',
      ]"
      footer="0"
      :tokens-in="0"
      :tokens-out="0"
    />
    <UsageCapabilityCard
      title="File Searches"
      :requests="0"
      :chartHeights="[
        '20%',
        '60%',
        '20%',
        '20%',
        '20%',
        '20%',
        '20%',
        '20%',
        '20%',
        '20%',
        '20%',
        '20%',
      ]"
      footer="0"
      :tokens-in="0"
      :tokens-out="0"
    />
  </div>
</template>

<script setup lang="ts">
import UsageCapabilityCard from './UsageCapabilityCard.vue'
</script>
