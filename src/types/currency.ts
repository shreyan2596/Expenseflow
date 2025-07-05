export interface Currency {
  code: string;
  symbol: string;
  name: string;
  decimalPlaces: number;
}

export const SUPPORTED_CURRENCIES: Currency[] = [
  { code: 'USD', symbol: '$', name: 'US Dollar', decimalPlaces: 2 },
  { code: 'EUR', symbol: '€', name: 'Euro', decimalPlaces: 2 },
  { code: 'GBP', symbol: '£', name: 'British Pound', decimalPlaces: 2 },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen', decimalPlaces: 0 },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar', decimalPlaces: 2 },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', decimalPlaces: 2 },
  { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc', decimalPlaces: 2 },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan', decimalPlaces: 2 },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee', decimalPlaces: 2 },
  { code: 'KRW', symbol: '₩', name: 'South Korean Won', decimalPlaces: 0 },
  { code: 'BRL', symbol: 'R$', name: 'Brazilian Real', decimalPlaces: 2 },
  { code: 'MXN', symbol: '$', name: 'Mexican Peso', decimalPlaces: 2 },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar', decimalPlaces: 2 },
  { code: 'HKD', symbol: 'HK$', name: 'Hong Kong Dollar', decimalPlaces: 2 },
  { code: 'NOK', symbol: 'kr', name: 'Norwegian Krone', decimalPlaces: 2 },
  { code: 'SEK', symbol: 'kr', name: 'Swedish Krona', decimalPlaces: 2 },
  { code: 'DKK', symbol: 'kr', name: 'Danish Krone', decimalPlaces: 2 },
  { code: 'PLN', symbol: 'zł', name: 'Polish Zloty', decimalPlaces: 2 },
  { code: 'CZK', symbol: 'Kč', name: 'Czech Koruna', decimalPlaces: 2 },
  { code: 'HUF', symbol: 'Ft', name: 'Hungarian Forint', decimalPlaces: 0 }
];

export interface ExchangeRate {
  from: string;
  to: string;
  rate: number;
  lastUpdated: Date;
}

export const getCurrencyByCode = (code: string): Currency | undefined => {
  return SUPPORTED_CURRENCIES.find(currency => currency.code === code);
};

export const formatCurrency = (amount: number, currency: Currency): string => {
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.code,
    minimumFractionDigits: currency.decimalPlaces,
    maximumFractionDigits: currency.decimalPlaces,
  });
  
  return formatter.format(amount);
};

export const formatCurrencyWithSymbol = (amount: number, currency: Currency): string => {
  const formattedAmount = amount.toFixed(currency.decimalPlaces);
  return `${currency.symbol}${formattedAmount}`;
};