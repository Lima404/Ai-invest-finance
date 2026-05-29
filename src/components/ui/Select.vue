<template>
  <SelectRoot :model-value="modelValue" :disabled="disabled" @update:model-value="$emit('update:modelValue', $event)">
    <SelectTrigger
      class="field flex items-center justify-between gap-2 data-[placeholder]:text-taupe/60 data-[disabled]:opacity-50 data-[disabled]:cursor-not-allowed"
      :class="triggerClass"
      :aria-label="placeholder"
    >
      <span class="flex items-center gap-2 truncate">
        <AppIcon v-if="iconFor && currentIcon" :name="currentIcon" :size="18" :style="{ color: currentColor }" />
        <SelectValue :placeholder="placeholder" />
      </span>
      <SelectIcon class="shrink-0 text-taupe">
        <AppIcon name="expand_more" :size="18" />
      </SelectIcon>
    </SelectTrigger>

    <SelectPortal>
      <SelectContent
        class="ai-pop z-[60] max-h-72 min-w-[var(--reka-select-trigger-width)] overflow-hidden rounded-xl border border-line bg-surface-2 shadow-2xl"
        position="popper"
        :side-offset="6"
      >
        <SelectViewport class="p-1">
          <SelectItem
            v-for="opt in normalized"
            :key="opt.value"
            :value="opt.value"
            class="relative flex cursor-pointer select-none items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-white outline-none data-[highlighted]:bg-white/8 data-[state=checked]:text-lime"
          >
            <AppIcon v-if="iconFor" :name="iconFor(opt.value)" :size="18" :style="{ color: colorFor ? colorFor(opt.value) : undefined }" />
            <SelectItemText>{{ opt.label }}</SelectItemText>
            <SelectItemIndicator class="ml-auto">
              <AppIcon name="check" :size="16" />
            </SelectItemIndicator>
          </SelectItem>
        </SelectViewport>
      </SelectContent>
    </SelectPortal>
  </SelectRoot>
</template>

<script setup>
import { computed } from 'vue'
import {
  SelectRoot, SelectTrigger, SelectValue, SelectIcon, SelectPortal,
  SelectContent, SelectViewport, SelectItem, SelectItemText, SelectItemIndicator
} from 'reka-ui'
import AppIcon from './AppIcon.vue'

const props = defineProps({
  modelValue: { type: [String, Number, null], default: null },
  options: { type: Array, default: () => [] }, // string[] ou {label,value}[]
  placeholder: { type: String, default: 'Selecione...' },
  disabled: { type: Boolean, default: false },
  triggerClass: { type: String, default: '' },
  iconFor: { type: Function, default: null },
  colorFor: { type: Function, default: null }
})
defineEmits(['update:modelValue'])

const normalized = computed(() =>
  props.options.map((o) => (typeof o === 'object' ? o : { label: o, value: o }))
)
const currentIcon = computed(() => (props.iconFor ? props.iconFor(props.modelValue) : null))
const currentColor = computed(() => (props.colorFor ? props.colorFor(props.modelValue) : undefined))
</script>
