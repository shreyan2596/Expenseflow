export interface UserSettings {
  id?: string;
  userId: string;
  currency: {
    code: string;
    symbol: string;
  };
  dateFormat: 'MM/DD/YYYY' | 'DD/MM/YYYY';
  customCategories: string[];
  defaultPaymentMethod?: string;
  notifications: {
    dailyReminder: boolean;
    weeklyReport: boolean;
    budgetAlerts: boolean;
  };
  privacy: {
    shareData: boolean;
    analytics: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

export const DEFAULT_USER_SETTINGS: Omit<UserSettings, 'id' | 'userId' | 'createdAt' | 'updatedAt'> = {
  currency: {
    code: 'USD',
    symbol: '$'
  },
  dateFormat: 'MM/DD/YYYY',
  customCategories: [],
  notifications: {
    dailyReminder: false,
    weeklyReport: true,
    budgetAlerts: true
  },
  privacy: {
    shareData: false,
    analytics: true
  }
};