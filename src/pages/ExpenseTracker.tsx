import React, { useState } from 'react';
import { Plus, TrendingUp, TrendingDown, DollarSign, Calendar, AlertCircle } from 'lucide-react';
import { EnhancedExpenseForm } from '../components/EnhancedExpenseForm';
import { ExpenseList } from '../components/ExpenseList';
import { ExpenseChart } from '../components/ExpenseChart';
import { useExpenses } from '../hooks/useExpenses';
import { useUserSettings } from '../hooks/useUserSettings';
import { useNotifications } from '../hooks/useNotifications';
import { Expense, ExpenseFormData } from '../types/expense';
import { formatCurrencyWithSymbol, getCurrencyByCode } from '../types/currency';

export const ExpenseTracker: React.FC = () => {
  const { 
    expenses, 
    stats, 
    loading, 
    error, 
    addExpense, 
    updateExpense, 
    deleteExpense,
    clearError 
  } = useExpenses();

  const { settings } = useUserSettings();
  const { addNotification } = useNotifications();

  const [showForm, setShowForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  const handleAddExpense = async (data: ExpenseFormData) => {
    if (!settings) {
      addNotification({
        type: 'error',
        title: 'Settings Required',
        message: 'Please configure your settings before adding expenses.',
        duration: 5000
      });
      return;
    }

    await addExpense(data, settings);
    setShowForm(false);
  };

  const handleEditExpense = async (data: ExpenseFormData) => {
    if (!editingExpense || !settings) return;
    await updateExpense(editingExpense.id, data, settings);
    setEditingExpense(null);
  };

  const handleDeleteExpense = async (expenseId: string) => {
    if (window.confirm('Are you sure you want to delete this expense? This action cannot be undone.')) {
      try {
        await deleteExpense(expenseId);
        addNotification({
          type: 'success',
          title: 'Expense Deleted',
          message: 'The expense has been successfully deleted.',
          duration: 3000
        });
      } catch (error: any) {
        addNotification({
          type: 'error',
          title: 'Delete Failed',
          message: error.message,
          duration: 5000
        });
      }
    }
  };

  const openEditForm = (expense: Expense) => {
    setEditingExpense(expense);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingExpense(null);
    clearError();
  };

  const currency = getCurrencyByCode(settings?.currency.code || 'USD');
  const currentMonth = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Expense Tracker</h1>
          <p className="text-gray-600 mt-1">Track and manage your daily expenses with advanced features</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-200 transform hover:scale-105 shadow-lg"
        >
          <Plus className="w-5 h-5" />
          <span>Add Expense</span>
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center space-x-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
          <button
            onClick={clearError}
            className="text-red-600 hover:text-red-800 transition-colors duration-200"
          >
            <Plus className="w-4 h-4 transform rotate-45" />
          </button>
        </div>
      )}

      {/* Enhanced Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 transform hover:scale-105">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
            <TrendingUp className="w-5 h-5 text-green-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-1">
            {currency ? formatCurrencyWithSymbol(stats?.totalExpenses || 0, currency) : `$${(stats?.totalExpenses || 0).toFixed(2)}`}
          </h3>
          <p className="text-gray-600 text-sm">Total Expenses</p>
          <p className="text-xs text-gray-500 mt-1">{expenses.length} transactions</p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 transform hover:scale-105">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <TrendingDown className="w-5 h-5 text-blue-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-1">
            {currency ? formatCurrencyWithSymbol(stats?.monthlyTotal || 0, currency) : `$${(stats?.monthlyTotal || 0).toFixed(2)}`}
          </h3>
          <p className="text-gray-600 text-sm">{currentMonth}</p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 transform hover:scale-105">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <span className="text-sm text-gray-500">This week</span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-1">
            {currency ? formatCurrencyWithSymbol(stats?.weeklyTotal || 0, currency) : `$${(stats?.weeklyTotal || 0).toFixed(2)}`}
          </h3>
          <p className="text-gray-600 text-sm">Weekly Total</p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 transform hover:scale-105">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-yellow-500 to-orange-500 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <span className="text-sm text-gray-500">Daily avg</span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-1">
            {currency ? formatCurrencyWithSymbol(stats?.dailyAverage || 0, currency) : `$${(stats?.dailyAverage || 0).toFixed(2)}`}
          </h3>
          <p className="text-gray-600 text-sm">Daily Average</p>
          <p className="text-xs text-gray-500 mt-1">Last 30 days</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <ExpenseList 
            expenses={expenses}
            onEdit={openEditForm}
            onDelete={handleDeleteExpense}
            loading={loading}
          />
        </div>
        
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Expense Breakdown</h3>
            {stats ? (
              <ExpenseChart stats={stats} />
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <DollarSign className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-600">No data to display</p>
              </div>
            )}
          </div>
          
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Total Entries</span>
                <span className="font-semibold text-gray-900">{expenses.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">This Month</span>
                <span className="font-semibold text-gray-900">
                  {currency ? formatCurrencyWithSymbol(stats?.monthlyTotal || 0, currency) : `$${(stats?.monthlyTotal || 0).toFixed(2)}`}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Categories</span>
                <span className="font-semibold text-gray-900">
                  {stats ? Object.keys(stats.categoryBreakdown).length : 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Payment Methods</span>
                <span className="font-semibold text-gray-900">
                  {stats ? Object.keys(stats.paymentMethodBreakdown).length : 0}
                </span>
              </div>
            </div>
          </div>

          {stats?.topCategories && stats.topCategories.length > 0 && (
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Categories</h3>
              <div className="space-y-3">
                {stats.topCategories.slice(0, 5).map((item, index) => (
                  <div key={item.category} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${
                        index === 0 ? 'bg-red-500' :
                        index === 1 ? 'bg-blue-500' :
                        index === 2 ? 'bg-purple-500' :
                        index === 3 ? 'bg-green-500' : 'bg-yellow-500'
                      }`}></div>
                      <span className="text-sm text-gray-700">{item.category}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-semibold text-gray-900">
                        {currency ? formatCurrencyWithSymbol(item.amount, currency) : `$${item.amount.toFixed(2)}`}
                      </span>
                      <span className="text-xs text-gray-500 ml-2">{item.percentage.toFixed(1)}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {(showForm || editingExpense) && (
        <EnhancedExpenseForm
          onSubmit={editingExpense ? handleEditExpense : handleAddExpense}
          onClose={closeForm}
          initialData={editingExpense ? {
            amount: editingExpense.amount.toString(),
            category: editingExpense.category,
            date: editingExpense.date,
            description: editingExpense.description || '',
            paymentMethod: editingExpense.paymentMethod,
            paymentMethodDetails: editingExpense.paymentMethodDetails || '',
            tags: editingExpense.tags || [],
            location: editingExpense.location || '',
            isRecurring: editingExpense.isRecurring || false,
            recurringPattern: editingExpense.recurringPattern
          } : undefined}
          isEditing={!!editingExpense}
        />
      )}
    </div>
  );
};