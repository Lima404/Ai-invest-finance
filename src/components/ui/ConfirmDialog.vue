<template>
  <AlertDialogRoot :open="state.open" @update:open="(v) => { if (!v) _settle(false) }">
    <AlertDialogPortal>
      <AlertDialogOverlay class="ai-overlay fixed inset-0 z-[80] bg-black/70 backdrop-blur-sm" />
      <AlertDialogContent
        class="ai-pop fixed left-1/2 top-1/2 z-[90] w-[420px] max-w-[92vw] -translate-x-1/2 -translate-y-1/2 ai-card p-5 focus:outline-none"
      >
        <div class="mb-2 flex items-center gap-3">
          <div
            class="flex h-10 w-10 items-center justify-center rounded-xl"
            :class="state.danger ? 'bg-danger/15 text-danger' : 'bg-lime/15 text-lime'"
          >
            <AppIcon :name="state.danger ? 'warning' : 'help'" :size="22" />
          </div>
          <AlertDialogTitle class="font-display text-lg">{{ state.title }}</AlertDialogTitle>
        </div>
        <AlertDialogDescription class="mb-5 text-sm text-taupe">{{ state.message }}</AlertDialogDescription>
        <div class="flex justify-end gap-2">
          <button type="button" class="btn-ghost" @click="_settle(false)">{{ state.cancelLabel }}</button>
          <button type="button" :class="state.danger ? 'btn-danger' : 'btn-primary'" @click="_settle(true)">
            {{ state.okLabel }}
          </button>
        </div>
      </AlertDialogContent>
    </AlertDialogPortal>
  </AlertDialogRoot>
</template>

<script setup>
import {
  AlertDialogRoot, AlertDialogPortal, AlertDialogOverlay, AlertDialogContent,
  AlertDialogTitle, AlertDialogDescription
} from 'reka-ui'
import { useConfirmState, _settle } from '@/composables/useConfirm'
import AppIcon from './AppIcon.vue'

const state = useConfirmState()
</script>
