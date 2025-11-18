import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

export interface AppSettings {
  autoHeading: boolean;
  showDegrees: boolean;
  highAccuracy: boolean;
  darkMode: boolean;
  vibrationFeedback: boolean;
  batterySaver: boolean;
  reducedAnimations: boolean;
}

interface SettingsContextType {
  settings: AppSettings;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
  isLoading: boolean;
}

const defaultSettings: AppSettings = {
  autoHeading: true,
  showDegrees: true,
  highAccuracy: true,
  darkMode: false,
  vibrationFeedback: true,
  batterySaver: false,
  reducedAnimations: false,
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);

  // Load settings from localStorage on mount
  useEffect(() => {
    const loadSettings = () => {
      try {
        const savedSettings = localStorage.getItem('sunsafe-settings');
        if (savedSettings) {
          const parsedSettings = JSON.parse(savedSettings);
          setSettings(prev => ({ ...prev, ...parsedSettings }));
          applyGlobalSettings(parsedSettings);
        }
      } catch (error) {
        console.error('Error loading settings:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, []);

  // Apply settings globally
  const applyGlobalSettings = (newSettings: AppSettings) => {
    // Apply dark mode
    if (newSettings.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // Apply reduced animations
    if (newSettings.reducedAnimations) {
      document.documentElement.classList.add('reduce-motion');
    } else {
      document.documentElement.classList.remove('reduce-motion');
    }

    // Store in localStorage
    localStorage.setItem('sunsafe-settings', JSON.stringify(newSettings));
  };

  const updateSettings = (newSettings: Partial<AppSettings>) => {
    setSettings(prev => {
      const updatedSettings = { ...prev, ...newSettings };
      applyGlobalSettings(updatedSettings);
      return updatedSettings;
    });
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, isLoading }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = (): SettingsContextType => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};