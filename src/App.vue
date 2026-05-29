<template>
  <router-view />
  <ToastContainer />
  <ConfirmDialog />
  <LoadingOverlay />
</template>

<script setup>
import ToastContainer from '@/components/ui/ToastContainer.vue'
import ConfirmDialog from '@/components/ui/ConfirmDialog.vue'
import LoadingOverlay from '@/components/ui/LoadingOverlay.vue'
</script>
