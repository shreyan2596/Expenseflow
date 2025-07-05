import React, { useState, useEffect } from 'react';
import { X, Save, RotateCcw, Plus, Trash2, Globe, Calendar, Bell, Shield } from 'lucide-react';
import { useUserSettings } from '../hooks/useUserSettings';
import { SUPPORTED_CURRENCIES } from '../types/currency';
import { PREDEFINED_EXPENSE_CATEGORIES, PAYMENT_METHODS } from '../types/expense';

interface UserSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserSettingsModal: React.FC<UserSettingsModalProps> = ({ isOpen, onClose }) => {
  const { settings, loading, updateSettings, resetToDefaults } = useUserSettings();
  const [formData, setFormData] = useState({
    currency: { code: 'USD', symbol: '$' },
    dateFormat: 'MM/DD/YYYY' as 'MM/DD/YYYY' | 'DD/MM/YYYY',
    customCategories: [] as string[],
    defaultPaymentMethod: '',
    notifications: {
      dailyReminder: false,
      weeklyReport: true,
      budgetAlerts: true
    },
    privacy: {
      shareData: false,
      analytics: true
    }
  });
  const [newCategory, setNewCategory] = useState('');
  const [activeTab, setActiveTab] = useState<'general' | 'categories' | 'notifications' | 'privacy'>('general');

  useEffect(() => {
    if (settings) {
      setFormData({
        currency: settings.currency,
        dateFormat: settings.dateFormat,
        customCategories: [...settings.customCategories],
        defaultPaymentMethod: settings.defaultPaymentMethod || '',
        notifications: { ...settings.notifications },
        privacy: { ...settings.privacy }
      });
    }
  }, [settings]);

