import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronLeft, Filter, Search, ShieldCheck, 
  ShieldAlert, Clock, ChevronRight, ListChecks,
  Send, AlertCircle, FileText, Trash2, ArrowRight,
  Phone
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { Language, translations } from '../../lib/locales';
import ConfirmModal from '../ui/ConfirmModal';

interface HistoryScreenProps {
  user: any;
  lang: Language;
  onBack: () => void;
  onSelectReport: (report: any) => void;
}

export default function HistoryScreen({ user, lang, onBack, onSelectReport }: HistoryScreenProps) {
  const t = translations[lang];
  const [reports, setReports] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'draft' | 'sent' | 'failed'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    const loadReports = () => {
      setIsLoading(true);
      try {
        const localData = localStorage.getItem('local_reports');
        if (localData) {
          const parsed = JSON.parse(localData);
          setReports(parsed);
        }
      } catch (err) {
        console.error("Failed to load reports", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadReports();

    // Listen for storage changes if other screens update it
    window.addEventListener('storage', loadReports);
    return () => window.removeEventListener('storage', loadReports);
  }, []);

  const deleteReport = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteId(id);
  };

  const confirmDelete = () => {
    if (!deleteId) return;
    const updatedReports = reports.filter(r => r.id !== deleteId);
    localStorage.setItem('local_reports', JSON.stringify(updatedReports));
    setReports(updatedReports);
    setDeleteId(null);
  };

  const filteredReports = activeTab === 'all' 
    ? reports 
    : reports.filter(r => r.status === activeTab);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent': return 'text-brand';
      case 'failed': return 'text-red-500';
      case 'draft': return 'text-blue-500';
      default: return 'text-gray-500';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'sent': return t.sent;
      case 'failed': return t.failed;
      case 'draft': return t.drafts;
      default: return status;
    }
  };

  const formatDate = (dateString: any) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString(lang === 'ps' ? 'ps-AF' : 'en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (dateString: any) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleTimeString(lang === 'ps' ? 'ps-AF' : 'en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className={`flex-1 min-h-0 overflow-y-auto px-6 pt-16 pb-32 ${lang === 'ps' ? 'text-right' : 'text-left'}`}
      dir={lang === 'ps' ? 'rtl' : 'ltr'}
    >
      <header className={`flex items-center justify-between mb-8 ${lang === 'ps' ? 'flex-row-reverse' : ''}`}>
        <div className={`flex items-center gap-4 ${lang === 'ps' ? 'flex-row-reverse' : ''}`}>
          <button onClick={onBack} className="p-2 -ml-2 rounded-xl active:bg-white/5">
            <ChevronLeft className={`w-6 h-6 ${lang === 'ps' ? 'rotate-180' : ''}`} />
          </button>
          <h3 className="text-2xl font-bold font-display">{t.history}</h3>
        </div>
      </header>

      {/* Tabs */}
      <div className="flex gap-2 mb-8 overflow-x-auto no-scrollbar pb-2">
        {(['all', 'draft', 'sent', 'failed'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all shrink-0 ${
              activeTab === tab 
                ? 'bg-brand text-white shadow-lg' 
                : 'bg-white/5 text-gray-500 border border-white/5'
            }`}
            style={activeTab === tab ? { boxShadow: '0 10px 15px -3px var(--primary-color-glow-strong)' } : {}}
          >
            {tab === 'all' ? t.all : getStatusLabel(tab)}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-10 h-10 border-4 border-brand-soft border-t-brand rounded-full animate-spin" />
          <p className="text-gray-500 text-sm">{lang === 'ps' ? 'د معلوماتو راوړل...' : 'Loading history...'}</p>
        </div>
      ) : filteredReports.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center px-10">
          <div className="w-20 h-20 rounded-3xl bg-white/5 flex items-center justify-center mb-6">
            <ListChecks className="w-10 h-10 text-gray-700" />
          </div>
          <h4 className="text-xl font-bold text-gray-400 mb-2">{t.noReports}</h4>
          <p className="text-sm text-gray-600 leading-relaxed">
            {lang === 'ps' 
              ? 'تاسو تراوسه هیڅ رپوټ نه دی ثبت کړی.' 
              : 'You haven\'t created any reports yet.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredReports.map((report, i) => (
            <motion.div 
              key={report.id} 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => onSelectReport(report)}
              className="group active:scale-[0.98] transition-transform relative"
            >
              <div className="glass-card p-5 cursor-pointer relative overflow-hidden">
                {/* Status indicator line */}
                <div className={`absolute top-0 bottom-0 w-1 ${lang === 'ps' ? 'right-0' : 'left-0'} ${
                  report.status === 'sent' ? 'bg-brand' : report.status === 'failed' ? 'bg-red-500' : 'bg-blue-500'
                }`} />

                <div className={`flex items-start justify-between mb-4 ${lang === 'ps' ? 'flex-row-reverse' : ''}`}>
                  <div className={`flex flex-col ${lang === 'ps' ? 'text-right' : 'text-left'}`}>
                    <h5 className="font-bold text-white mb-1">
                      {report.reportType}
                    </h5>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {formatTime(report.createdAt)}</span>
                      <span className="w-1 h-1 rounded-full bg-gray-700"></span>
                      <span>{formatDate(report.createdAt)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={(e) => deleteReport(report.id, e)}
                      className="p-2 rounded-xl bg-white/5 text-gray-500 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <span className={`text-[10px] uppercase font-black tracking-widest px-2 py-1 rounded bg-white/5 border border-white/5 ${getStatusColor(report.status)}`}>
                      {getStatusLabel(report.status)}
                    </span>
                  </div>
                </div>

                <div className={`pt-4 border-t border-white/5 flex items-center justify-between ${lang === 'ps' ? 'flex-row-reverse' : ''}`}>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                      <Phone className="w-4 h-4 text-brand" />
                    </div>
                    <span className="text-sm font-mono text-gray-400" dir="ltr">{report.phoneNumber}</span>
                  </div>
                  <div className="flex items-center gap-1 text-brand text-xs font-bold uppercase">
                    <span>{t.viewDetails}</span>
                    <ArrowRight className={`w-3 h-3 ${lang === 'ps' ? 'rotate-180' : ''}`} />
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <ConfirmModal 
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={confirmDelete}
        title={lang === 'ps' ? 'رپوټ پاک کړئ؟' : 'Delete Report?'}
        message={lang === 'ps' ? 'ایا تاسو ډاډه یاست چې غواړئ دا رپوټ له تاریخه پاک کړئ؟ دا عمل نشي لغوه کیدی.' : 'Are you sure you want to delete this report from history? This action cannot be undone.'}
        lang={lang}
      />
    </motion.div>
  );
}
