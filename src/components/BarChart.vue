<template>
  <div>
    <div v-if="!data.length" class="py-8 text-center text-taupe">Sem dados no período.</div>
    <div v-else class="flex h-56 items-end gap-4 pt-2">
      <div v-for="(d, i) in data" :key="i" class="flex h-full flex-1 flex-col items-center">
        <div class="flex w-full flex-1 items-end justify-center gap-1.5">
          <div
            class="w-6 max-w-[40%] rounded-t-md bg-gradient-to-t from-lime/40 to-lime transition-all duration-500"
            :style="{ height: barH(d.receitas) + '%' }"
            :title="`${formatBRL(d.receitas)} receitas`"
          />
          <div
            class="w-6 max-w-[40%] rounded-t-md bg-gradient-to-t from-danger/40 to-danger transition-all duration-500"
            :style="{ height: barH(d.despesas) + '%' }"
            :title="`${formatBRL(d.despesas)} despesas`"
          />
        </div>
        <span class="mt-2 text-[11px] uppercase text-taupe">{{ d.label }}</span>
      </div>
    </div>

    <div v-if="data.length" class="mt-4 flex justify-center gap-5">
      <span class="flex items-center gap-1.5 text-xs text-taupe">
        <span class="h-2.5 w-2.5 rounded-sm bg-lime" /> Receitas
      </span>
      <span class="flex items-center gap-1.5 text-xs text-taupe">
        <span class="h-2.5 w-2.5 rounded-sm bg-danger" /> Despesas
      </span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { formatBRL } from '@/utils/format'

const props = defineProps({
  data: { type: Array, default: () => [] }
})

const max = computed(() => {
  let m = 0
  for (const d of props.data) m = Math.max(m, d.receitas, d.despesas)
  return m || 1
})

function barH (v) {
  return Math.max(2, (v / max.value) * 100)
}
</script>
