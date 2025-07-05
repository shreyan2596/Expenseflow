import { useState, useEffect, useCallback } from 'react';
import { userSettingsService } from '../services/userSettingsService';
import { UserSettings, DEFAULT_USER_SETTINGS } from '../types/userSettings';
import { useAuth } from './useAuth';
import { useNotifications } from './useNotifications';

interface UseUserSettingsReturn {
  settings: UserSettings | null;
  loading: boolean;
  error: string | null;
  updateSettings: (updates: Partial<UserSettings>) => Promise<void>;
  resetToDefaults: () => Promise<void>;
  refreshSettings: () => Promise<void>;
}

export const useUserSettings = (): UseUserSettingsReturn => {
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshSettings = useCallback(async () => {
    if (!user) {
      setSettings(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const userSettings = await userSettingsService.getUserSettings(user.uid);
      setSettings(userSettings);
    } catch (error: any) {
      console.error('Error fetching user settings:', error);
      setError(error.message);
      
      // Create default settings if none exist
      if (error.message.includes('not found')) {
        try {
          const defaultSettings = await userSettingsService.createDefaultSettings(user.uid);
          setSettings(defaultSettings);
          setError(null);
        } catch (createError: any) {
          console.error('Error creating default settings:', createError);
          setError(createError.message);
        }
      }
    } finally {
      setLoading(false);
    }
  }, [user]);

  const updateSettings = useCallback(async (updates: Partial<UserSettings>) => {
    if (!user || !settings) {
      throw new Error('User not authenticated or settings not loaded');
    }

    try {
      setError(null);
      
      const updatedSettings = await userSettingsService.updateUserSettings(user.uid, updates);
      setSettings(updatedSettings);
      
      addNotification({
        type: 'success',
        title: 'Settings Updated',
        message: 'Your preferences have been saved successfully.',
        duration: 3000
      });
    } catch (error: any) {
      setError(error.message);
      addNotification({
        type: 'error',
        title: 'Update Failed',
        message: error.message,
        duration: 5000
      });
      throw error;
    }
  }, [user, settings, addNotification]);

  const resetToDefaults = useCallback(async () => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    try {
      setError(null);
      
      const defaultSettings = await userSettingsService.resetToDefaults(user.uid);
      setSettings(defaultSettings);
      
      addNotification({
        type: 'success',
        title: 'Settings Reset',
        message: 'Your settings have been reset to defaults.',
        duration: 3000
      });
    } catch (error: any) {
      setError(error.message);
      addNotification({
        type: 'error',
        title: 'Reset Failed',
        message: error.message,
        duration: 5000
      });
      throw error;
    }
  }, [user, addNotification]);

  useEffect(() => {
    refreshSettings();
  }, [refreshSettings]);

  return {
    settings,
    loading,
    error,
    updateSettings,
    resetToDefaults,
    refreshSettings
  };
};