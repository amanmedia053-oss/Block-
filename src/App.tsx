/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { AnimatePresence } from 'motion/react';
import { useAuth } from './lib/firebase';
import { Screen, Language } from './types';
import { db } from './lib/firebase';
import { doc, onSnapshot, setDoc, getDoc, serverTimestamp, collection, query, where, orderBy, limit } from 'firebase/firestore';

// Screens
import SplashScreen from './components/screens/SplashScreen';
import LoginScreen from './components/screens/LoginScreen';
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
import AdminNotificationsScreen from './components/screens/AdminNotificationsScreen';

// Components
import Navigation from './components/Navigation';
import NotificationWatcher from './components/NotificationWatcher';

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

  useEffect(() => {
    const unsubAuth = useAuth(async (u) => {
      setUser(u);
      if (!isInitializing) {
        if (!u && currentScreen !== 'splash') {
          setCurrentScreen('login');
        } else if (u && (currentScreen === 'login' || currentScreen === 'splash')) {
          setCurrentScreen('dashboard');
        }
      }
    });
    return unsubAuth;
  }, [isInitializing, currentScreen]);

  useEffect(() => {
    if (!user) {
      setIsPremium(false);
      setIsAdmin(false);
      setReportCount(0);
      setFavorites([]);
      return;
    }

    setIsAdmin(user.email === 'majidbhatti6312@gmail.com' && user.emailVerified);
    
    const userDocRef = doc(db, 'users', user.uid);
    
    // Sync user doc
    const syncUser = async () => {
      try {
        const snap = await getDoc(userDocRef);
        if (!snap.exists()) {
          await setDoc(userDocRef, {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName || null,
            photoURL: user.photoURL || null,
            isPremium: false,
            favoriteTemplates: [],
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });
        }
      } catch (err) {
        console.error("User sync error:", err);
      }
    };
    syncUser();

    // Listen for premium status and favorites
    const unsubUser = onSnapshot(userDocRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setIsPremium(data.isPremium || false);
        setFavorites(data.favoriteTemplates || []);
      }
    }, (err) => console.error("User listener error:", err));

    // Listen for report count
    const q = query(collection(db, 'reports'), where('userId', '==', user.uid));
    const unsubCount = onSnapshot(q, (snap) => {
      setReportCount(snap.size);
    }, (err) => console.error("Report count error:", err));

    return () => {
      unsubUser();
      unsubCount();
    };
  }, [user]);

  const handleSplashComplete = () => {
    setIsInitializing(false);
    if (user) {
      setCurrentScreen('dashboard');
    } else {
      setCurrentScreen('login');
    }
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case 'splash':
        return <SplashScreen key="splash" onComplete={handleSplashComplete} />;
      case 'login':
        return <LoginScreen key="login" onLogin={(u) => { setUser(u); setCurrentScreen('dashboard'); }} />;
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
            onLogout={() => { setUser(null); setCurrentScreen('login'); }} 
            onNavigate={navigateTo}
          />
        );
      case 'checkNumber':
        return <NumberValidationScreen key="checkNumber" lang={lang} isPremium={isPremium} reportCount={reportCount} initialReport={selectedReport} onBack={() => { setSelectedReport(null); setCurrentScreen('dashboard'); }} />;
      case 'policy':
        return <PolicyScreen key="policy" lang={lang} onBack={() => setCurrentScreen(navSource)} />;
      case 'help':
        return <HelpScreen key="help" lang={lang} onBack={() => setCurrentScreen(navSource)} />;
      case 'admin-notifications':
        return <AdminNotificationsScreen key="admin-notifications" lang={lang} onBack={() => setCurrentScreen('settings')} />;
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
        <NotificationWatcher user={user} lang={lang} />
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
