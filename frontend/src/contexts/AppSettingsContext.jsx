import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api';

const AppSettingsContext = createContext({});

export const AppSettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState({
    app_name: 'QuizzApp',
    app_primary_color: '#6366f1',
    app_accent_color: '#f59e0b',
    app_logo: '',
  });

  useEffect(() => {
    api.get('/settings/public').then(({ data }) => setSettings(prev => ({ ...prev, ...data }))).catch(() => {});
  }, []);

  useEffect(() => {
    document.title = settings.app_name || 'QuizzApp';
    if (settings.app_favicon) {
      const link = document.querySelector('link[rel="icon"]') || document.createElement('link');
      link.rel = 'icon';
      link.href = settings.app_favicon;
      document.head.appendChild(link);
    }
  }, [settings]);

  return (
    <AppSettingsContext.Provider value={{ settings, setSettings }}>
      {children}
    </AppSettingsContext.Provider>
  );
};

export const useAppSettings = () => useContext(AppSettingsContext);
