import { onMounted, ref } from 'vue';
import { getWebsiteConfig } from '@/api/auth';

export function useLoginCaptcha() {
  const loginCaptcha = ref(null);
  const loginCaptchaToken = ref('');
  const loginCaptchaKey = ref('');
  const loginCaptchaReady = ref(false);

  const loginCaptchaFailed = ref(false);

  async function loadLoginCaptcha() {
    loginCaptchaFailed.value = false;
    try {
      const { data } = await getWebsiteConfig();
      if (Number(data?.is_captcha) !== 1 || data.captcha_type !== 'turnstile' || !data.turnstile_site_key) {
        throw new Error('Turnstile configuration unavailable');
      }
      loginCaptchaKey.value = data.turnstile_site_key;
      loginCaptchaReady.value = true;
    } catch {
      loginCaptchaFailed.value = true;
    }
  }
  onMounted(loadLoginCaptcha);

  return { loginCaptcha, loginCaptchaToken, loginCaptchaKey, loginCaptchaReady, loginCaptchaFailed, loadLoginCaptcha };
}
