import { expect, test } from 'vitest';
import { buildRegisterPayload } from '../src/views/auth/composables/registerValidation';

test('register sends the verification field expected by the selected provider', () => {
  const data = { formData: { email: 'user@example.com', password: 'password' }, captchaResponse: 'token' };
  expect(buildRegisterPayload({ ...data, config: { is_recaptcha: 1, captcha_type: 'turnstile' } }))
    .toEqual({ ...data.formData, turnstile_token: 'token' });
  expect(buildRegisterPayload({ ...data, config: { is_recaptcha: 1, captcha_type: 'recaptcha' } }))
    .toEqual({ ...data.formData, recaptcha_data: 'token' });
  expect(buildRegisterPayload({ ...data, config: { is_recaptcha: 0 } })).toEqual(data.formData);
});
