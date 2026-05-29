<template>
  <ProgressRoot
    :model-value="clamped"
    class="relative h-2.5 w-full overflow-hidden rounded-full bg-surface-3"
    :style="{ height: size + 'px' }"
  >
    <ProgressIndicator
      class="h-full rounded-full transition-all duration-500"
      :class="barClass"
      :style="{ width: clamped + '%', background: color }"
    />
  </ProgressRoot>
</template>

<script setup>
import { computed } from 'vue'
import { ProgressRoot, ProgressIndicator } from 'reka-ui'

const props = defineProps({
  value: { type: Number, default: 0 }, // 0-100
  size: { type: Number, default: 10 },
  color: { type: String, default: '' },
  barClass: { type: String, default: '' }
})

const clamped = computed(() => Math.max(0, Math.min(100, props.value)))
</script>
