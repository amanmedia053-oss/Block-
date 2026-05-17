import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronLeft, Globe, Phone, Mail, 
  ListFilter, FileText, Sparkles, Send, 
  Save, Eye, AlertCircle, Lock, X, Check
} from 'lucide-react';
import { getAISuggestions, generateReportContent } from '../../lib/gemini';
import { db, handleFirestoreError, OperationType } from '../../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useToast } from '../ui/Toast';

import { Language, translations } from '../../lib/locales';

export default function CreateReportScreen({ 
  user, 
  lang,
  isPremium,
  reportCount,
  prefilledDescription = '',
  onBack, 
  onPreview 
}: { 
  user: any, 
  lang: Language,
  isPremium: boolean,
  reportCount: number,
  prefilledDescription?: string,
  onBack: () => void, 
  onPreview: (report: any) => void 
}) {
  const t = translations[lang];
  const isTrialOver = !isPremium;
  const [formData, setFormData] = useState({
    country: 'Afghanistan',
    phoneNumber: '',
    targetEmail: '',
    reportType: 'Spam',
    description: prefilledDescription,
  });
  
  const [customType, setCustomType] = useState('');
  const [isCountrySheetOpen, setIsCountrySheetOpen] = useState(false);
  const [isTypeSheetOpen, setIsTypeSheetOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  const { showToast } = useToast();

  const countries = [
    { code: '+93', name: 'Afghanistan', flag: '🇦🇫' },
    { code: '+92', name: 'Pakistan', flag: '🇵🇰' },
    { code: '+91', name: 'India', flag: '🇮🇳' },
    { code: '+98', name: 'Iran', flag: '🇮🇷' },
    { code: '+992', name: 'Tajikistan', flag: '🇹🇯' },
    { code: '+993', name: 'Turkmenistan', flag: '🇹🇲' },
    { code: '+998', name: 'Uzbekistan', flag: '🇺🇿' },
    { code: '+90', name: 'Turkey', flag: '🇹🇷' },
    { code: '+971', name: 'UAE', flag: '🇦🇪' },
    { code: '+966', name: 'Saudi Arabia', flag: '🇸🇦' },
    { code: '+974', name: 'Qatar', flag: '🇶🇦' },
    { code: '+49', name: 'Germany', flag: '🇩🇪' },
    { code: '+44', name: 'UK', flag: '🇬🇧' },
    { code: '+33', name: 'France', flag: '🇫🇷' },
    { code: '+7', name: 'Russia', flag: '🇷🇺' },
    { code: '+1', name: 'USA', flag: '🇺🇸' },
    { code: '+61', name: 'Australia', flag: '🇦🇺' },
  ];

  const reportTypes = [
    { id: 'Custom', label: lang === 'ps' ? 'کسټم ډول' : 'Custom Type', color: 'text-purple-400' },
    { id: 'Spam', label: lang === 'ps' ? 'بې ځایه پیامونه' : 'Spam & Abuse', color: 'text-orange-500' },
    { id: 'Fake Account', label: lang === 'ps' ? 'جعلي اکاونټ' : 'Fake Account', color: 'text-gray-400' },
    { id: 'Harassment', label: lang === 'ps' ? 'توهین او سپکاوی' : 'Harassment', color: 'text-red-500' },
    { id: 'Identity Theft', label: lang === 'ps' ? 'د هویت غلا' : 'Identity Theft', color: 'text-blue-500' },
    { id: 'Recovery', label: lang === 'ps' ? 'اکاونټ خلاصول' : 'Account Recovery', color: 'text-brand' },
  ];

  useEffect(() => {
    if (formData.description.length > 20) {
      const timer = setTimeout(async () => {
        const result = await getAISuggestions(formData.description);
        setSuggestions(result);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      setSuggestions([]);
    }
  }, [formData.description]);

  const handleGenerate = async () => {
    if (!formData.description) return;
    setIsGenerating(true);
    setError('');
    
    try {
      const content = await generateReportContent({
        reportType: formData.reportType === 'Custom' ? customType : formData.reportType,
        description: formData.description,
        phoneNumber: formData.phoneNumber,
        country: formData.country,
      });

      const reportData = {
        ...formData,
        reportType: formData.reportType === 'Custom' ? customType : formData.reportType,
        userId: user.uid,
        status: 'draft',
        generatedContent: content,
        aiSuggestion: suggestions.join(', '),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      try {
        const docRef = await addDoc(collection(db, 'reports'), reportData);
        showToast(lang === 'ps' ? 'په ډرافټ کې ثبت شو' : 'Saved to draft');
        onPreview({ ...reportData, id: docRef.id });
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, 'reports');
      }
    } catch (e) {
      setError('Failed to generate report. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className={`flex-1 overflow-y-auto px-6 pt-16 pb-32 ${lang === 'ps' ? 'text-right' : 'text-left'}`}
      dir={lang === 'ps' ? 'rtl' : 'ltr'}
    >
      <header className={`flex items-center gap-4 mb-8 ${lang === 'ps' ? 'flex-row-reverse' : ''}`}>
        <button onClick={onBack} className="p-2 -ml-2 rounded-xl active:bg-white/5">
          <ChevronLeft className={`w-6 h-6 ${lang === 'ps' ? 'rotate-180' : ''}`} />
        </button>
        <h3 className="text-2xl font-bold font-display">{t.aiSection}</h3>
      </header>

      <div className="space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-400 flex items-center gap-2">
            <Globe className="w-4 h-4" /> {t.country}
          </label>
          <button 
            onClick={() => setIsCountrySheetOpen(true)}
            className={`glass-input w-full flex items-center justify-between text-white ${lang === 'ps' ? 'flex-row-reverse' : ''}`}
          >
            <div className={`flex items-center gap-3 ${lang === 'ps' ? 'flex-row-reverse' : ''}`}>
              <span className="text-xl">
                {countries.find(c => c.name === formData.country)?.flag || '🏳️'}
              </span>
              <span>{formData.country}</span>
            </div>
            <ChevronLeft className={`w-5 h-5 text-gray-500 ${lang === 'ps' ? 'rotate-180' : ''}`} />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-400 flex items-center gap-2">
              <Phone className="w-4 h-4" /> {t.phoneNumber}
            </label>
            <input 
              type="tel" 
              placeholder="+44..." 
              className={`glass-input w-full ${lang === 'ps' ? 'text-right' : 'text-left'}`}
              value={formData.phoneNumber}
              onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})}
              dir="ltr"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-400 flex items-center gap-2">
              <Mail className="w-4 h-4" /> {lang === 'ps' ? 'ایمیل (اختیاري)' : 'Email (Optional)'}
            </label>
            <input 
              type="email" 
              placeholder="target@email.com" 
              className={`glass-input w-full ${lang === 'ps' ? 'text-right' : 'text-left'}`}
              value={formData.targetEmail}
              onChange={(e) => setFormData({...formData, targetEmail: e.target.value})}
              dir="ltr"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-400 flex items-center gap-2">
            <ListFilter className="w-4 h-4" /> {t.reportType}
          </label>
          <button 
            onClick={() => setIsTypeSheetOpen(true)}
            className={`glass-input w-full flex items-center justify-between text-white ${lang === 'ps' ? 'flex-row-reverse' : ''}`}
          >
            <span>
              {formData.reportType === 'Custom' && customType 
                ? customType 
                : reportTypes.find(r => r.id === formData.reportType)?.label}
            </span>
            <ChevronLeft className={`w-5 h-5 text-gray-500 ${lang === 'ps' ? 'rotate-180' : ''}`} />
          </button>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-400 flex items-center gap-2">
            <FileText className="w-4 h-4" /> {lang === 'ps' ? 'تفصیل' : 'Description'}
          </label>
          <textarea 
            rows={4}
            placeholder={lang === 'ps' ? 'مشکل دلته بیان کړئ...' : 'Describe the issue in detail...'} 
            className={`glass-input w-full resize-none ${lang === 'ps' ? 'text-right' : 'text-left'}`}
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
          />
        </div>

        <AnimatePresence>
          {suggestions.length > 0 && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-brand-soft border border-brand-soft rounded-2xl p-4 overflow-hidden"
            >
              <div className={`flex items-center gap-2 mb-3 text-brand ${lang === 'ps' ? 'flex-row-reverse' : ''}`}>
                <Sparkles className="w-4 h-4" />
                <span className="text-sm font-semibold">{lang === 'ps' ? 'د AI مشورې' : 'AI Suggestions'}</span>
              </div>
              <ul className="space-y-2">
                {suggestions.map((s, i) => (
                  <li key={i} className={`text-xs text-gray-400 flex items-start gap-2 ${lang === 'ps' ? 'flex-row-reverse text-right' : ''}`}>
                    <span className="w-1.5 h-1.5 rounded-full bg-brand mt-1 shrink-0"></span>
                    {s}
                  </li>
                ))}
              </ul>
            </motion.div>
          )}
        </AnimatePresence>

        {error && (
          <div className={`bg-red-500/10 border border-red-500/20 rounded-2xl p-4 flex items-center gap-3 text-red-500 text-sm ${lang === 'ps' ? 'flex-row-reverse' : ''}`}>
            <AlertCircle className="w-5 h-5" />
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 mt-8">
          <button 
            disabled={isGenerating || isTrialOver}
            onClick={handleGenerate}
            className={`btn-primary w-full disabled:opacity-50 h-16 text-lg ${isTrialOver ? 'bg-gray-800 border-gray-700 text-gray-500' : ''}`}
          >
            {isGenerating ? (
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full"
              />
            ) : (
              isTrialOver ? <Lock className="w-5 h-5" /> : <Sparkles className="w-5 h-5" />
            )}
            <span>{isTrialOver ? t.locked : (lang === 'ps' ? 'رپوټ جوړ کړئ' : 'Generate Report')}</span>
          </button>
          
          {isTrialOver && (
            <p className="text-center text-brand text-sm mt-2 flex items-center justify-center gap-2">
              <Sparkles className="w-4 h-4" /> {t.freeTrialEnded}
            </p>
          )}
        </div>
      </div>

      <AnimatePresence>
        {(isCountrySheetOpen || isTypeSheetOpen) && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setIsCountrySheetOpen(false);
                setIsTypeSheetOpen(false);
              }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
            />
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-[70] max-w-md mx-auto"
            >
              <div className={`glass-card rounded-t-[40px] bg-[#0c0c0c] border-white/10 p-8 pb-12 max-h-[80vh] overflow-hidden flex flex-col ${lang === 'ps' ? 'text-right' : 'text-left'}`} dir={lang === 'ps' ? 'rtl' : 'ltr'}>
                <div className="w-12 h-1.5 bg-white/10 rounded-full mx-auto mb-8 shrink-0" />
                
                {isCountrySheetOpen ? (
                  <>
                    <div className={`flex items-center justify-between mb-8 shrink-0 ${lang === 'ps' ? 'flex-row-reverse' : ''}`}>
                      <h4 className="text-xl font-bold font-display text-white">{t.country}</h4>
                      <button 
                        onClick={() => setIsCountrySheetOpen(false)}
                        className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center active:scale-90"
                      >
                        <X className="w-5 h-5 text-gray-500" />
                      </button>
                    </div>

                    <div className="space-y-2 overflow-y-auto pr-2 no-scrollbar">
                      {countries.map((c) => (
                        <button
                          key={c.name}
                          onClick={() => {
                            setFormData({...formData, country: c.name});
                            setIsCountrySheetOpen(false);
                          }}
                          className={`w-full p-4 rounded-2xl border transition-all flex items-center gap-4 ${formData.country === c.name ? 'bg-blue-500/10 border-blue-500/50' : 'bg-white/5 border-white/5 hover:border-gray-700'} ${lang === 'ps' ? 'flex-row-reverse' : ''}`}
                        >
                          <span className="text-2xl">{c.flag}</span>
                          <span className={`grow font-semibold text-white ${lang === 'ps' ? 'text-right' : 'text-left'}`}>{c.name}</span>
                          <span className="text-gray-500 font-mono" dir="ltr">{c.code}</span>
                          {formData.country === c.name && (
                            <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
                              <Check className="w-3 h-3 text-white" />
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </>
                ) : (
                  <>
                    <div className={`flex items-center justify-between mb-8 shrink-0 ${lang === 'ps' ? 'flex-row-reverse' : ''}`}>
                      <h4 className="text-xl font-bold font-display text-white">{t.selectReport}</h4>
                      <button 
                        onClick={() => setIsTypeSheetOpen(false)}
                        className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center active:scale-90"
                      >
                        <X className="w-5 h-5 text-gray-500" />
                      </button>
                    </div>

                    <div className="space-y-3 overflow-y-auto pr-2 no-scrollbar">
                      {reportTypes.map((type) => {
                        const isLocked = !isPremium;
                        return (
                          <div key={type.id} className="space-y-3">
                            <button
                              disabled={isLocked}
                              onClick={() => {
                                setFormData({...formData, reportType: type.id});
                                if (type.id !== 'Custom') {
                                  setIsTypeSheetOpen(false);
                                }
                              }}
                              className={`w-full p-5 rounded-3xl border transition-all flex items-center gap-5 relative overflow-hidden group ${isLocked ? 'opacity-50 grayscale' : ''} ${formData.reportType === type.id ? 'bg-brand-soft border-brand-soft shadow-lg' : 'bg-white/5 border-white/5 hover:border-gray-700'} ${lang === 'ps' ? 'flex-row-reverse' : ''}`}
                              style={formData.reportType === type.id && !isLocked ? { boxShadow: '0 0 20px var(--primary-color-glow-strong)' } : {}}
                            >
                              <div className={`w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform ${type.color} shadow-inner`}>
                                {isLocked ? <Lock className="w-6 h-6 text-gray-500" /> : <Sparkles className="w-6 h-6" />}
                              </div>
                              
                              <div className={`grow flex flex-col ${lang === 'ps' ? 'text-right' : 'text-left'}`}>
                                <span className="text-lg font-bold text-white mb-0.5">
                                  {type.label}
                                  {isLocked && <span className="ml-2 text-[10px] bg-red-500/20 text-red-500 px-2 py-0.5 rounded-full uppercase">{t.locked}</span>}
                                </span>
                                <span className="text-xs text-gray-500 font-medium uppercase tracking-widest">
                                  {type.id}
                                </span>
                              </div>

                              {formData.reportType === type.id && !isLocked && (
                                <motion.div 
                                  layoutId="active-check-create"
                                  className="w-6 h-6 rounded-full bg-brand flex items-center justify-center shadow-lg"
                                  style={{ boxShadow: '0 4px 10px var(--primary-color-glow-strong)' }}
                                >
                                  <Check className="w-4 h-4 text-white" />
                                </motion.div>
                              )}
                            </button>

                            {type.id === 'Custom' && formData.reportType === 'Custom' && !isLocked && (
                            <motion.div 
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              className="px-2 pb-2"
                            >
                              <input 
                                autoFocus
                                type="text"
                                placeholder={lang === 'ps' ? 'خپل د رپوټ ډول ولیکئ...' : 'Enter custom report type...'}
                                className="glass-input w-full bg-white/10"
                                value={customType}
                                onChange={(e) => setCustomType(e.target.value)}
                              />
                            </motion.div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  </motion.div>
);
}
