<template>
  <div ref="container"></div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue';

const props = defineProps<{ siteKey: string }>();
const emit = defineEmits<{ (e: 'token', token: string): void }>();

const container = ref<HTMLDivElement | null>(null);
let widgetId: string | null = null;

declare global {
  interface Window {
    turnstile?: {
      render: (container: HTMLElement, opts: { sitekey: string; callback: (token: string) => void }) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
    };
  }
}

onMounted(() => {
  const script = document.createElement('script');
  script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
  script.async = true;
  script.defer = true;
  script.onload = renderWidget;
  document.head.appendChild(script);
});

onUnmounted(() => {
  if (widgetId && window.turnstile) {
    window.turnstile.remove(widgetId);
  }
});

function renderWidget() {
  if (!container.value || !window.turnstile) return;
  widgetId = window.turnstile.render(container.value, {
    sitekey: props.siteKey,
    callback: (token: string) => emit('token', token),
  });
}

watch(() => props.siteKey, () => {
  if (widgetId && window.turnstile) {
    window.turnstile.reset(widgetId);
  }
});
</script>