  const handleSave = async () => {
    try {
      await updateSettings(formData);
      onClose();
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  };

  const handleReset = async () => {
    if (window.confirm('Are you sure you want to reset all settings to defaults? This action cannot be undone.')) {
      try {
        await resetToDefaults();
        onClose();
      } catch (error) {
        console.error('Error resetting settings:', error);
      }
    }
  };

  const addCustomCategory = () => {
    if (newCategory.trim() && !formData.customCategories.includes(newCategory.trim())) {
      setFormData(prev => ({
        ...prev,
        customCategories: [...prev.customCategories, newCategory.trim()]
      }));
      setNewCategory('');
    }
  };

  const removeCustomCategory = (category: string) => {
    setFormData(prev => ({
      ...prev,
      customCategories: prev.customCategories.filter(cat => cat !== category)
    }));
  };

  if (!isOpen) return null;

  const tabs = [
    { id: 'general', label: 'General', icon: Globe },
    { id: 'categories', label: 'Categories', icon: Plus },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'privacy', label: 'Privacy', icon: Shield }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-6 z-50">
      <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Settings</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <div className="flex">
          {/* Sidebar */}
          <div className="w-64 bg-gray-50 p-4 border-r border-gray-200">
            <nav className="space-y-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                      activeTab === tab.id
                        ? 'bg-blue-600 text-white shadow-lg'
                        : 'text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Content */}
          <div className="flex-1 p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <>
                {activeTab === 'general' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Currency & Format</h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Preferred Currency
                          </label>
                          <select
                            value={formData.currency.code}
                            onChange={(e) => {
                              const currency = SUPPORTED_CURRENCIES.find(c => c.code === e.target.value);
                              if (currency) {
                                setFormData(prev => ({
                                  ...prev,
                                  currency: { code: currency.code, symbol: currency.symbol }
                                }));
                              }
                            }}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                          >
                            {SUPPORTED_CURRENCIES.map(currency => (
                              <option key={currency.code} value={currency.code}>
                                {currency.symbol} {currency.code} - {currency.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Date Format
                          </label>
                          <select
                            value={formData.dateFormat}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              dateFormat: e.target.value as 'MM/DD/YYYY' | 'DD/MM/YYYY'
                            }))}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                          >
                            <option value="MM/DD/YYYY">MM/DD/YYYY (US Format)</option>
                            <option value="DD/MM/YYYY">DD/MM/YYYY (International Format)</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Default Payment Method
                      </label>
                      <select
                        value={formData.defaultPaymentMethod}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          defaultPaymentMethod: e.target.value
                        }))}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      >
                        <option value="">No default</option>
                        {PAYMENT_METHODS.map(method => (
                          <option key={method} value={method}>{method}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                {activeTab === 'categories' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Custom Categories</h3>
                      <p className="text-gray-600 mb-4">
                        Add custom expense categories in addition to the predefined ones.
                      </p>
                      
                      <div className="flex space-x-3 mb-4">
                        <input
                          type="text"
                          value={newCategory}
                          onChange={(e) => setNewCategory(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && addCustomCategory()}
                          placeholder="Enter new category name"
                          className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        />
                        <button
                          onClick={addCustomCategory}
                          className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors duration-200"
                        >
                          <Plus className="w-5 h-5" />
                        </button>
                      </div>

                      <div className="space-y-2">
                        <h4 className="font-medium text-gray-900">Your Custom Categories</h4>
                        {formData.customCategories.length === 0 ? (
                          <p className="text-gray-500 italic">No custom categories added yet.</p>
                        ) : (
                          <div className="space-y-2">
                            {formData.customCategories.map((category, index) => (
                              <div
                                key={index}
                                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                              >
                                <span className="text-gray-900">{category}</span>
                                <button
                                  onClick={() => removeCustomCategory(category)}
                                  className="p-1 text-red-600 hover:bg-red-100 rounded transition-colors duration-200"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="mt-6">
                        <h4 className="font-medium text-gray-900 mb-2">Predefined Categories</h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                          {PREDEFINED_EXPENSE_CATEGORIES.map((category) => (
                            <div
                              key={category}
                              className="px-3 py-2 bg-blue-50 text-blue-800 rounded-lg text-sm"
                            >
                              {category}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'notifications' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Notification Preferences</h3>
                      
                      <div className="space-y-4">
                        <label className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                          <div>
                            <span className="font-medium text-gray-900">Daily Reminder</span>
                            <p className="text-sm text-gray-600">Get reminded to log your daily expenses</p>
                          </div>
                          <input
                            type="checkbox"
                            checked={formData.notifications.dailyReminder}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              notifications: {
                                ...prev.notifications,
                                dailyReminder: e.target.checked
                              }
                            }))}
                            className="w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                          />
                        </label>

                        <label className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                          <div>
                            <span className="font-medium text-gray-900">Weekly Report</span>
                            <p className="text-sm text-gray-600">Receive weekly spending summaries</p>
                          </div>
                          <input
                            type="checkbox"
                            checked={formData.notifications.weeklyReport}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              notifications: {
                                ...prev.notifications,
                                weeklyReport: e.target.checked
                              }
                            }))}
                            className="w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                          />
                        </label>

                        <label className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                          <div>
                            <span className="font-medium text-gray-900">Budget Alerts</span>
                            <p className="text-sm text-gray-600">Get notified when approaching budget limits</p>
                          </div>
                          <input
                            type="checkbox"
                            checked={formData.notifications.budgetAlerts}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              notifications: {
                                ...prev.notifications,
                                budgetAlerts: e.target.checked
                              }
                            }))}
                            className="w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                          />
                        </label>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'privacy' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Privacy Settings</h3>
                      
                      <div className="space-y-4">
                        <label className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                          <div>
                            <span className="font-medium text-gray-900">Share Anonymous Data</span>
                            <p className="text-sm text-gray-600">Help improve the app by sharing anonymous usage data</p>
                          </div>
                          <input
                            type="checkbox"
                            checked={formData.privacy.shareData}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              privacy: {
                                ...prev.privacy,
                                shareData: e.target.checked
                              }
                            }))}
                            className="w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                          />
                        </label>

                        <label className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                          <div>
                            <span className="font-medium text-gray-900">Analytics</span>
                            <p className="text-sm text-gray-600">Allow analytics to help us understand app usage</p>
                          </div>
                          <input
                            type="checkbox"
                            checked={formData.privacy.analytics}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              privacy: {
                                ...prev.privacy,
                                analytics: e.target.checked
                              }
                            }))}
                            className="w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                          />
                        </label>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={handleReset}
            className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors duration-200"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset to Defaults</span>
          </button>
          
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-6 py-3 bg-gray-200 text-gray-800 rounded-xl font-semibold hover:bg-gray-300 transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-200 transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              <Save className="w-5 h-5" />
              <span>Save Settings</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};