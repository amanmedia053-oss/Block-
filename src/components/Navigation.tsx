import { motion } from 'motion/react';
import { Home, FileText, Upload, History, Settings } from 'lucide-react';
import { Screen } from '../types';
import { Language, translations } from '../lib/locales';

export default function Navigation({ 
  activeScreen, 
  setScreen,
  lang
}: { 
  activeScreen: Screen, 
  setScreen: (s: Screen) => void,
  lang: Language
}) {
  const t = translations[lang];
  const tabs: { id: Screen, icon: any, label: string }[] = [
    { id: 'dashboard', icon: Home, label: t.home },
    { id: 'templates', icon: FileText, label: t.reports },
    { id: 'upload', icon: Upload, label: t.upload },
    { id: 'history', icon: History, label: t.history },
    { id: 'settings', icon: Settings, label: t.settings },
  ];

  return (
    <nav className="absolute bottom-0 left-0 right-0 z-40 px-6 pb-8 pt-4" dir={lang === 'ps' ? 'rtl' : 'ltr'}>
      <div className="max-w-md mx-auto glass-card flex items-center justify-around p-3 backdrop-blur-2xl bg-white/[0.05] border-white/[0.05] shadow-[0_-20px_50px_rgba(0,0,0,0.5)]">
        {tabs.map((tab) => {
          const isActive = activeScreen === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setScreen(tab.id)}
              className="relative flex flex-col items-center gap-1 p-2 group"
            >
              <div className={`relative z-10 transition-all duration-300 ${isActive ? 'text-brand -translate-y-2' : 'text-gray-500 group-hover:text-gray-300'}`}>
                <tab.icon className={`w-6 h-6 stroke-[1.5px] ${isActive ? 'stroke-[2.5px]' : ''}`} />
              </div>
              
              <span className={`text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${isActive ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`}>
                {tab.label}
              </span>

              {isActive && (
                <motion.div 
                  layoutId="nav-bg"
                  className="absolute -top-1 w-10 h-10 bg-brand-soft rounded-2xl blur-xl"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
