export interface Expense {
  id: string;
  userId: string;
  amount: number;
  currencyCode: string;
  currencySymbol: string;
  category: string;
  date: string;
  description?: string;
  paymentMethod: string;
  paymentMethodDetails?: string; // For "Other" payment method
  tags?: string[];
  receiptUrl?: string;
  location?: string;
  isRecurring?: boolean;
  recurringPattern?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  createdAt: Date;
  updatedAt: Date;
}

export interface ExpenseFormData {
  amount: string;
  category: string;
  date: string;
  description: string;
  paymentMethod: string;
  paymentMethodDetails?: string;
  tags?: string[];
  location?: string;
  isRecurring?: boolean;
  recurringPattern?: 'daily' | 'weekly' | 'monthly' | 'yearly';
}

export interface ExpenseStats {
  totalExpenses: number;
  monthlyTotal: number;
  weeklyTotal: number;
  dailyAverage: number;
  categoryBreakdown: Record<string, number>;
  paymentMethodBreakdown: Record<string, number>;
  recentExpenses: Expense[];
  topCategories: Array<{ category: string; amount: number; percentage: number }>;
  monthlyTrend: Array<{ month: string; amount: number }>;
}

export const PREDEFINED_EXPENSE_CATEGORIES = [
  'Food & Dining',
  'Transportation',
  'Housing',
  'Utilities',
  'Entertainment',
  'Healthcare',
  'Shopping',
  'Education',
  'Travel',
  'Personal Care',
  'Gifts & Donations',
  'Business',
  'Insurance',
  'Taxes',
  'Savings & Investments',
  'Debt Payments',
  'Pet Care',
  'Home Improvement',
  'Subscriptions',
  'Other'
] as const;

export const PAYMENT_METHODS = [
  'Cash',
  'Credit Card',
  'Debit Card',
  'Digital Wallet',
  'Bank Transfer',
  'Check',
  'Cryptocurrency',
  'Gift Card',
  'Other'
] as const;

export type ExpenseCategory = typeof PREDEFINED_EXPENSE_CATEGORIES[number];
export type PaymentMethod = typeof PAYMENT_METHODS[number];

export interface ExpenseValidationRules {
  amount: {
    min: number;
    max: number;
    decimalPlaces: number;
  };
  description: {
    maxLength: number;
  };
  date: {
    maxPastDays: number;
    allowFuture: boolean;
  };
  category: {
    required: boolean;
    allowCustom: boolean;
  };
  paymentMethod: {
    required: boolean;
  };
}

export const DEFAULT_VALIDATION_RULES: ExpenseValidationRules = {
  amount: {
    min: 0.01,
    max: 999999.99,
    decimalPlaces: 2
  },
  description: {
    maxLength: 200
  },
  date: {
    maxPastDays: 365,
    allowFuture: false
  },
  category: {
    required: true,
    allowCustom: true
  },
  paymentMethod: {
    required: true
  }
};