import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  query,
  where,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  limit,
  startAfter,
  QueryDocumentSnapshot
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Expense, ExpenseFormData, ExpenseStats, DEFAULT_VALIDATION_RULES } from '../types/expense';
import { UserSettings } from '../types/userSettings';

class ExpenseService {
  private readonly COLLECTION_NAME = 'expenses';

  async addExpense(
    userId: string, 
    expenseData: ExpenseFormData, 
    userSettings: UserSettings
  ): Promise<string> {
    try {
      // Validate user authentication
      if (!userId || userId.trim() === '') {
        throw new Error('User must be authenticated to add expenses');
      }

      this.validateExpenseData(expenseData, userSettings);

      const expense = {
        userId,
        amount: parseFloat(expenseData.amount),
        currencyCode: userSettings.currency.code,
        currencySymbol: userSettings.currency.symbol,
        category: expenseData.category,
        date: expenseData.date,
        description: expenseData.description.trim() || null,
        paymentMethod: expenseData.paymentMethod,
        paymentMethodDetails: expenseData.paymentMethodDetails?.trim() || null,
        tags: expenseData.tags || [],
        location: expenseData.location?.trim() || null,
        isRecurring: expenseData.isRecurring || false,
        recurringPattern: expenseData.recurringPattern || null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      console.log('Adding expense for user:', userId, 'with data:', expense);

      const docRef = await addDoc(collection(db, this.COLLECTION_NAME), expense);
      return docRef.id;
    } catch (error: any) {
      console.error('Error adding expense:', error);
      throw this.handleError(error);
    }
  }

  async updateExpense(
    expenseId: string, 
    userId: string, 
    expenseData: ExpenseFormData,
    userSettings: UserSettings
  ): Promise<void> {
    try {
      // Validate user authentication
      if (!userId || userId.trim() === '') {
        throw new Error('User must be authenticated to update expenses');
      }

      this.validateExpenseData(expenseData, userSettings);

      const expense = {
        amount: parseFloat(expenseData.amount),
        currencyCode: userSettings.currency.code,
        currencySymbol: userSettings.currency.symbol,
        category: expenseData.category,
        date: expenseData.date,
        description: expenseData.description.trim() || null,
        paymentMethod: expenseData.paymentMethod,
        paymentMethodDetails: expenseData.paymentMethodDetails?.trim() || null,
        tags: expenseData.tags || [],
        location: expenseData.location?.trim() || null,
        isRecurring: expenseData.isRecurring || false,
        recurringPattern: expenseData.recurringPattern || null,
        updatedAt: serverTimestamp()
      };

      await updateDoc(doc(db, this.COLLECTION_NAME, expenseId), expense);
    } catch (error: any) {
      console.error('Error updating expense:', error);
      throw this.handleError(error);
    }
  }

  async deleteExpense(expenseId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, this.COLLECTION_NAME, expenseId));
    } catch (error: any) {
      console.error('Error deleting expense:', error);
      throw this.handleError(error);
    }
  }

  async getUserExpenses(userId: string): Promise<Expense[]> {
    try {
      // Validate user authentication
      if (!userId || userId.trim() === '') {
        throw new Error('User must be authenticated to fetch expenses');
      }

      // Use a simpler query to avoid composite index requirement
      const q = query(
        collection(db, this.COLLECTION_NAME),
        where('userId', '==', userId)
      );

      const querySnapshot = await getDocs(q);
      const expenses = querySnapshot.docs.map(doc => this.mapDocToExpense(doc));
      
      // Sort by date in memory to avoid needing composite index
      return expenses.sort((a, b) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        return dateB - dateA; // Most recent first
      });
    } catch (error: any) {
      console.error('Error fetching expenses:', error);
      throw this.handleError(error);
    }
  }

  subscribeToUserExpenses(
    userId: string, 
    callback: (expenses: Expense[]) => void,
    onError?: (error: Error) => void
  ): () => void {
    try {
      // Validate user authentication
      if (!userId || userId.trim() === '') {
        throw new Error('User must be authenticated to subscribe to expenses');
      }

      // Use a simpler query without orderBy to avoid composite index requirement
      const q = query(
        collection(db, this.COLLECTION_NAME),
        where('userId', '==', userId)
      );

      return onSnapshot(
        q,
        (querySnapshot) => {
          const expenses = querySnapshot.docs.map(doc => this.mapDocToExpense(doc));
          // Sort by date in memory to avoid needing composite index
          const sortedExpenses = expenses.sort((a, b) => {
            const dateA = new Date(a.date).getTime();
            const dateB = new Date(b.date).getTime();
            return dateB - dateA; // Most recent first
          });
          callback(sortedExpenses);
        },
        (error) => {
          console.error('Error in expense subscription:', error);
          if (onError) {
            onError(this.handleError(error));
          }
        }
      );
    } catch (error: any) {
      console.error('Error setting up expense subscription:', error);
      throw this.handleError(error);
    }
  }

  async getExpenseStats(userId: string): Promise<ExpenseStats> {
    try {
      // Validate user authentication
      if (!userId || userId.trim() === '') {
        throw new Error('User must be authenticated to get expense stats');
      }

      const expenses = await this.getUserExpenses(userId);
      
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      
      // Calculate date ranges
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      startOfWeek.setHours(0, 0, 0, 0);

      const monthlyExpenses = expenses.filter(expense => {
        const expenseDate = new Date(expense.date);
        return expenseDate.getMonth() === currentMonth && 
               expenseDate.getFullYear() === currentYear;
      });

      const weeklyExpenses = expenses.filter(expense => {
        const expenseDate = new Date(expense.date);
        return expenseDate >= startOfWeek;
      });

      const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
      const monthlyTotal = monthlyExpenses.reduce((sum, expense) => sum + expense.amount, 0);
      const weeklyTotal = weeklyExpenses.reduce((sum, expense) => sum + expense.amount, 0);
      
      // Calculate daily average (last 30 days)
      const last30Days = expenses.filter(expense => {
        const expenseDate = new Date(expense.date);
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        return expenseDate >= thirtyDaysAgo;
      });
      const dailyAverage = last30Days.length > 0 ? 
        last30Days.reduce((sum, expense) => sum + expense.amount, 0) / 30 : 0;

      // Category breakdown
      const categoryBreakdown: Record<string, number> = {};
      expenses.forEach(expense => {
        categoryBreakdown[expense.category] = (categoryBreakdown[expense.category] || 0) + expense.amount;
      });

      // Payment method breakdown
      const paymentMethodBreakdown: Record<string, number> = {};
      expenses.forEach(expense => {
        paymentMethodBreakdown[expense.paymentMethod] = (paymentMethodBreakdown[expense.paymentMethod] || 0) + expense.amount;
      });

      // Top categories
      const topCategories = Object.entries(categoryBreakdown)
        .map(([category, amount]) => ({
          category,
          amount,
          percentage: totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0
        }))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 5);

      // Monthly trend (last 6 months)
      const monthlyTrend = [];
      for (let i = 5; i >= 0; i--) {
        const date = new Date(currentYear, currentMonth - i, 1);
        const monthExpenses = expenses.filter(expense => {
          const expenseDate = new Date(expense.date);
          return expenseDate.getMonth() === date.getMonth() && 
                 expenseDate.getFullYear() === date.getFullYear();
        });
        const amount = monthExpenses.reduce((sum, expense) => sum + expense.amount, 0);
        monthlyTrend.push({
          month: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          amount
        });
      }

      const recentExpenses = expenses.slice(0, 5);

      return {
        totalExpenses,
        monthlyTotal,
        weeklyTotal,
        dailyAverage,
        categoryBreakdown,
        paymentMethodBreakdown,
        recentExpenses,
        topCategories,
        monthlyTrend
      };
    } catch (error: any) {
      console.error('Error calculating expense stats:', error);
      throw this.handleError(error);
    }
  }

  private mapDocToExpense(doc: QueryDocumentSnapshot): Expense {
    const data = doc.data();
    return {
      id: doc.id,
      userId: data.userId,
      amount: data.amount,
      currencyCode: data.currencyCode || 'USD',
      currencySymbol: data.currencySymbol || '$',
      category: data.category,
      date: data.date,
      description: data.description,
      paymentMethod: data.paymentMethod,
      paymentMethodDetails: data.paymentMethodDetails,
      tags: data.tags || [],
      receiptUrl: data.receiptUrl,
      location: data.location,
      isRecurring: data.isRecurring || false,
      recurringPattern: data.recurringPattern,
      createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt),
      updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date(data.updatedAt)
    };
  }

  private validateExpenseData(data: ExpenseFormData, userSettings: UserSettings): void {
    const rules = DEFAULT_VALIDATION_RULES;

    // Amount validation
    if (!data.amount || isNaN(parseFloat(data.amount))) {
      throw new Error('Please enter a valid amount');
    }

    const amount = parseFloat(data.amount);
    if (amount < rules.amount.min) {
      throw new Error(`Amount must be at least ${userSettings.currency.symbol}${rules.amount.min}`);
    }

    if (amount > rules.amount.max) {
      throw new Error(`Amount cannot exceed ${userSettings.currency.symbol}${rules.amount.max.toLocaleString()}`);
    }

    // Check decimal places based on currency
    const decimalPlaces = (data.amount.split('.')[1] || '').length;
    if (decimalPlaces > rules.amount.decimalPlaces) {
      throw new Error(`Amount can have at most ${rules.amount.decimalPlaces} decimal places`);
    }

    // Category validation
    if (rules.category.required && (!data.category || data.category.trim() === '')) {
      throw new Error('Please select a category');
    }

    // Date validation
    if (!data.date || data.date.trim() === '') {
      throw new Error('Please select a date');
    }

    const selectedDate = new Date(data.date);
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    if (!rules.date.allowFuture && selectedDate > today) {
      throw new Error('Date cannot be in the future');
    }

    const maxPastDate = new Date(today.getTime() - rules.date.maxPastDays * 24 * 60 * 60 * 1000);
    if (selectedDate < maxPastDate) {
      throw new Error(`Date cannot be more than ${rules.date.maxPastDays} days in the past`);
    }

    // Payment method validation
    if (rules.paymentMethod.required && (!data.paymentMethod || data.paymentMethod.trim() === '')) {
      throw new Error('Please select a payment method');
    }

    // Payment method details validation for "Other"
    if (data.paymentMethod === 'Other' && (!data.paymentMethodDetails || data.paymentMethodDetails.trim() === '')) {
      throw new Error('Please specify the payment method details');
    }

    // Description validation
    if (data.description && data.description.length > rules.description.maxLength) {
      throw new Error(`Description cannot exceed ${rules.description.maxLength} characters`);
    }

    // Location validation
    if (data.location && data.location.length > 100) {
      throw new Error('Location cannot exceed 100 characters');
    }

    // Tags validation
    if (data.tags && data.tags.length > 10) {
      throw new Error('Cannot have more than 10 tags');
    }

    if (data.tags) {
      for (const tag of data.tags) {
        if (tag.length > 20) {
          throw new Error('Each tag cannot exceed 20 characters');
        }
      }
    }
  }

  private handleError(error: any): Error {
    if (error.code === 'permission-denied') {
      return new Error('Access denied. Please make sure you are logged in and have permission to perform this action. If the problem persists, check your Firebase security rules.');
    }
    
    if (error.code === 'unavailable') {
      return new Error('Service is currently unavailable. Please try again later');
    }

    if (error.code === 'failed-precondition') {
      return new Error('Database operation failed. Please check your connection and try again');
    }

    if (error.code === 'unauthenticated') {
      return new Error('You must be logged in to perform this action');
    }

    if (error.message && error.message.includes('index')) {
      return new Error('Database configuration issue. Please contact support if this persists');
    }

    return new Error(error.message || 'An unexpected error occurred');
  }
}

export const expenseService = new ExpenseService();