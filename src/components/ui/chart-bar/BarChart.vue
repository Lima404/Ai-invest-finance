<template>
  <div class="ai-chart">
    <div v-if="!data.length" class="py-8 text-center text-taupe">Sem dados no período.</div>
    <template v-else>
      <VisXYContainer :data="data" :height="height" :margin="{ top: 8, right: 8, bottom: 8, left: 8 }">
        <VisGroupedBar
          :x="xAcc"
          :y="yAcc"
          :color="colors"
          :rounded-corners="5"
          :group-padding="0.25"
          :bar-padding="0.08"
        />
        <VisAxis
          type="x"
          :x="xAcc"
          :tick-format="xFormat"
          :num-ticks="data.length"
          :grid-line="false"
          :domain-line="false"
          :tick-line="false"
        />
        <VisAxis
          type="y"
          :tick-format="yFormat"
          :grid-line="true"
          :domain-line="false"
          :tick-line="false"
          :num-ticks="4"
        />
        <VisCrosshair :template="tooltipTemplate" :color="() => '#C6F806'" />
        <VisTooltip />
      </VisXYContainer>

      <div class="mt-4 flex justify-center gap-5">
        <span class="flex items-center gap-1.5 text-xs text-taupe">
          <span class="h-2.5 w-2.5 rounded-sm" :style="{ background: colors[0] }" /> {{ series[0].label }}
        </span>
        <span class="flex items-center gap-1.5 text-xs text-taupe">
          <span class="h-2.5 w-2.5 rounded-sm" :style="{ background: colors[1] }" /> {{ series[1].label }}
        </span>
      </div>
    </template>
  </div>
</template>

<script setup>
import { VisXYContainer, VisGroupedBar, VisAxis, VisCrosshair, VisTooltip } from '@unovis/vue'
import { formatBRL } from '@/utils/format'

const props = defineProps({
  // [{ label, receitas, despesas }]
  data: { type: Array, default: () => [] },
  height: { type: Number, default: 240 },
  series: {
    type: Array,
    default: () => [
      { key: 'receitas', label: 'Receitas', color: '#C6F806' },
      { key: 'despesas', label: 'Despesas', color: '#FF4D4D' }
    ]
  }
})

const colors = props.series.map((s) => s.color)
const xAcc = (_d, i) => i
const yAcc = props.series.map((s) => (d) => Number(d[s.key] || 0))

function xFormat (i) {
  return props.data[i]?.label ?? ''
}
function yFormat (v) {
  if (v >= 1000) return 'R$ ' + (v / 1000).toFixed(v % 1000 === 0 ? 0 : 1) + 'k'
  return 'R$ ' + v
}

function tooltipTemplate (d) {
  if (!d) return ''
  const linha = (cor, label, val) =>
    `<div style="display:flex;align-items:center;gap:6px;margin-top:2px">
       <span style="width:8px;height:8px;border-radius:2px;background:${cor};display:inline-block"></span>
       <span style="color:#b7aca3">${label}:</span>
       <b style="margin-left:auto">${formatBRL(val)}</b>
     </div>`
  return `<div style="min-width:150px">
    <div style="font-weight:700;margin-bottom:4px">${d.label}</div>
    ${linha(props.series[0].color, props.series[0].label, d[props.series[0].key])}
    ${linha(props.series[1].color, props.series[1].label, d[props.series[1].key])}
  </div>`
}
</script>

<style scoped>
.ai-chart {
  --vis-axis-tick-label-color: #b7aca3;
  --vis-axis-tick-label-font-size: 11px;
  --vis-axis-grid-color: #1d1d1d;
  --vis-tooltip-background-color: #141414;
  --vis-tooltip-border-color: #242424;
  --vis-tooltip-text-color: #ffffff;
  --vis-tooltip-padding: 10px 12px;
  --vis-crosshair-line-stroke-color: #2a2a2a;
  --vis-crosshair-circle-stroke-color: #000;
}
</style>
