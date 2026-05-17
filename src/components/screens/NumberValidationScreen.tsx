import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronLeft, Phone, AlertCircle, CheckCircle2, 
  Globe, Sparkles, Send, Mail, ListFilter, Copy,
  User, Check, X, RotateCcw, Lock
} from 'lucide-react';
import { Language, translations } from '../../lib/locales';
import { generateReportContent } from '../../lib/gemini';
import { collection, addDoc, serverTimestamp, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../../lib/firebase';
import { useToast } from '../ui/Toast';

export default function NumberValidationScreen({ 
  lang, 
  isPremium,
  reportCount,
  initialReport,
  onBack 
}: { 
  lang: Language, 
  isPremium: boolean,
  reportCount: number,
  initialReport?: any,
  onBack: () => void 
}) {
  const t = translations[lang];
  const { showToast } = useToast();
  const [countryCode, setCountryCode] = useState('+93');
  const [number, setNumber] = useState('');
  const [reportType, setReportType] = useState('Spam');
  const [customReportType, setCustomReportType] = useState('');
  const [reporterName, setReporterName] = useState('');
  const [isReportSheetOpen, setIsReportSheetOpen] = useState(false);
  const [isCountrySheetOpen, setIsCountrySheetOpen] = useState(false);
  const [error, setError] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState('');
  const [currentReportId, setCurrentReportId] = useState<string | null>(null);
  const [reportStatus, setReportStatus] = useState<'pending' | 'sent' | 'failed' | 'draft'>('draft');
  const [showExitDialog, setShowExitDialog] = useState(false);

  useEffect(() => {
    if (initialReport) {
      setReporterName(initialReport.reporterName || '');
      setReportType(initialReport.reportType || 'Spam');
      setGeneratedContent(initialReport.generatedContent || '');
      setCurrentReportId(initialReport.id || null);
      setReportStatus(initialReport.status || 'draft');
      
      // Parse phone number to separate country code and number
      const phone = initialReport.phoneNumber || '';
      const matchedCountry = countries.find(c => phone.startsWith(c.code));
      if (matchedCountry) {
        setCountryCode(matchedCountry.code);
        setNumber(phone.replace(matchedCountry.code, ''));
      } else {
        setNumber(phone);
      }
    }
  }, [initialReport]);

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
    { code: '+1', name: 'Canada', flag: '🇨🇦' },
    { code: '+61', name: 'Australia', flag: '🇦🇺' },
    { code: '+86', name: 'China', flag: '🇨🇳' },
  ];

  const reportTypes = [
    { id: 'Custom', label: lang === 'ps' ? 'کسټم ډول' : 'Custom Type', color: 'text-purple-400' },
    { id: 'Spam', label: lang === 'ps' ? 'بې ځایه پیامونه' : 'Spam Messages', color: 'text-orange-500' },
    { id: 'Unblock', label: lang === 'ps' ? 'شمېره خلاصول' : 'Unblock Account', color: 'text-brand' },
    { id: 'Harassment', label: lang === 'ps' ? 'توهین او سپکاوی' : 'Harassment', color: 'text-red-500' },
    { id: 'Hate Speech', label: lang === 'ps' ? 'نفرت خپرول' : 'Hate Speech', color: 'text-red-600' },
    { id: 'Scam', label: lang === 'ps' ? 'دهوکه بازي' : 'Scam/Fraud', color: 'text-yellow-600' },
    { id: 'Identity Theft', label: lang === 'ps' ? 'د هویت غلا' : 'Identity Theft', color: 'text-blue-500' },
    { id: 'Fake Account', label: lang === 'ps' ? 'جعلي اکاونټ' : 'Fake Account', color: 'text-gray-400' },
    { id: 'Impersonation', label: lang === 'ps' ? 'بل څوک ځان ښودل' : 'Impersonation', color: 'text-purple-500' },
    { id: 'Violent Threats', label: lang === 'ps' ? 'د وژنې ګواښونه' : 'Violent Threats', color: 'text-red-700' },
    { id: 'Child Safety', label: lang === 'ps' ? 'د ماشومانو خوندیتوب' : 'Child Safety', color: 'text-indigo-500' },
    { id: 'Self Harm', label: lang === 'ps' ? 'ځان ته زیان رسول' : 'Self Harm Info', color: 'text-pink-500' },
    { id: 'Illegal Sales', label: lang === 'ps' ? 'غیرقانوني خرڅلاو' : 'Illegal Sales', color: 'text-amber-700' },
    { id: 'Intellectual Property', label: lang === 'ps' ? 'د کاپي رایټ ستونزه' : 'IP Violation', color: 'text-cyan-600' },
    { id: 'Misinformation', label: lang === 'ps' ? 'غلط معلومات' : 'Misinformation', color: 'text-orange-700' },
    { id: 'Privacy Violation', label: lang === 'ps' ? 'د خصوصي حریم ماتول' : 'Privacy Violation', color: 'text-brand' },
    { id: 'Account Hijacking', label: lang === 'ps' ? 'اکاونټ هک کول' : 'Account Hijacked', color: 'text-rose-600' },
    { id: 'Bot Messaging', label: lang === 'ps' ? 'اتوماتیک پیامونه' : 'Bot/Automated', color: 'text-teal-500' },
    { id: 'Sexual Content', label: lang === 'ps' ? 'نامناسب محتوا' : 'Inappropriate Content', color: 'text-purple-600' },
    { id: 'Feature Request', label: lang === 'ps' ? 'د نوي فارمټ غوښتنه' : 'Feature Request', color: 'text-brand' },
    { id: 'Positive Feedback', label: lang === 'ps' ? 'ښه نظر ورکول' : 'Positive Feedback', color: 'text-green-500' },
    { id: 'Verification Request', label: lang === 'ps' ? 'د تاییدۍ غوښتنه' : 'Verification Help', color: 'text-blue-400' },
  ];

  const handleGenerateAndSend = async () => {
    setError('');
    setGeneratedContent('');
    
    if (!number) {
      setError(lang === 'ps' ? "مهرباني وکړئ شمېره ولیکئ" : "Please enter a phone number");
      return;
    }

    if (number.length < 8) {
      setError(t.invalidNumber);
      return;
    }

    if (!reporterName) {
      setError(lang === 'ps' ? "مهرباني وکړئ خپل نوم ولیکئ" : "Please enter your name");
      return;
    }

    setIsGenerating(true);
    try {
      const fullNumber = `${countryCode}${number}`;
      const typeLabel = reportType === 'Custom' ? customReportType : (reportTypes.find(r => r.id === reportType)?.label || reportType);
      const isUnblock = reportType === 'Unblock';
      
      const content = await generateReportContent({
        reportType: typeLabel,
        description: isUnblock 
          ? (lang === 'ps' 
              ? `زما شمېره (${fullNumber}) په غلطۍ سره بنده شوې ده. ما هیڅ غیرقانوني کار نه دی کړی. هیله ده زما اکاونټ بیرته خلاص کړئ.` 
              : `My WhatsApp number (${fullNumber}) has been banned. I believe this is a mistake as I have not violated any terms of service. Please review and unblock my account.`)
          : (lang === 'ps' 
              ? `ما غواړم دا شمېره (${fullNumber}) واټساپ سپورټ ټیم ته رپوټ کړم. دا شمېره غیرقانوني فعالیتونه کوي، سپام لیږي او نور خلک تنګوي. هیله ده دا شمېره بنده کړئ.` 
              : `I am reporting this WhatsApp number: ${fullNumber}. The user is engaging in prohibited activities including spam, harassment, and sending unsolicited automated messages. Please take immediate action and ban this account.`),
        phoneNumber: fullNumber,
        reporterName: reporterName,
      });

      setGeneratedContent(content);
      setReportStatus('draft');

      // Save as draft in Firestore
      if (auth.currentUser) {
        try {
          const docRef = await addDoc(collection(db, 'reports'), {
            userId: auth.currentUser.uid,
            reporterName,
            country: countries.find(c => c.code === countryCode)?.name || '',
            phoneNumber: fullNumber,
            reportType: typeLabel,
            status: 'draft',
            generatedContent: content,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
          setCurrentReportId(docRef.id);
        } catch (err) {
          console.error("Failed to save draft:", err);
        }
      }
    } catch (e) {
      setError(lang === 'ps' ? "د رپوټ جوړولو کې ستونزه راغله." : "Failed to generate report.");
    } finally {
      setIsGenerating(false);
    }
  };

  const updateReportStatus = async (status: 'sent' | 'failed') => {
    if (currentReportId && auth.currentUser) {
      try {
        await updateDoc(doc(db, 'reports', currentReportId), {
          status: status,
          updatedAt: serverTimestamp()
        });
        setReportStatus(status);
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `reports/${currentReportId}`);
      }
    }
  };

  const handleBack = async () => {
    if (generatedContent && reportStatus === 'draft') {
      setShowExitDialog(true);
      return;
    }
    
    setCurrentReportId(null);
    setGeneratedContent('');
    onBack();
  };

  const discardAndExit = async () => {
    if (currentReportId && auth.currentUser) {
      try {
        await deleteDoc(doc(db, 'reports', currentReportId));
      } catch (err) {
        console.error("Failed to delete report:", err);
      }
    }
    setCurrentReportId(null);
    setGeneratedContent('');
    setShowExitDialog(false);
    onBack();
  };

  const saveAndExit = () => {
    setCurrentReportId(null);
    setGeneratedContent('');
    setShowExitDialog(false);
    onBack();
  };

  const openEmailIntent = () => {
    const fullNumber = `${countryCode}${number}`;
    const subject = encodeURIComponent(`${reportType} Report - ${fullNumber}`);
    const body = encodeURIComponent(generatedContent);
    window.location.href = `mailto:support@whatsapp.com?subject=${subject}&body=${body}`;
    
    // We assume sent for now as we don't have feedback from the email app
    updateReportStatus('sent');
    showToast(t.reportSentNotification, 'info');
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className={`flex-1 overflow-y-auto px-6 pt-16 pb-32 ${lang === 'ps' ? 'text-right' : 'text-left'}`}
      dir={lang === 'ps' ? 'rtl' : 'ltr'}
    >
      <header className={`flex items-center gap-4 mb-10 ${lang === 'ps' ? 'flex-row-reverse' : ''}`}>
        <button onClick={handleBack} className="p-2 -ml-2 rounded-xl active:bg-white/5">
          <ChevronLeft className={`w-6 h-6 ${lang === 'ps' ? 'rotate-180' : ''}`} />
        </button>
        <h3 className="text-2xl font-bold font-display">{t.openNumber}</h3>
      </header>

      <div className="space-y-6">
          <div className="glass-card p-6 flex items-center gap-6 group border-brand-soft bg-brand-soft shadow-lg"
               style={{ boxShadow: '0 0 20px var(--primary-color-glow-strong)' }}
          >
            <div className="w-16 h-16 rounded-2xl bg-brand-soft flex items-center justify-center">
              <Phone className="w-8 h-8 text-brand" />
            </div>
            <div className="grow text-right">
              <h4 className="text-lg font-bold text-brand">{t.whatsappSupport}</h4>
              <p className="text-gray-400 text-xs">{lang === 'ps' ? 'رپوټ واستوئ' : 'Send report now'}</p>
            </div>
          </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-400 flex items-center gap-2">
              <User className="w-4 h-4" /> {translations[lang].reporterName}
            </label>
            <input 
              type="text" 
              placeholder={lang === 'ps' ? "خپل نوم دلته ولیکئ" : "Enter your name"} 
              className={`glass-input w-full text-white ${lang === 'ps' ? 'text-right' : 'text-left'}`}
              value={reporterName}
              onChange={(e) => setReporterName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-400 flex items-center gap-2">
              <Globe className="w-4 h-4" /> {t.country}
            </label>
            <button 
              onClick={() => setIsCountrySheetOpen(true)}
              className="glass-input w-full flex items-center justify-between text-gray-300"
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">{countries.find(c => c.code === countryCode)?.flag}</span>
                <span>{countries.find(c => c.code === countryCode)?.name}</span>
              </div>
              <ChevronLeft className={`w-5 h-5 text-gray-500 ${lang === 'ps' ? 'rotate-180' : ''}`} />
            </button>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-400 flex items-center gap-2">
              <Phone className="w-4 h-4" /> {t.phoneNumber}
            </label>
            <div className={`flex gap-2 ${lang === 'ps' ? 'flex-row-reverse' : ''}`}>
              <div className="glass-input flex items-center justify-center px-4 bg-white/5 font-mono text-brand" dir="ltr">
                {countryCode}
              </div>
              <input 
                type="tel" 
                placeholder="300 0000000" 
                className={`glass-input grow ${lang === 'ps' ? 'text-right' : 'text-left'}`}
                value={number}
                onChange={(e) => setNumber(e.target.value.replace(/[^0-9]/g, ''))}
                dir="ltr"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-400 flex items-center gap-2">
              <ListFilter className="w-4 h-4" /> {t.reportType}
            </label>
            <button 
              onClick={() => setIsReportSheetOpen(true)}
              className="glass-input w-full flex items-center justify-between text-white"
            >
              <span>
                {reportType === 'Custom' && customReportType 
                  ? customReportType 
                  : reportTypes.find(r => r.id === reportType)?.label}
              </span>
              <ChevronLeft className={`w-5 h-5 text-gray-500 ${lang === 'ps' ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 flex items-center gap-3 text-red-500 text-sm">
              <AlertCircle className="w-5 h-5" />
              {error}
            </div>
          )}

          <AnimatePresence>
            {generatedContent && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card p-6 border-brand-soft bg-brand-soft mt-4"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`flex items-center gap-2 ${reportStatus === 'sent' ? 'text-brand' : reportStatus === 'failed' ? 'text-red-500' : 'text-blue-500'}`}>
                    <Sparkles className="w-4 h-4 outline-none" />
                    <span className="text-sm font-bold uppercase tracking-widest">
                      {reportStatus === 'sent' ? t.sent : reportStatus === 'failed' ? t.failed : (lang === 'ps' ? 'رپوټ برابر شو' : 'Report Prepared')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {reportStatus === 'draft' && (
                      <button 
                        onClick={() => updateReportStatus('failed')}
                        className="p-2 bg-white/5 rounded-xl text-gray-500 hover:text-red-500 transition-colors"
                        title={t.failed}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                    <button 
                      onClick={() => navigator.clipboard.writeText(generatedContent)}
                      className="p-2 bg-white/5 rounded-xl text-gray-400 hover:text-white"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="text-sm text-gray-300 leading-relaxed max-h-40 overflow-y-auto whitespace-pre-wrap font-sans transition-all">
                  {generatedContent}
                </div>
                <div className="flex gap-3 mt-6">
                  {reportStatus === 'sent' ? (
                    <button 
                      onClick={openEmailIntent}
                      className="btn-primary grow bg-white/10 hover:bg-white/20 border-white/10"
                    >
                      <RotateCcw className="w-5 h-5" />
                      <span>{t.reSend}</span>
                    </button>
                  ) : (
                    <button 
                      onClick={openEmailIntent}
                      className="btn-primary grow bg-emerald-600 shadow-emerald-500/30"
                    >
                      <Mail className="w-5 h-5" />
                      <span>{lang === 'ps' ? 'د جيميل پواسطه يي واستوئ' : 'Send via Gmail'}</span>
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {!generatedContent && (
            <button 
              disabled={isGenerating || (!isPremium && reportCount >= 3)}
              onClick={handleGenerateAndSend}
              className={`btn-primary w-full disabled:opacity-50 ${(!isPremium && reportCount >= 3) ? 'bg-gray-800 border-gray-700 text-gray-500' : ''}`}
            >
              {isGenerating ? (
                <motion.div 
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full"
                />
              ) : (
                (!isPremium && reportCount >= 3) ? <Lock className="w-5 h-5" /> : <Sparkles className="w-5 h-5" />
              )}
              <span>{(!isPremium && reportCount >= 3) ? t.locked : (lang === 'ps' ? 'رپوټ جوړ او واستوئ' : 'Generate & Send')}</span>
            </button>
          )}
          
          {!isPremium && reportCount >= 3 && !generatedContent && (
            <p className="text-center text-brand text-sm mt-4 flex items-center justify-center gap-2">
              <Sparkles className="w-4 h-4" /> {t.freeTrialEnded}
            </p>
          )}
        </div>
      </div>

      {/* Modern Bottom Sheets */}
      <AnimatePresence>
        {(isReportSheetOpen || isCountrySheetOpen) && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setIsReportSheetOpen(false);
                setIsCountrySheetOpen(false);
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
              <div className="glass-card rounded-t-[40px] bg-[#0c0c0c] border-white/10 p-8 pb-12 max-h-[80vh] overflow-hidden flex flex-col">
                <div className="w-12 h-1.5 bg-white/10 rounded-full mx-auto mb-8 shrink-0" />
                
                {isReportSheetOpen ? (
                  <>
                    <div className={`flex items-center justify-between mb-8 shrink-0 ${lang === 'ps' ? 'flex-row-reverse' : ''}`}>
                      <h4 className="text-xl font-bold font-display text-white">{t.selectReport}</h4>
                      <button 
                        onClick={() => setIsReportSheetOpen(false)}
                        className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center active:scale-90"
                      >
                        <X className="w-5 h-5 text-gray-500" />
                      </button>
                    </div>

                    <div className="space-y-3 overflow-y-auto pr-2 no-scrollbar">
                      {reportTypes.map((type, index) => {
                        const isLocked = !isPremium && reportCount >= 3;
                        return (
                          <div key={type.id} className="space-y-3">
                            <button
                              disabled={isLocked}
                              onClick={() => {
                                setReportType(type.id);
                                if (type.id !== 'Custom') {
                                  setIsReportSheetOpen(false);
                                  setGeneratedContent('');
                                }
                              }}
                              className={`w-full p-5 rounded-3xl border transition-all flex items-center gap-5 relative overflow-hidden group ${isLocked ? 'opacity-50 grayscale' : ''} ${reportType === type.id ? 'bg-brand-soft border-brand-soft shadow-lg' : 'bg-white/5 border-white/5 hover:border-gray-700'} ${lang === 'ps' ? 'flex-row-reverse' : ''}`}
                              style={reportType === type.id && !isLocked ? { boxShadow: '0 0 20px var(--primary-color-glow-strong)' } : {}}
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

                              {reportType === type.id && !isLocked && (
                                <motion.div 
                                  layoutId="active-check"
                                  className="w-6 h-6 rounded-full bg-brand flex items-center justify-center shadow-lg"
                                  style={{ boxShadow: '0 4px 10px var(--primary-color-glow-strong)' }}
                                >
                                  <Check className="w-4 h-4 text-white" />
                                </motion.div>
                              )}
                            </button>

                            {type.id === 'Custom' && reportType === 'Custom' && (
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
                                  value={customReportType}
                                  onChange={(e) => setCustomReportType(e.target.value)}
                                />
                              </motion.div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </>
                ) : (
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
                            setCountryCode(c.code);
                            setIsCountrySheetOpen(false);
                          }}
                          className={`w-full p-4 rounded-2xl border transition-all flex items-center gap-4 ${countryCode === c.code && countries.find(found => found.code === countryCode)?.name === c.name ? 'bg-blue-500/10 border-blue-500/50' : 'bg-white/5 border-white/5 hover:border-gray-700'} ${lang === 'ps' ? 'flex-row-reverse' : ''}`}
                        >
                          <span className="text-2xl">{c.flag}</span>
                          <span className="grow text-left font-semibold text-white">{c.name}</span>
                          <span className="text-gray-500 font-mono" dir="ltr">{c.code}</span>
                          {countryCode === c.code && countries.find(found => found.code === countryCode)?.name === c.name && (
                            <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
                              <Check className="w-3 h-3 text-white" />
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      
      {/* Exit Confirmation Dialog */}
      <AnimatePresence>
        {showExitDialog && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100]"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="fixed inset-0 flex items-center justify-center z-[101] p-6"
            >
              <div className="glass-card max-w-sm w-full p-8 text-center border-white/10 bg-[#0c0c0c] shadow-2xl">
                <div className="w-20 h-20 rounded-full bg-orange-500/10 flex items-center justify-center mx-auto mb-6">
                  <AlertCircle className="w-10 h-10 text-orange-500" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-4 font-display">{t.exitTitle}</h3>
                <p className="text-gray-400 mb-8 leading-relaxed">
                  {t.exitMessage}
                </p>
                <div className="flex flex-col gap-3">
                  <button 
                    onClick={saveAndExit}
                    className="btn-primary w-full py-4 text-lg"
                  >
                    {t.saveDraft}
                  </button>
                  <button 
                    onClick={discardAndExit}
                    className="w-full py-4 text-lg font-bold text-red-500 active:scale-95 transition-transform"
                  >
                    {t.discardReport}
                  </button>
                  <button 
                    onClick={() => setShowExitDialog(false)}
                    className="w-full py-4 text-lg font-bold text-gray-500 active:scale-95 transition-transform"
                  >
                    {t.cancel}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
