import { useState } from 'react';
import { motion } from 'motion/react';
import { ChevronLeft, Upload, FileJson, FileSpreadsheet, FileText, Cloud, CheckCircle2, Lock, Sparkles } from 'lucide-react';
import { Language, translations } from '../../lib/locales';

export default function UploadReportsScreen({ 
  lang,
  isAdmin,
  onBack 
}: { 
  lang: Language,
  isAdmin: boolean,
  onBack: () => void 
}) {
  const t = translations[lang];
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState<any[]>([]);

  const uploadTypes = [
    { label: lang === 'ps' ? 'JSON ډاټا' : 'JSON Data', icon: FileJson, color: 'text-orange-500' },
    { label: lang === 'ps' ? 'CSV جدول' : 'CSV Table', icon: FileSpreadsheet, color: 'text-blue-500' },
    { label: lang === 'ps' ? 'TXT فایل' : 'TXT File', icon: FileText, color: 'text-brand' },
    { label: lang === 'ps' ? 'کلاوډ امپورټ' : 'Cloud Import', icon: Cloud, color: 'text-purple-500' },
  ];

  if (!isAdmin) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex-1 flex flex-col items-center justify-center p-8 text-center"
      >
        <div className="w-24 h-24 rounded-3xl bg-brand-soft flex items-center justify-center mb-8 shadow-lg"
             style={{ boxShadow: '0 0 30px var(--primary-color-glow)' }}
        >
          <Lock className="w-10 h-10 text-brand" />
        </div>
        <h3 className="text-2xl font-bold font-display mb-4">{lang === 'ps' ? 'یوازې اډمین' : 'Admin Only'}</h3>
        <p className="text-gray-400 mb-8 max-w-xs">
          {lang === 'ps' ? 'د رپوټونو اپلوډ او کلاوډ ګټه اخیستنه یوازې د اډمین لپاره ده.' : 'Bulk uploading and cloud importing are restricted to administrators only.'}
        </p>
        <button onClick={onBack} className="btn-primary w-full max-w-xs">
          <ChevronLeft className={`w-5 h-5 ${lang === 'ps' ? 'rotate-180' : ''}`} />
          <span>{lang === 'ps' ? 'شاته لاړ شئ' : 'Go Back'}</span>
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`flex-1 overflow-y-auto px-6 pt-16 pb-32 ${lang === 'ps' ? 'text-right' : 'text-left'}`}
      dir={lang === 'ps' ? 'rtl' : 'ltr'}
    >
      <header className={`flex items-center gap-4 mb-8 ${lang === 'ps' ? 'flex-row-reverse' : ''}`}>
        <button onClick={onBack} className="p-2 -ml-2 rounded-xl active:bg-white/5">
          <ChevronLeft className={`w-6 h-6 ${lang === 'ps' ? 'rotate-180' : ''}`} />
        </button>
        <h3 className="text-2xl font-bold font-display">{t.uploadReports}</h3>
      </header>

      <div className="space-y-8">
        <div className={`glass-card p-12 border-2 border-dashed flex flex-col items-center justify-center gap-6 transition-all ${isDragging ? 'border-brand bg-brand-soft' : 'border-white/10'}`}
        >
          <div className="w-20 h-20 rounded-full bg-brand-soft flex items-center justify-center glow-green">
            <Upload className="w-8 h-8 text-brand" />
          </div>
          <div className="text-center">
            <p className="font-bold text-lg mb-1">{lang === 'ps' ? 'فایلونه دلته راکاږئ' : 'Drag & Drop Files'}</p>
            <p className="text-gray-500 text-sm">{lang === 'ps' ? 'JSON, CSV او TXT ملاتړ' : 'Support for JSON, CSV, and TXT'}</p>
          </div>
          <button className="btn-primary">{lang === 'ps' ? 'فایلونه وټاکئ' : 'Browse Files'}</button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {uploadTypes.map((type, i) => (
            <button key={i} className="glass-card p-4 flex flex-col items-center gap-3 active:scale-95 transition-transform">
              <type.icon className={`w-8 h-8 ${type.color}`} />
              <span className="text-sm font-semibold">{type.label}</span>
            </button>
          ))}
        </div>

        <div className="space-y-4">
          <h4 className="font-bold font-display">{lang === 'ps' ? 'وروستي اپلوډونه' : 'Recent Uploads'}</h4>
          {[1, 2].map((_, i) => (
            <div key={i} className={`glass-card p-4 flex items-center justify-between ${lang === 'ps' ? 'flex-row-reverse text-right' : 'text-left'}`}>
              <div className={`flex items-center gap-4 ${lang === 'ps' ? 'flex-row-reverse' : ''}`}>
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                  <FileJson className="w-5 h-5 text-gray-400" />
                </div>
                <div className={lang === 'ps' ? 'text-right' : 'text-left'}>
                  <h6 className="font-semibold text-sm">bulk_targets_v{i}.json</h6>
                  <p className="text-gray-500 text-xs">1.2 MB • {lang === 'ps' ? 'پروسیس کې دی...' : 'Processing...'}</p>
                </div>
              </div>
              <div className="w-6 h-6 rounded-full border-2 border-white/10 border-t-brand animate-spin" />
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
