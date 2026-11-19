import { ref } from 'vue';
import { getCommConfig } from '@/api/shop';

export function usePricingCurrency() {
  const currencySymbol = ref('');
  const currencyLoading = ref(true);

  const fetchCurrency = async () => {
    currencyLoading.value = true;
    currencySymbol.value = '';
    try {
      const symbol = (await getCommConfig()).data?.currency_symbol;
      if (typeof symbol === 'string') currencySymbol.value = symbol.trim();
    } catch (error) {
      console.error('Failed to load pricing currency:', error);
    } finally {
      currencyLoading.value = false;
    }
  };

  return { currencySymbol, currencyLoading, fetchCurrency };
}
