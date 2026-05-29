<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-150"
      enter-from-class="opacity-0"
      leave-active-class="transition duration-150"
      leave-to-class="opacity-0"
    >
      <div
        v-if="state.active > 0"
        class="fixed inset-0 z-[110] flex flex-col items-center justify-center gap-4 bg-black/75 backdrop-blur-sm"
      >
        <span class="ai-spinner" />
        <span class="text-sm text-taupe">{{ state.message }}</span>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { useLoading } from '@/composables/useLoading'
const { state } = useLoading()
</script>

<style scoped>
.ai-spinner {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  border: 3px solid rgba(255, 255, 255, 0.15);
  border-top-color: #c6f806;
  animation: spin 0.8s linear infinite;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
