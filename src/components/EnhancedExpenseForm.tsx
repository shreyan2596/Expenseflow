import React, { useState, useEffect } from 'react';
import { X, DollarSign, FileText, Tag, Calendar, CreditCard, AlertCircle, MapPin, Hash, Repeat } from 'lucide-react';
import { ExpenseFormData, PREDEFINED_EXPENSE_CATEGORIES, PAYMENT_METHODS } from '../types/expense';
import { useUserSettings } from '../hooks/useUserSettings';
import { useNotifications } from '../hooks/useNotifications';
import { formatCurrencyWithSymbol, getCurrencyByCode } from '../types/currency';

interface EnhancedExpenseFormProps {
  onSubmit: (expense: ExpenseFormData) => Promise<void>;
  onClose: () => void;
  initialData?: ExpenseFormData;
  isEditing?: boolean;
}

export const EnhancedExpenseForm: React.FC<EnhancedExpenseFormProps> = ({ 
  onSubmit, 
  onClose, 
  initialData,
  isEditing = false 
}) => {
  const { settings } = useUserSettings();
  const { addNotification } = useNotifications();
  
  const [formData, setFormData] = useState<ExpenseFormData>({
    amount: '',
    category: '',
    date: new Date().toISOString().split('T')[0],
    description: '',
    paymentMethod: '',
    paymentMethodDetails: '',
    tags: [],
    location: '',
    isRecurring: false,
    recurringPattern: undefined,
    ...initialData
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [newTag, setNewTag] = useState('');

  useEffect(() => {
    if (initialData) {
      setFormData({ ...initialData });
    }
    
    // Set default payment method if available
    if (settings?.defaultPaymentMethod && !initialData?.paymentMethod) {
      setFormData(prev => ({ ...prev, paymentMethod: settings.defaultPaymentMethod! }));
    }
  }, [initialData, settings]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    const currency = getCurrencyByCode(settings?.currency.code || 'USD');

    // Amount validation
    if (!formData.amount || isNaN(parseFloat(formData.amount))) {
      newErrors.amount = 'Please enter a valid amount';
    } else {
      const amount = parseFloat(formData.amount);
      if (amount <= 0) {
        newErrors.amount = 'Amount must be greater than zero';
      } else if (amount > 999999.99) {
        newErrors.amount = 'Amount cannot exceed 999,999.99';
      } else if (currency) {
        const decimalPlaces = (formData.amount.split('.')[1] || '').length;
        if (decimalPlaces > currency.decimalPlaces) {
          newErrors.amount = `Amount can have at most ${currency.decimalPlaces} decimal places`;
        }
      }
    }

    // Category validation
    if (!formData.category) {
      newErrors.category = 'Please select a category';
    }

    // Date validation
    if (!formData.date) {
      newErrors.date = 'Please select a date';
    } else {
      const selectedDate = new Date(formData.date);
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      
      if (selectedDate > today) {
        newErrors.date = 'Date cannot be in the future';
      }

      const oneYearAgo = new Date(today.getTime() - 365 * 24 * 60 * 60 * 1000);
      if (selectedDate < oneYearAgo) {
        newErrors.date = 'Date cannot be more than 1 year in the past';
      }
    }

    // Payment method validation
    if (!formData.paymentMethod) {
      newErrors.paymentMethod = 'Please select a payment method';
    }

    // Payment method details validation for "Other"
    if (formData.paymentMethod === 'Other' && !formData.paymentMethodDetails?.trim()) {
      newErrors.paymentMethodDetails = 'Please specify the payment method';
    }

    // Description validation
    if (formData.description && formData.description.length > 200) {
      newErrors.description = 'Description cannot exceed 200 characters';
    }

    // Location validation
    if (formData.location && formData.location.length > 100) {
      newErrors.location = 'Location cannot exceed 100 characters';
    }

    // Tags validation
    if (formData.tags && formData.tags.length > 10) {
      newErrors.tags = 'Cannot have more than 10 tags';
    }

    // Recurring pattern validation
    if (formData.isRecurring && !formData.recurringPattern) {
      newErrors.recurringPattern = 'Please select a recurring pattern';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      addNotification({
        type: 'error',
        title: 'Validation Error',
        message: 'Please fix the errors in the form before submitting.',
        duration: 5000
      });
      return;
    }

    setLoading(true);
    try {
      await onSubmit(formData);
      
      addNotification({
        type: 'success',
        title: isEditing ? 'Expense Updated' : 'Expense Added',
        message: `Successfully ${isEditing ? 'updated' : 'added'} expense of ${formatCurrencyWithSymbol(parseFloat(formData.amount), getCurrencyByCode(settings?.currency.code || 'USD')!)} for ${formData.category}.`,
        duration: 4000
      });
      
      onClose();
    } catch (error: any) {
      setErrors({ submit: error.message });
      addNotification({
        type: 'error',
        title: 'Error',
        message: error.message,
        duration: 5000
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    setFormData(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
    
    // Clear field-specific error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags?.includes(newTag.trim()) && (formData.tags?.length || 0) < 10) {
      setFormData(prev => ({
        ...prev,
        tags: [...(prev.tags || []), newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags?.filter(tag => tag !== tagToRemove) || []
    }));
  };

  const formatDateForInput = (dateString: string) => {
    if (!settings) return dateString;
    
    const date = new Date(dateString);
    if (settings.dateFormat === 'DD/MM/YYYY') {
      return date.toLocaleDateString('en-GB');
    }
    return date.toLocaleDateString('en-US');
  };

  const allCategories = [
    ...PREDEFINED_EXPENSE_CATEGORIES,
    ...(settings?.customCategories || [])
  ];

  const currency = getCurrencyByCode(settings?.currency.code || 'USD');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-6 z-50">
      <div className="bg-white rounded-3xl p-8 max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            {isEditing ? 'Edit Expense' : 'Add New Expense'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {errors.submit && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center space-x-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <p className="text-red-700 text-sm">{errors.submit}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Amount * ({currency?.symbol || '$'})
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={handleInputChange}
                  className={`w-full pl-12 pr-4 py-3 bg-gray-50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                    errors.amount ? 'border-red-300' : 'border-gray-200'
                  }`}
                  placeholder="0.00"
                  step={currency?.decimalPlaces === 0 ? "1" : "0.01"}
                  min="0"
                  max="999999.99"
                />
              </div>
              {errors.amount && (
                <p className="mt-1 text-sm text-red-600">{errors.amount}</p>
              )}
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category *
              </label>
              <div className="relative">
                <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className={`w-full pl-12 pr-4 py-3 bg-gray-50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                    errors.category ? 'border-red-300' : 'border-gray-200'
                  }`}
                >
                  <option value="">Select a category</option>
                  <optgroup label="Predefined Categories">
                    {PREDEFINED_EXPENSE_CATEGORIES.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </optgroup>
                  {settings?.customCategories && settings.customCategories.length > 0 && (
                    <optgroup label="Custom Categories">
                      {settings.customCategories.map(category => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </optgroup>
                  )}
                </select>
              </div>
              {errors.category && (
                <p className="mt-1 text-sm text-red-600">{errors.category}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date * ({settings?.dateFormat || 'MM/DD/YYYY'})
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  max={new Date().toISOString().split('T')[0]}
                  min={new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                  className={`w-full pl-12 pr-4 py-3 bg-gray-50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                    errors.date ? 'border-red-300' : 'border-gray-200'
                  }`}
                />
              </div>
              {errors.date && (
                <p className="mt-1 text-sm text-red-600">{errors.date}</p>
              )}
            </div>

            {/* Payment Method */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Method *
              </label>
              <div className="relative">
                <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <select
                  name="paymentMethod"
                  value={formData.paymentMethod}
                  onChange={handleInputChange}
                  className={`w-full pl-12 pr-4 py-3 bg-gray-50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                    errors.paymentMethod ? 'border-red-300' : 'border-gray-200'
                  }`}
                >
                  <option value="">Select payment method</option>
                  {PAYMENT_METHODS.map(method => (
                    <option key={method} value={method}>{method}</option>
                  ))}
                </select>
              </div>
              {errors.paymentMethod && (
                <p className="mt-1 text-sm text-red-600">{errors.paymentMethod}</p>
              )}
            </div>
          </div>

          {/* Payment Method Details (for "Other") */}
          {formData.paymentMethod === 'Other' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Method Details *
              </label>
              <input
                type="text"
                name="paymentMethodDetails"
                value={formData.paymentMethodDetails || ''}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 bg-gray-50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                  errors.paymentMethodDetails ? 'border-red-300' : 'border-gray-200'
                }`}
                placeholder="Specify the payment method"
              />
              {errors.paymentMethodDetails && (
                <p className="mt-1 text-sm text-red-600">{errors.paymentMethodDetails}</p>
              )}
            </div>
          )}

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description (Optional)
            </label>
            <div className="relative">
              <FileText className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
                maxLength={200}
                className={`w-full pl-12 pr-4 py-3 bg-gray-50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none ${
                  errors.description ? 'border-red-300' : 'border-gray-200'
                }`}
                placeholder="Add a note about this expense..."
              />
            </div>
            <div className="flex justify-between items-center mt-1">
              {errors.description && (
                <p className="text-sm text-red-600">{errors.description}</p>
              )}
              <p className="text-xs text-gray-500 ml-auto">
                {formData.description.length}/200 characters
              </p>
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Location (Optional)
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                name="location"
                value={formData.location || ''}
                onChange={handleInputChange}
                maxLength={100}
                className={`w-full pl-12 pr-4 py-3 bg-gray-50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                  errors.location ? 'border-red-300' : 'border-gray-200'
                }`}
                placeholder="Where was this expense made?"
              />
            </div>
            {errors.location && (
              <p className="mt-1 text-sm text-red-600">{errors.location}</p>
            )}
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tags (Optional)
            </label>
            <div className="flex space-x-2 mb-2">
              <div className="relative flex-1">
                <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="Add a tag"
                  maxLength={20}
                />
              </div>
              <button
                type="button"
                onClick={addTag}
                disabled={(formData.tags?.length || 0) >= 10}
                className="px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add
              </button>
            </div>
            {formData.tags && formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                  >
                    #{tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="ml-2 text-blue-600 hover:text-blue-800"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
            {errors.tags && (
              <p className="mt-1 text-sm text-red-600">{errors.tags}</p>
            )}
          </div>

          {/* Recurring Options */}
          <div className="space-y-4">
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                name="isRecurring"
                checked={formData.isRecurring || false}
                onChange={handleInputChange}
                className="w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
              />
              <div className="flex items-center space-x-2">
                <Repeat className="w-5 h-5 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">This is a recurring expense</span>
              </div>
            </label>

            {formData.isRecurring && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Recurring Pattern *
                </label>
                <select
                  name="recurringPattern"
                  value={formData.recurringPattern || ''}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 bg-gray-50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                    errors.recurringPattern ? 'border-red-300' : 'border-gray-200'
                  }`}
                >
                  <option value="">Select frequency</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
                {errors.recurringPattern && (
                  <p className="mt-1 text-sm text-red-600">{errors.recurringPattern}</p>
                )}
              </div>
            )}
          </div>

          <div className="flex space-x-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-gray-200 text-gray-800 rounded-xl font-semibold hover:bg-gray-300 transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-200 transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" />
              ) : (
                <span>{isEditing ? 'Update Expense' : 'Add Expense'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};