<template>
  <div class="flex items-center" :style="{ gap: gap + 'px' }">
    <svg :height="size" viewBox="0 0 120 80" xmlns="http://www.w3.org/2000/svg" aria-label="AI Invest" role="img">
      <g :fill="mark" transform="skewX(-18)">
        <path d="M28 8 H64 V72 H50 V52 H40 V72 H26 V20 Z M40 24 V40 H50 V24 Z" />
        <rect x="72" y="8" width="4" height="64" />
        <rect x="80" y="8" width="3" height="64" />
        <rect x="86" y="8" width="2" height="64" />
        <rect x="94" y="8" width="14" height="64" />
      </g>
    </svg>
    <div v-if="showText" class="flex flex-col leading-none">
      <span class="font-display font-bold" :style="{ fontSize: size * 0.42 + 'px', color: textColor }">INVEST</span>
      <span v-if="subtitle" class="text-taupe tracking-wide" :style="{ fontSize: size * 0.2 + 'px' }">{{ subtitle }}</span>
    </div>
  </div>
</template>

<script setup>
defineProps({
  size: { type: Number, default: 34 },
  gap: { type: Number, default: 10 },
  showText: { type: Boolean, default: true },
  subtitle: { type: String, default: '' },
  mark: { type: String, default: '#FFFFFF' },
  textColor: { type: String, default: '#FFFFFF' }
})
</script>
