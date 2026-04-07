export const formatPrice = (price: number, currency: string = 'EUR') => {
  const symbols: Record<string, string> = {
    EUR: '€',
    USD: '$',
    GBP: '£',
    CHF: 'Fr.'
  };
  const rates: Record<string, number> = {
    EUR: 1,
    USD: 1.08,
    GBP: 0.85,
    CHF: 0.95
  };
  const symbol = symbols[currency] || '€';
  const rate = rates[currency] || 1;
  const converted = Math.round(price * rate);

  return currency === 'CHF' ? `${converted} ${symbol}` : `${symbol}${converted}`;
};
