<template>
  <Teleport to="body">
    <div class="fixed bottom-5 right-5 z-[100] flex w-80 max-w-[92vw] flex-col gap-2">
      <TransitionGroup
        enter-active-class="transition duration-200 ease-out"
        enter-from-class="translate-x-6 opacity-0"
        leave-active-class="transition duration-150 ease-in absolute"
        leave-to-class="translate-x-6 opacity-0"
      >
        <div
          v-for="t in state.items"
          :key="t.id"
          class="flex items-center gap-3 rounded-xl border px-4 py-3 shadow-2xl backdrop-blur-md cursor-pointer"
          :class="styles(t.variant)"
          @click="dismiss(t.id)"
        >
          <AppIcon v-if="t.icon" :name="t.icon" :size="20" :class="iconColor(t.variant)" />
          <span class="text-sm">{{ t.message }}</span>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup>
import { useToast } from '@/composables/useToast'
import AppIcon from './AppIcon.vue'

const { state, dismiss } = useToast()

function styles (v) {
  if (v === 'success') return 'bg-surface-2/90 border-lime/40 text-white'
  if (v === 'error') return 'bg-surface-2/90 border-danger/50 text-white'
  if (v === 'warning') return 'bg-surface-2/90 border-warn/50 text-white'
  return 'bg-surface-2/90 border-line text-white'
}
function iconColor (v) {
  if (v === 'success') return 'text-lime'
  if (v === 'error') return 'text-danger'
  if (v === 'warning') return 'text-warn'
  return 'text-info'
}
</script>
