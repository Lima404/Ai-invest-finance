<template>
  <Icon :icon="resolved" :width="size" :height="size" />
</template>

<script setup>
import { computed } from 'vue'
import { Icon } from '@iconify/vue'

const props = defineProps({
  name: { type: String, required: true },
  size: { type: [Number, String], default: 20 }
})

// nomes estilo Quasar/Material ("shopping_cart") -> iconify ("material-symbols:shopping-cart-rounded")
const resolved = computed(() => {
  if (props.name.includes(':')) return props.name
  return 'material-symbols:' + props.name.replace(/_/g, '-') + '-rounded'
})
</script>
