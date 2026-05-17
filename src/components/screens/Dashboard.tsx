import { motion } from 'motion/react';
import { 
  Plus, Upload, FileText, History, Cloud, 
  Bell, Search, ChevronRight, Activity, 
  ShieldCheck, ShieldAlert, FileSearch, Sparkles, Hash, Phone,
  Clock, Lock, HelpCircle
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { Language, translations } from '../../lib/locales';
import { Screen } from '../../types';

export default function Dashboard({ 
  user, 
  lang,
  isPremium,
  isAdmin,
  reportCount,
  setScreen 
}: { 
  user: any, 
  lang: Language,
  isPremium: boolean,
  isAdmin: boolean,
  reportCount: number,
  setScreen: (s: any) => void 
}) {
  const t = translations[lang];
  const [recentReportsCount, setRecentReportsCount] = useState(0);
  const isTrialOver = !isPremium && reportCount >= 2;

  useEffect(() => {
    const localData = localStorage.getItem('local_reports');
    if (localData) {
      const parsed = JSON.parse(localData);
      setRecentReportsCount(parsed.length);
    }
  }, [reportCount]);

  const stats = [
    { label: t.reports, value: recentReportsCount.toString(), icon: FileText, color: 'text-brand', bg: 'bg-brand-soft' },
  ];

  const quickActions = [
    { id: 'create', label: t.createReport, icon: Plus, desc: lang === 'ps' ? 'نوی رپوټ جوړ کړئ' : 'Generate new report', premium: isTrialOver },
    { id: 'templates', label: t.templates, icon: FileSearch, desc: lang === 'ps' ? 'پخواني کالبونه' : 'Pre-defined formats', premium: false },
    { id: 'history', label: t.history, icon: History, desc: lang === 'ps' ? 'پخواني عملیات' : 'Previous reports', premium: false },
    { id: 'help', label: t.help, icon: HelpCircle, desc: lang === 'ps' ? 'مرسته ترلاسه کړئ' : 'Get support', premium: false },
    { id: 'policy', label: t.policy, icon: ShieldCheck, desc: lang === 'ps' ? 'زموږ قوانین' : 'Our privacy rules', premium: false },
    { id: 'upload', label: t.uploadReports, icon: Upload, desc: lang === 'ps' ? 'فایلونه اپلوډ کړئ' : 'Bulk import files', premium: !isAdmin },
  ];

  const handleAction = (id: string, isLocked: boolean) => {
    if (isLocked) {
      if (id === 'upload') return;
      setScreen('settings');
    } else {
      setScreen(id as Screen);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`flex-1 min-h-0 overflow-y-auto px-6 pt-16 pb-32 ${lang === 'ps' ? 'text-right' : 'text-left'}`}
      dir={lang === 'ps' ? 'rtl' : 'ltr'}
    >
      <header className={`flex items-center justify-between mb-10 ${lang === 'ps' ? 'flex-row-reverse' : ''}`}>
        <div className={`flex items-center gap-4 ${lang === 'ps' ? 'flex-row-reverse' : ''}`}>
          <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 p-1">
            <img 
              src={user?.photoURL || `https://ui-avatars.com/api/?name=${user?.name || 'User'}&background=10b981&color=fff`} 
              alt="Avatar" 
              className="w-full h-full rounded-[14px] object-cover"
            />
          </div>
          <div>
            <p className="text-gray-400 text-sm">{t.welcome}</p>
            <h3 className="text-xl font-bold font-display">{user?.name || 'User'}</h3>
          </div>
        </div>
        <button className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center relative active:scale-90 transition-transform">
          <Bell className="w-5 h-5 text-gray-400" />
          <span className="absolute top-3 right-3 w-2 h-2 bg-brand rounded-full border-2 border-[#050505]"></span>
        </button>
      </header>

      {/* Main Action Section */}
      <div className="mb-10">
        <button 
          onClick={() => handleAction('checkNumber', isTrialOver)}
          className={`w-full glass-card p-6 flex items-center gap-6 group border-brand-soft bg-brand-soft ${isTrialOver ? 'opacity-70' : ''}`}
          style={!isTrialOver ? { boxShadow: '0 0 20px var(--primary-color-glow-strong)' } : {}}
        >
          <div className={`w-16 h-16 rounded-2xl bg-brand-soft flex items-center justify-center group-hover:scale-110 transition-transform ${isTrialOver ? 'grayscale opacity-50' : ''}`}>
            {isTrialOver ? <Lock className="w-8 h-8 text-white" /> : <Phone className="w-8 h-8 text-brand" />}
          </div>
          <div className="grow">
            <h4 className={`text-xl font-bold mb-1 ${isTrialOver ? 'text-gray-400' : 'text-brand'}`}>
              {t.openNumber} {isTrialOver && <span className="text-[10px] bg-brand-soft text-brand px-2 py-0.5 rounded-full ml-1 uppercase">{t.locked}</span>}
            </h4>
            <p className="text-gray-400 text-sm">{isTrialOver ? t.freeTrialEnded : t.openNumberSub}</p>
          </div>
          <ChevronRight className={`w-6 h-6 text-brand-soft-glow ${lang === 'ps' ? 'rotate-180' : ''}`} />
        </button>
      </div>

      <section className="grid grid-cols-1 gap-4 mb-10">
        {stats.map((stat, i) => (
          <div key={i} className="glass-card p-5 flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl ${stat.bg} flex items-center justify-center`}>
              <stat.icon className={`w-6 h-6 ${stat.color}`} />
            </div>
            <div>
              <p className="text-gray-400 text-sm mb-0.5">{stat.label}</p>
              <h4 className="text-2xl font-bold font-display" dir="ltr">{stat.value}</h4>
            </div>
          </div>
        ))}
      </section>

      <section className="mb-10">
        <div className={`flex items-center justify-between mb-6 ${lang === 'ps' ? 'flex-row-reverse' : ''}`}>
          <h4 className="text-lg font-bold font-display">{t.quickActions}</h4>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {quickActions.map((action, i) => (
            <motion.button
              key={i}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleAction(action.id, action.premium)}
              className={`glass-card p-5 flex flex-col items-start text-left group relative overflow-hidden ${action.premium ? 'opacity-50 grayscale' : ''}`}
              dir={lang === 'ps' ? 'rtl' : 'ltr'}
            >
              {action.premium && (
                <div className={`absolute top-4 ${lang === 'ps' ? 'left-4' : 'right-4'}`}>
                  <Lock className="w-3 h-3 text-brand" />
                </div>
              )}
              
              <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-4 group-hover:bg-brand-soft group-hover:border-brand-soft transition-colors">
                <action.icon className={`w-6 h-6 transition-colors ${action.premium ? 'text-gray-600' : 'text-gray-400 group-hover:text-brand'}`} />
              </div>
              <h5 className="font-bold mb-1">{action.label}</h5>
              <p className="text-gray-500 text-xs">{action.desc}</p>
            </motion.button>
          ))}
        </div>
      </section>
    </motion.div>
  );
}
