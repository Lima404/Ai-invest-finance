<template>
  <div class="p-5 h-full" :class="accent ? 'ai-card-accent' : 'ai-card'">
    <div class="flex items-start gap-3">
      <div class="flex-1">
        <p class="text-xs uppercase tracking-wide text-taupe">{{ label }}</p>
        <p class="font-display text-2xl mt-1" :style="{ color }">{{ formatBRL(value) }}</p>
        <p v-if="hint" class="mt-1 text-xs text-taupe">{{ hint }}</p>
      </div>
      <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-white/5" :style="{ color }">
        <AppIcon :name="icon" :size="26" />
      </div>
    </div>
  </div>
</template>

<script setup>
import AppIcon from '@/components/ui/AppIcon.vue'
import { formatBRL } from '@/utils/format'

defineProps({
  label: String,
  value: { type: Number, default: 0 },
  icon: { type: String, default: 'paid' },
  color: { type: String, default: '#FFFFFF' },
  hint: String,
  accent: Boolean
})
</script>
