export const CURRENCIES = ['KZT', 'USD', 'EUR', 'RUB', 'GBP'] as const;
export type CurrencyCode = (typeof CURRENCIES)[number];

export const CURRENCY_SYMBOL: Record<string, string> = {
  KZT: '₸',
  USD: '$',
  EUR: '€',
  RUB: '₽',
  GBP: '£',
};

export const CURRENCY_NAME: Record<string, string> = {
  KZT: 'Kazakhstani Tenge',
  USD: 'US Dollar',
  EUR: 'Euro',
  RUB: 'Russian Ruble',
  GBP: 'British Pound',
};

export const QUICK_AMOUNTS: Record<string, number[]> = {
  KZT: [50000, 100000, 250000, 500000],
  USD: [100, 500, 1000, 5000],
  EUR: [100, 500, 1000, 5000],
  RUB: [5000, 10000, 50000, 100000],
  GBP: [50, 100, 500, 1000],
};

export function currencySymbol(currency: string): string {
  return CURRENCY_SYMBOL[currency] ?? currency;
}

export function formatMoney(amount: number, currency: string): string {
  const sym = currencySymbol(currency);
  return (
    sym +
    amount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  );
}

export function formatQuickAmount(amount: number, currency: string): string {
  const sym = currencySymbol(currency);
  const decimals = amount >= 1000 && !Number.isInteger(amount) ? 2 : 0;
  return (
    sym +
    amount.toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    })
  );
}
