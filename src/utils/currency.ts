export function formatCurrency(amount: number, language: string = 'fr'): string {
  const formatted = amount.toFixed(2);

  if (language === 'ar') {
    return `${formatted} دت`;
  } else if (language === 'en') {
    return `TND ${formatted}`;
  } else {
    return `${formatted} TND`;
  }
}
