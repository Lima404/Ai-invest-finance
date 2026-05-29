<template>
  <ToggleGroupRoot
    type="single"
    :model-value="modelValue"
    @update:model-value="onChange"
    class="inline-flex rounded-xl border border-line bg-surface-2 p-1"
    :class="fullWidth ? 'flex w-full' : ''"
  >
    <ToggleGroupItem
      v-for="opt in options"
      :key="opt.value"
      :value="opt.value"
      class="inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-taupe transition-colors hover:text-white data-[state=on]:bg-lime data-[state=on]:text-black data-[state=on]:font-semibold"
      :class="fullWidth ? 'flex-1' : ''"
    >
      <AppIcon v-if="opt.icon" :name="opt.icon" :size="16" />
      <span v-if="opt.label">{{ opt.label }}</span>
    </ToggleGroupItem>
  </ToggleGroupRoot>
</template>

<script setup>
import { ToggleGroupRoot, ToggleGroupItem } from 'reka-ui'
import AppIcon from './AppIcon.vue'

defineProps({
  modelValue: { type: [String, Number], default: '' },
  options: { type: Array, default: () => [] }, // [{ value, label?, icon? }]
  fullWidth: Boolean
})
const emit = defineEmits(['update:modelValue'])

// impede valor nulo (mantem sempre uma opcao ativa)
function onChange (val) {
  if (val !== null && val !== undefined) emit('update:modelValue', val)
}
</script>
