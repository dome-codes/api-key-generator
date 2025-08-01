<script setup lang="ts">
import AuthGuard from '@/components/auth/AuthGuard.vue'
import HomeView from '@/views/HomeView.vue'
</script>

<template>
  <AuthGuard>
    <HomeView />
  </AuthGuard>
</template>

<style scoped></style>
