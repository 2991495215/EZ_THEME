import { useTimestamp } from '@vueuse/core';
import { useI18n } from 'vue-i18n';

export function useCheckoutHold() {
  const now = useTimestamp({ interval: 1000 });
  const { t } = useI18n();

  function syncCheckoutHold(order, source = order) {
    const seconds = source.checkout_hold_remaining;
    order.checkoutHoldDeadline = Number.isInteger(seconds)
      ? Date.now() + seconds * 1000
      : source.checkout_held ? Infinity : 0;
  }

  function checkoutHoldText(order) {
    if (order.status !== 0) return '';
    if (order.checkoutHoldDeadline === Infinity) return t('orders.checkoutHeld');
    const seconds = Math.ceil((order.checkoutHoldDeadline - now.value) / 1000);
    return seconds > 0
      ? t('orders.checkoutHoldRemaining', { minutes: Math.floor(seconds / 60), seconds: seconds % 60 })
      : '';
  }

  function showCancellationHold(order, error) {
    const data = error.response?.data?.data;
    if (error.response?.status !== 409 || !(data?.checkout_hold_remaining > 0)) return false;
    syncCheckoutHold(order, data);
    return true;
  }

  return { syncCheckoutHold, checkoutHoldText, showCancellationHold };
}
