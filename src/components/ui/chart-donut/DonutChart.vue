<template>
  <div class="flex flex-wrap items-center justify-center gap-6">
    <div class="ai-chart relative shrink-0" :style="{ width: size + 'px', height: size + 'px' }">
      <VisSingleContainer v-if="items.length" :data="values" :height="size" :width="size">
        <VisDonut
          :value="(d) => d"
          :arc-width="26"
          :corner-radius="3"
          :pad-angle="0.012"
          :color="colors"
          :central-label="formatBRL(total)"
          :central-sub-label="'Total'"
        />
      </VisSingleContainer>
      <div v-else class="flex h-full items-center justify-center text-taupe">Sem despesas</div>
    </div>

    <div class="min-w-[180px] flex-1">
      <p v-if="!items.length" class="text-taupe">Sem despesas no período.</p>
      <div v-for="(seg, i) in segments" :key="i" class="mb-2 flex items-center gap-2">
        <span class="h-2.5 w-2.5 shrink-0 rounded-sm" :style="{ background: seg.color }" />
        <span class="flex-1 truncate text-sm">{{ seg.categoria }}</span>
        <span class="text-sm font-medium">{{ formatBRL(seg.total) }}</span>
        <span class="w-9 text-right text-xs text-taupe">{{ seg.pct }}%</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { VisSingleContainer, VisDonut } from '@unovis/vue'
import { formatBRL } from '@/utils/format'
import { categoryColor } from '@/utils/categories'

const props = defineProps({
  // [{ categoria, total }]
  items: { type: Array, default: () => [] },
  size: { type: Number, default: 180 }
})

const total = computed(() => props.items.reduce((a, b) => a + b.total, 0))
const values = computed(() => props.items.map((it) => it.total))
const colors = computed(() => props.items.map((it) => categoryColor(it.categoria)))
const segments = computed(() =>
  props.items.map((it) => ({
    ...it,
    color: categoryColor(it.categoria),
    pct: total.value ? Math.round((it.total / total.value) * 100) : 0
  }))
)
</script>

<style scoped>
.ai-chart {
  --vis-donut-central-label-text-color: #ffffff;
  --vis-donut-central-label-font-size: 14px;
  --vis-donut-central-label-font-weight: 700;
  --vis-donut-central-sub-label-text-color: #b7aca3;
  --vis-donut-central-sub-label-font-size: 11px;
}
</style>
