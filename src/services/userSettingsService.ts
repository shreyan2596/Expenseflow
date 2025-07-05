import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { UserSettings, DEFAULT_USER_SETTINGS } from '../types/userSettings';

class UserSettingsService {
  private readonly COLLECTION_NAME = 'userSettings';

  async getUserSettings(userId: string): Promise<UserSettings> {
    try {
      const settingsDoc = await getDoc(doc(db, this.COLLECTION_NAME, userId));
      
      if (!settingsDoc.exists()) {
        throw new Error('User settings not found');
      }

      const data = settingsDoc.data();
      return {
        id: settingsDoc.id,
        userId: data.userId,
        currency: data.currency,
        dateFormat: data.dateFormat,
        customCategories: data.customCategories || [],
        defaultPaymentMethod: data.defaultPaymentMethod,
        notifications: data.notifications || DEFAULT_USER_SETTINGS.notifications,
        privacy: data.privacy || DEFAULT_USER_SETTINGS.privacy,
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt),
        updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date(data.updatedAt)
      };
    } catch (error: any) {
      console.error('Error fetching user settings:', error);
      throw this.handleError(error);
    }
  }

  async createDefaultSettings(userId: string): Promise<UserSettings> {
    try {
      const defaultSettings = {
        userId,
        ...DEFAULT_USER_SETTINGS,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      await setDoc(doc(db, this.COLLECTION_NAME, userId), defaultSettings);
      
      return {
        id: userId,
        userId,
        ...DEFAULT_USER_SETTINGS,
        createdAt: new Date(),
        updatedAt: new Date()
      };
    } catch (error: any) {
      console.error('Error creating default settings:', error);
      throw this.handleError(error);
    }
  }

  async updateUserSettings(userId: string, updates: Partial<UserSettings>): Promise<UserSettings> {
    try {
      const updateData = {
        ...updates,
        updatedAt: serverTimestamp()
      };

      // Remove fields that shouldn't be updated
      delete updateData.id;
      delete updateData.userId;
      delete updateData.createdAt;

      await updateDoc(doc(db, this.COLLECTION_NAME, userId), updateData);
      
      // Fetch and return updated settings
      return await this.getUserSettings(userId);
    } catch (error: any) {
      console.error('Error updating user settings:', error);
      throw this.handleError(error);
    }
  }

  async resetToDefaults(userId: string): Promise<UserSettings> {
    try {
      const defaultSettings = {
        userId,
        ...DEFAULT_USER_SETTINGS,
        updatedAt: serverTimestamp()
      };

      await updateDoc(doc(db, this.COLLECTION_NAME, userId), defaultSettings);
      
      return {
        id: userId,
        userId,
        ...DEFAULT_USER_SETTINGS,
        createdAt: new Date(),
        updatedAt: new Date()
      };
    } catch (error: any) {
      console.error('Error resetting settings:', error);
      throw this.handleError(error);
    }
  }

  async addCustomCategory(userId: string, category: string): Promise<UserSettings> {
    try {
      const currentSettings = await this.getUserSettings(userId);
      const updatedCategories = [...new Set([...currentSettings.customCategories, category])];
      
      return await this.updateUserSettings(userId, {
        customCategories: updatedCategories
      });
    } catch (error: any) {
      console.error('Error adding custom category:', error);
      throw this.handleError(error);
    }
  }

  async removeCustomCategory(userId: string, category: string): Promise<UserSettings> {
    try {
      const currentSettings = await this.getUserSettings(userId);
      const updatedCategories = currentSettings.customCategories.filter(cat => cat !== category);
      
      return await this.updateUserSettings(userId, {
        customCategories: updatedCategories
      });
    } catch (error: any) {
      console.error('Error removing custom category:', error);
      throw this.handleError(error);
    }
  }

  private handleError(error: any): Error {
    if (error.code === 'permission-denied') {
      return new Error('You do not have permission to access settings');
    }
    
    if (error.code === 'unavailable') {
      return new Error('Settings service is currently unavailable');
    }

    if (error.code === 'unauthenticated') {
      return new Error('You must be logged in to access settings');
    }

    return new Error(error.message || 'An unexpected error occurred');
  }
}

export const userSettingsService = new UserSettingsService();