<template>
  <DialogRoot :open="open" @update:open="$emit('update:open', $event)">
    <DialogPortal>
      <DialogOverlay class="ai-overlay fixed inset-0 z-40 bg-black/70 backdrop-blur-sm" />
      <DialogContent
        class="ai-pop fixed left-1/2 top-1/2 z-50 w-[480px] max-w-[92vw] -translate-x-1/2 -translate-y-1/2 ai-card p-0 shadow-2xl focus:outline-none"
        :class="contentClass"
        @open-auto-focus="$emit('open-auto-focus', $event)"
      >
        <div class="flex items-center justify-between border-b border-line px-5 py-4">
          <DialogTitle class="font-display text-lg">{{ title }}</DialogTitle>
          <DialogDescription v-if="description" class="sr-only">{{ description }}</DialogDescription>
          <DialogClose class="btn-icon">
            <AppIcon name="close" :size="20" />
          </DialogClose>
        </div>
        <div class="px-5 py-4">
          <slot />
        </div>
        <div v-if="$slots.footer" class="flex justify-end gap-2 border-t border-line px-5 py-4">
          <slot name="footer" />
        </div>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>

<script setup>
import { DialogRoot, DialogPortal, DialogOverlay, DialogContent, DialogTitle, DialogDescription, DialogClose } from 'reka-ui'
import AppIcon from './AppIcon.vue'

defineProps({
  open: Boolean,
  title: { type: String, default: '' },
  description: { type: String, default: '' },
  contentClass: { type: String, default: '' }
})
defineEmits(['update:open', 'open-auto-focus'])
</script>
