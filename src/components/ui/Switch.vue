<template>
  <label class="inline-flex items-center gap-2 cursor-pointer select-none">
    <SwitchRoot
      :model-value="modelValue"
      @update:model-value="$emit('update:modelValue', $event)"
      class="relative h-5 w-9 rounded-full border border-line bg-surface-3 transition-colors data-[state=checked]:bg-lime data-[state=checked]:border-lime"
    >
      <SwitchThumb
        class="block h-4 w-4 translate-x-0.5 rounded-full bg-taupe transition-transform data-[state=checked]:translate-x-[18px] data-[state=checked]:bg-black"
      />
    </SwitchRoot>
    <span v-if="label" class="text-sm text-taupe">{{ label }}</span>
  </label>
</template>

<script setup>
import { SwitchRoot, SwitchThumb } from 'reka-ui'

defineProps({
  modelValue: Boolean,
  label: { type: String, default: '' }
})
defineEmits(['update:modelValue'])
</script>
