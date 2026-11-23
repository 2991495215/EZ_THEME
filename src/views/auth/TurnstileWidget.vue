<script>
let scriptReady;

function loadTurnstile() {
  if (window.turnstile) return Promise.resolve(window.turnstile);
  scriptReady ??= new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    script.async = true;
    script.onload = () => window.turnstile?.ready(() => resolve(window.turnstile));
    script.onerror = () => {
      script.remove();
      scriptReady = undefined;
      reject();
    };
    document.head.appendChild(script);
  });
  return scriptReady;
}
</script>

<script setup>
import { onMounted, onBeforeUnmount, ref } from 'vue';

const props = defineProps({ siteKey: { type: String, required: true } });
const emit = defineEmits(['verified']);
const container = ref(null);
const failed = ref(false);
let widget;

async function render() {
  failed.value = false;
  try {
    const turnstile = await loadTurnstile();
    if (!container.value) return;
    widget = turnstile.render(container.value, {
      sitekey: props.siteKey,
      size: 'flexible',
      callback: token => emit('verified', token),
      'expired-callback': () => emit('verified', ''),
      'error-callback': () => {
        emit('verified', '');
        failed.value = true;
      },
      retry: 'never'
    });
  } catch {
    failed.value = true;
  }
}

function reset() {
  emit('verified', '');
  failed.value = false;
  if (widget != null) window.turnstile.reset(widget);
  else render();
}

onMounted(render);
onBeforeUnmount(() => {
  if (widget != null) window.turnstile.remove(widget);
});
defineExpose({ reset });
</script>

<template>
  <div>
    <div ref="container"></div>
    <button v-if="failed" type="button" @click="reset">{{ $t('common.retry') }}</button>
  </div>
</template>
