/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { AnimatePresence } from 'motion/react';
import { App as CapacitorApp } from '@capacitor/app';
import { StatusBar, Style } from '@capacitor/status-bar';
import { generateDeviceId, isValidActivationCode } from './lib/activation';
import { Screen, Language } from './types';

// Screens
import SplashScreen from './components/screens/SplashScreen';
import Dashboard from './components/screens/Dashboard';
import CreateReportScreen from './components/screens/CreateReportScreen';
import ReportPreviewScreen from './components/screens/ReportPreviewScreen';
import UploadReportsScreen from './components/screens/UploadReportsScreen';
import TemplatesScreen from './components/screens/TemplatesScreen';
import HistoryScreen from './components/screens/HistoryScreen';
import SettingsScreen from './components/screens/SettingsScreen';
import NumberValidationScreen from './components/screens/NumberValidationScreen';
import PolicyScreen from './components/screens/PolicyScreen';
import HelpScreen from './components/screens/HelpScreen';

// Components
import Navigation from './components/Navigation';

import { ToastProvider } from './components/ui/Toast';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('splash');
  const [navSource, setNavSource] = useState<Screen>('dashboard');
  const [lang, setLang] = useState<Language>('ps');

  // Unified screen change handler
  const navigateTo = (screen: Screen) => {
    if (currentScreen !== screen) {
      setNavSource(currentScreen);
      setCurrentScreen(screen);
    }
  };

  // Scroll to top on screen change
  useEffect(() => {
    const container = document.querySelector('.flex-1.overflow-y-auto');
    if (container) {
      container.scrollTo({ top: 0, behavior: 'instant' });
    } else {
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  }, [currentScreen]);

  const [user, setUser] = useState<any>(null);
  const [isPremium, setIsPremium] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [reportCount, setReportCount] = useState(0);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [prefilledContent, setPrefilledContent] = useState('');
  
  // Theme state
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [primaryColor, setPrimaryColor] = useState('#10b981');

  // Capacitor Integration
  useEffect(() => {
    const initCapacitor = async () => {
      // Hardware Back Button
      try {
        await CapacitorApp.removeAllListeners();
        await CapacitorApp.addListener('backButton', () => {
          if (currentScreen === 'dashboard' || currentScreen === 'splash') {
            CapacitorApp.exitApp();
          } else {
            // Logic to go back based on screen
            if (['create', 'templates', 'history', 'settings', 'upload'].includes(currentScreen)) {
              setCurrentScreen('dashboard');
            } else if (currentScreen === 'preview') {
              setCurrentScreen('create');
            } else if (['policy', 'help', 'checkNumber'].includes(currentScreen)) {
              if (currentScreen === 'checkNumber') {
                setCurrentScreen('dashboard');
              } else {
                setCurrentScreen(navSource || 'settings');
              }
            } else {
              setCurrentScreen('dashboard');
            }
          }
        });
      } catch (e) {
        console.log("Capacitor App not running");
      }

      // Status Bar Styling
      try {
        await StatusBar.setStyle({ 
          style: isDarkMode ? Style.Dark : Style.Light 
        });
        await StatusBar.setBackgroundColor({ 
          color: primaryColor 
        });
      } catch (e) {
        console.log("Capacitor StatusBar not running");
      }
    };

    initCapacitor();
  }, [currentScreen, isDarkMode, navSource]);

  useEffect(() => {
    // Apply theme to body
    if (isDarkMode) {
      document.body.classList.add('dark');
      document.body.classList.remove('light');
    } else {
      document.body.classList.add('light');
      document.body.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Offline User Initialization
  useEffect(() => {
    const initUser = () => {
      const storedUser = localStorage.getItem('reporter_app_user');
      const deviceId = generateDeviceId();
      
      if (storedUser) {
        const u = JSON.parse(storedUser);
        setUser({ ...u, deviceId });
        setIsPremium(localStorage.getItem(`premium_${deviceId}`) === 'true');
        // Admin check (Local secret or name for testing)
        setIsAdmin(localStorage.getItem('admin_mode') === 'true');
      } else {
        const newUser = {
          name: 'User',
          id: deviceId,
          deviceId: deviceId,
          createdAt: new Date().toISOString()
        };
        localStorage.setItem('reporter_app_user', JSON.stringify(newUser));
        setUser(newUser);
      }
      setIsInitializing(false);
    };
    initUser();
  }, []);

  // Sync count and stats from localStorage
  useEffect(() => {
    if (!user) return;
    
    const updateStats = () => {
      const reports = JSON.parse(localStorage.getItem('local_reports') || '[]');
      setReportCount(reports.length);
      
      const storedUser = localStorage.getItem('reporter_app_user');
      if (storedUser) {
        const u = JSON.parse(storedUser);
        setFavorites(u.favoriteTemplates || []);
      }
    };

    updateStats();
    // Re-check stats every time we return to dashboard or app starts
    window.addEventListener('storage', updateStats);
    return () => window.removeEventListener('storage', updateStats);
  }, [user, currentScreen]);

  const handleSplashComplete = () => {
    setCurrentScreen('dashboard');
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case 'splash':
        return <SplashScreen key="splash" onComplete={handleSplashComplete} />;
      case 'dashboard':
        return <Dashboard key="dashboard" user={user} lang={lang} isPremium={isPremium} isAdmin={isAdmin} reportCount={reportCount} setScreen={navigateTo} />;
      case 'create':
        return <CreateReportScreen key="create" user={user} lang={lang} isPremium={isPremium} reportCount={reportCount} prefilledDescription={prefilledContent} onBack={() => { setPrefilledContent(''); setCurrentScreen('dashboard'); }} onPreview={(r) => { setSelectedReport(r); setCurrentScreen('preview'); }} />;
      case 'preview':
        return <ReportPreviewScreen key="preview" lang={lang} report={selectedReport} onBack={() => setCurrentScreen('create')} onComplete={() => { setSelectedReport(null); setCurrentScreen('checkNumber'); }} />;
      case 'upload':
        return <UploadReportsScreen key="upload" lang={lang} isAdmin={isAdmin} onBack={() => setCurrentScreen('dashboard')} />;
      case 'templates':
        return <TemplatesScreen key="templates" user={user} lang={lang} isPremium={isPremium} favorites={favorites} onBack={() => setCurrentScreen('dashboard')} onUseTemplate={(content) => { setPrefilledContent(content); setCurrentScreen('create'); }} />;
      case 'history':
        return <HistoryScreen key="history" user={user} lang={lang} onBack={() => setCurrentScreen('dashboard')} onSelectReport={(r) => { setSelectedReport(r); setCurrentScreen('checkNumber'); }} />;
      case 'settings':
        return (
          <SettingsScreen 
            key="settings" 
            user={user} 
            lang={lang} 
            isPremium={isPremium} 
            isAdmin={isAdmin} 
            setLang={setLang} 
            isDarkMode={isDarkMode}
            setIsDarkMode={setIsDarkMode}
            primaryColor={primaryColor}
            setPrimaryColor={setPrimaryColor}
            onBack={() => setCurrentScreen('dashboard')} 
            onLogout={() => { setUser(null); setCurrentScreen('splash'); }} 
            onNavigate={navigateTo}
          />
        );
      case 'checkNumber':
        return <NumberValidationScreen key="checkNumber" lang={lang} isPremium={isPremium} reportCount={reportCount} initialReport={selectedReport} onBack={() => { setSelectedReport(null); setCurrentScreen('dashboard'); }} />;
      case 'policy':
        return <PolicyScreen key="policy" lang={lang} onBack={() => setCurrentScreen(navSource)} />;
      case 'help':
        return <HelpScreen key="help" lang={lang} onBack={() => setCurrentScreen(navSource)} />;
      default:
        return <Dashboard user={user} lang={lang} isPremium={isPremium} isAdmin={isAdmin} reportCount={reportCount} setScreen={navigateTo} />;
    }
  };

  const showNav = user && !['splash', 'login', 'create', 'preview', 'checkNumber'].includes(currentScreen);

  // Helper to get RGB from hex
  const hexToRgb = (hex: string) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `${r}, ${g}, ${b}`;
  };

  // Helper to darken a hex color (basic version)
  const darkenHex = (hex: string, amount: number) => {
    const r = Math.max(0, parseInt(hex.slice(1, 3), 16) - amount);
    const g = Math.max(0, parseInt(hex.slice(3, 5), 16) - amount);
    const b = Math.max(0, parseInt(hex.slice(5, 7), 16) - amount);
    return `rgb(${r}, ${g}, ${b})`;
  };

  const themeStyle = {
    '--primary-color': primaryColor,
    '--primary-color-rgb': hexToRgb(primaryColor),
    '--primary-color-dark': darkenHex(primaryColor, 30),
    '--primary-color-glow': `rgba(${hexToRgb(primaryColor)}, 0.05)`,
    '--primary-color-glow-strong': `rgba(${hexToRgb(primaryColor)}, 0.1)`,
    '--primary-color-glow-light': `rgba(${hexToRgb(primaryColor)}, 0.15)`,
  } as React.CSSProperties;

  return (
    <ToastProvider>
      <div className="container-mobile" style={themeStyle}>
        <AnimatePresence mode="wait">
          {renderScreen()}
        </AnimatePresence>
        
        {showNav && (
          <Navigation activeScreen={currentScreen} setScreen={navigateTo} lang={lang} />
        )}
      </div>
    </ToastProvider>
  );
}
