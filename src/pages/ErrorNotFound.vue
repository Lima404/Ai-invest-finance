<template>
  <div class="flex min-h-screen flex-col items-center justify-center bg-app-gradient text-center">
    <BrandLogo :size="48" :show-text="false" class="mb-4" />
    <p class="font-display text-6xl text-lime">404</p>
    <p class="mb-6 text-taupe">Página não encontrada.</p>
    <RouterLink :to="{ name: 'dashboard' }" class="btn-primary">Voltar ao dashboard</RouterLink>
  </div>
</template>

<script setup>
import { RouterLink } from 'vue-router'
import BrandLogo from '@/components/BrandLogo.vue'
</script>
