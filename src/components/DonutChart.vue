<template>
  <div class="flex flex-wrap items-center justify-center gap-6">
    <svg :width="size" :height="size" :viewBox="`0 0 ${size} ${size}`" class="shrink-0">
      <circle :cx="c" :cy="c" :r="r" fill="none" stroke="#1d1d1d" :stroke-width="stroke" />
      <circle
        v-for="(seg, i) in segments"
        :key="i"
        :cx="c" :cy="c" :r="r"
        fill="none"
        :stroke="seg.color"
        :stroke-width="stroke"
        :stroke-dasharray="`${seg.len} ${circ - seg.len}`"
        :stroke-dashoffset="-seg.offset"
        :transform="`rotate(-90 ${c} ${c})`"
      />
      <text :x="c" :y="c - 6" text-anchor="middle" fill="#b7aca3" font-size="11" class="uppercase">Total</text>
      <text :x="c" :y="c + 16" text-anchor="middle" fill="#fff" font-size="14" font-weight="700">{{ formatBRL(total) }}</text>
    </svg>

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
import { formatBRL } from '@/utils/format'
import { categoryColor } from '@/utils/categories'

const props = defineProps({
  items: { type: Array, default: () => [] },
  size: { type: Number, default: 180 }
})

const stroke = 26
const c = computed(() => props.size / 2)
const r = computed(() => props.size / 2 - stroke / 2)
const circ = computed(() => 2 * Math.PI * r.value)
const total = computed(() => props.items.reduce((a, b) => a + b.total, 0))

const segments = computed(() => {
  let offset = 0
  return props.items.map((it) => {
    const frac = total.value ? it.total / total.value : 0
    const len = frac * circ.value
    const seg = { ...it, color: categoryColor(it.categoria), len, offset, pct: Math.round(frac * 100) }
    offset += len
    return seg
  })
})
</script>
