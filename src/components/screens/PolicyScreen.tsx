import { motion } from 'motion/react';
import { ChevronLeft, Shield } from 'lucide-react';
import { Language, translations } from '../../lib/locales';

export default function PolicyScreen({ lang, onBack }: { lang: Language; onBack: () => void }) {
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
        <h3 className="text-2xl font-bold font-display">{t.policy}</h3>
      </header>

      <div className="space-y-8">
        <div className="glass-card p-6">
          <div className="w-12 h-12 rounded-2xl bg-brand-soft flex items-center justify-center mb-4">
            <Shield className="w-6 h-6 text-brand" />
          </div>
          <h4 className="text-xl font-bold mb-4">{lang === 'ps' ? 'د حریم خصوصي پالیسي' : 'Privacy Policy'}</h4>
          <div className="space-y-4 text-gray-400 text-sm leading-relaxed">
            <p>
              {lang === 'ps' 
                ? 'موږ ستاسو د معلوماتو خونديتوب ته ژمن یو. ټول هغه معلومات چې تاسو یې په کاريال کې ثبتوئ، یوازې ستاسو لپاره دي او بل چا ته نه ورکول کیږي.'
                : 'We are committed to your data security. All information you record in the application is for you alone and is not shared with anyone else.'}
            </p>
            <p>
              {lang === 'ps'
                ? 'ستاسو رپوټونه ستاسو په وسیله اداره کیږي او موږ ستاسو له اجازې پرته هیڅ معلومات نه خپروو.'
                : 'Your reports are managed by you, and we do not publish any information without your permission.'}
            </p>
            <p>
              {lang === 'ps'
                ? 'د هوش مصنوعي کارول ستاسو د رپوټونو د ښه والي لپاره دي.'
                : 'The use of AI is to improve your reports.'}
            </p>
          </div>
        </div>

        <div className="text-center py-10 opacity-30">
          <p className="text-xs font-mono">SUPPORT HUB v1.0.0</p>
          <p className="text-xs font-mono mt-1">Created by Obaidullah Ghaffari</p>
        </div>
      </div>
    </motion.div>
  );
}
