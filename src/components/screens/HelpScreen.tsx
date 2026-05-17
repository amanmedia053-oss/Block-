import { motion } from 'motion/react';
import { ChevronLeft, HelpCircle, MessageSquare, Info } from 'lucide-react';
import { Language, translations } from '../../lib/locales';

export default function HelpScreen({ lang, onBack }: { lang: Language; onBack: () => void }) {
  const t = translations[lang];

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className={`flex-1 overflow-y-auto px-6 pt-16 pb-32 ${lang === 'ps' ? 'text-right' : 'text-left'}`}
      dir={lang === 'ps' ? 'rtl' : 'ltr'}
    >
      <header className={`flex items-center gap-4 mb-10 ${lang === 'ps' ? 'flex-row-reverse' : ''}`}>
        <button onClick={onBack} className="p-2 -ml-2 rounded-xl active:bg-white/5">
          <ChevronLeft className={`w-6 h-6 ${lang === 'ps' ? 'rotate-180' : ''}`} />
        </button>
        <h3 className="text-2xl font-bold font-display">{t.help}</h3>
      </header>

      <div className="space-y-6">
        <div className="glass-card p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <Info className="w-5 h-5 text-blue-500" />
            </div>
            <h4 className="text-lg font-bold">{lang === 'ps' ? 'څنګه رپوټ جوړ کړو؟' : 'How to create a report?'}</h4>
          </div>
          <p className="text-sm text-gray-400 leading-relaxed mb-4">
            {lang === 'ps'
              ? 'تاسو کولی شئ په مینو کې د "رپوټ جوړول" برخه انتخاب کړئ او د هوش مصنوعي په مرسته موضوع ولیکئ.'
              : 'You can select the "Create Report" section in the menu and write the topic with the help of AI.'}
          </p>
        </div>

        <div className="glass-card p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-purple-500" />
            </div>
            <h4 className="text-lg font-bold">{lang === 'ps' ? 'پریمیم غړیتوب' : 'Premium Membership'}</h4>
          </div>
          <p className="text-sm text-gray-400 leading-relaxed mb-4">
            {lang === 'ps'
              ? 'پریمیم غړیتوب تاسو ته اجازه درکوي چې نامحدود رپوټونه جوړ کړئ او پرمختللي امکانات وکاروئ.'
              : 'Premium membership allows you to create unlimited reports and use advanced features.'}
          </p>
        </div>

        <div className="glass-card p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-10 h-10 rounded-xl bg-brand-soft flex items-center justify-center">
              <HelpCircle className="w-5 h-5 text-brand" />
            </div>
            <h4 className="text-lg font-bold">{lang === 'ps' ? 'نورې پوښتنې' : 'Other Questions'}</h4>
          </div>
          <p className="text-sm text-gray-400 leading-relaxed mb-4">
            {lang === 'ps'
              ? 'که تاسو نورو پوښتنو ته ځواب غواړئ، مهرباني وکړئ زموږ د اړيکي له لارو موږ سره اړیکه ونیسئ.'
              : 'If you want answers to other questions, please contact us through our contact methods.'}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
