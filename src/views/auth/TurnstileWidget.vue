<script>
let scriptReady;
let attempt = 0;

function loadTurnstile() {
  if (scriptReady) return scriptReady;
  scriptReady = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    const callback = 'onZincTurnstileLoad' + ++attempt;
    const finish = () => {
      clearTimeout(timeout);
      script.onerror = null;
      delete window[callback];
    };
    const fail = () => {
      finish();
      script.remove();
      scriptReady = undefined;
      reject(new Error('Turnstile script did not initialize'));
    };
    const timeout = setTimeout(fail, 12000);
    window[callback] = () => {
      if (!window.turnstile?.render) return fail();
      finish();
      resolve(window.turnstile);
    };
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?onload=' + callback + '&render=explicit';
    script.async = true;
    script.onerror = fail;
    document.head.appendChild(script);
  });
  return scriptReady;
}
</script>

<script setup>
import { onMounted, onBeforeUnmount, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

const props = defineProps({ siteKey: { type: String, required: true } });
const emit = defineEmits(['verified']);
const { locale } = useI18n({ useScope: 'global' });
const container = ref(null);
const failed = ref(false);
let widget;
let turnstile;

async function render() {
  failed.value = false;
  try {
    turnstile = await loadTurnstile();
    if (!container.value || widget != null) return;
    widget = turnstile.render(container.value, {
      sitekey: props.siteKey,
      size: 'flexible',
      language: locale.value === 'zh-CN' ? 'zh' : 'en',
      callback: token => emit('verified', token),
      'expired-callback': reset,
      'timeout-callback': showFailure,
      'error-callback': showFailure,
      retry: 'never'
    });
  } catch {
    failed.value = true;
  }
}

function showFailure() {
  emit('verified', '');
  failed.value = true;
}

function reset() {
  emit('verified', '');
  failed.value = false;
  if (widget == null) return render();
  try {
    turnstile.reset(widget);
  } catch {
    showFailure();
  }
}

function removeWidget() {
  if (widget == null) return;
  turnstile.remove(widget);
  widget = undefined;
}

watch(locale, () => {
  if (widget == null) return;
  emit('verified', '');
  removeWidget();
  render();
});
onMounted(render);
onBeforeUnmount(removeWidget);
defineExpose({ reset });
</script>

<template>
  <div>
    <div ref="container"></div>
    <div v-if="failed" role="status">
      {{ $t('auth.captchaUnavailable') }}
      <button type="button" @click="reset">{{ $t('common.retry') }}</button>
    </div>
  </div>
</template>
