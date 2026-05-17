import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronLeft, Search, Star, Edit3, Filter, ShieldAlert, 
  UserX, RotateCcw, BadgeCheck, FileText, Lock, CheckCircle2 
} from 'lucide-react';
import { useState, useMemo } from 'react';
import { Language, translations } from '../../lib/locales';
import { templates, templateCategories } from '../../lib/templates';

export default function TemplatesScreen({ 
  user,
  lang,
  isPremium,
  favorites = [],
  onBack,
  onUseTemplate 
}: { 
  user: any,
  lang: Language,
  isPremium: boolean,
  favorites?: string[],
  onBack: () => void,
  onUseTemplate: (content: string) => void
}) {
  const t = translations[lang];
  const [activeCategory, setActiveCategory] = useState(lang === 'ps' ? 'ټول' : 'All');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  const categories = templateCategories[lang];
  
  const filteredTemplates = useMemo(() => {
    return templates.filter(template => {
      const matchesCategory = activeCategory === (lang === 'ps' ? 'ټول' : 'All') || template.category[lang] === activeCategory;
      const matchesSearch = template.name[lang].toLowerCase().includes(searchQuery.toLowerCase()) || 
                           template.desc[lang].toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFavorite = !showFavoritesOnly || favorites.includes(template.id);
      return matchesCategory && matchesSearch && matchesFavorite;
    });
  }, [activeCategory, searchQuery, showFavoritesOnly, favorites, lang]);

  const toggleFavorite = (e: React.MouseEvent, templateId: string) => {
    e.stopPropagation();
    if (!user) return;
    
    const isFavorite = favorites.includes(templateId);
    let newFavorites = [];
    if (isFavorite) {
      newFavorites = favorites.filter(id => id !== templateId);
    } else {
      newFavorites = [...favorites, templateId];
    }
    
    const updatedUser = { ...user, favoriteTemplates: newFavorites };
    localStorage.setItem('reporter_app_user', JSON.stringify(updatedUser));
    // Reload to apply
    window.location.reload();
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className={`flex-1 min-h-0 overflow-y-auto px-6 pt-16 pb-32 ${lang === 'ps' ? 'text-right' : 'text-left'}`}
      dir={lang === 'ps' ? 'rtl' : 'ltr'}
    >
      <header className={`flex items-center justify-between mb-8 ${lang === 'ps' ? 'flex-row-reverse' : ''}`}>
        <div className={`flex items-center gap-4 ${lang === 'ps' ? 'flex-row-reverse' : ''}`}>
          <button onClick={onBack} className="p-2 -ml-2 rounded-xl active:bg-white/5">
            <ChevronLeft className={`w-6 h-6 ${lang === 'ps' ? 'rotate-180' : ''}`} />
          </button>
          <h3 className="text-2xl font-bold font-display">{t.templates}</h3>
        </div>
        
        <button 
          onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
          className={`p-2 rounded-xl transition-all ${showFavoritesOnly ? 'bg-yellow-500/20 text-yellow-500' : 'bg-white/5 text-gray-500'}`}
        >
          <Star className={`w-6 h-6 ${showFavoritesOnly ? 'fill-current' : ''}`} />
        </button>
      </header>

      <div className="relative mb-8">
        <Search className={`absolute top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 ${lang === 'ps' ? 'right-4' : 'left-4'}`} />
        <input 
          type="text" 
          placeholder={lang === 'ps' ? 'پلټنه...' : 'Search reports...'} 
          className={`glass-input w-full ${lang === 'ps' ? 'pr-12' : 'pl-12'}`}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar mb-8">
        {categories.map((cat) => (
          <button 
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-4 py-2 rounded-xl border transition-all whitespace-nowrap text-sm font-semibold ${activeCategory === cat ? 'bg-brand border-brand text-white shadow-lg' : 'bg-white/5 border-white/10 text-gray-400'}`}
            style={activeCategory === cat ? { boxShadow: '0 10px 15px -3px var(--primary-color-glow-strong)' } : {}}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {filteredTemplates.length > 0 ? filteredTemplates.map((template, i) => {
          const isFav = favorites.includes(template.id);
          const isLocked = !isPremium;
          
          return (
            <motion.div 
              key={template.id} 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.05, 0.5) }}
              className={`glass-card p-5 group relative overflow-hidden ${isLocked ? 'opacity-80' : ''}`}
            >
              <div className={`flex items-start justify-between mb-4 ${lang === 'ps' ? 'flex-row-reverse' : ''}`}>
                <div className={`flex items-center gap-4 ${lang === 'ps' ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center transition-all ${isLocked ? '' : 'group-hover:bg-brand-soft group-hover:border-brand-soft'}`}>
                    <template.icon className={`w-6 h-6 ${isLocked ? 'text-gray-600' : 'text-gray-400 group-hover:text-brand'}`} />
                  </div>
                  <div className={lang === 'ps' ? 'text-right' : 'text-left'}>
                    <h5 className="font-bold">{template.name[lang]}</h5>
                    <p className="text-gray-500 text-[10px] uppercase tracking-wider">{template.category[lang]}</p>
                  </div>
                </div>
                
                <button 
                  onClick={(e) => toggleFavorite(e, template.id)}
                  className={`p-2 rounded-lg transition-all ${isFav ? 'text-yellow-500' : 'text-gray-600 hover:text-gray-400'}`}
                >
                  <Star className={`w-5 h-5 ${isFav ? 'fill-current' : ''}`} />
                </button>
              </div>

              <p className={`text-gray-400 text-sm mb-6 leading-relaxed ${lang === 'ps' ? 'text-right' : 'text-left'}`}>
                {template.desc[lang]}
              </p>

              <div className="flex gap-3">
                <button 
                  onClick={() => !isLocked && onUseTemplate(template.content[lang])}
                  className={`btn-primary py-2.5 grow text-sm flex items-center justify-center gap-2 ${isLocked ? 'bg-gray-800 border-gray-700 text-gray-500 cursor-not-allowed' : ''}`}
                >
                  {isLocked ? <Lock className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
                  <span>{isLocked ? t.premiumRequired : (lang === 'ps' ? 'رپوټ وکاروئ' : 'Use Format')}</span>
                </button>
              </div>
              
              {isLocked && (
                <div className="absolute top-0 right-0 p-2 opacity-20 pointer-events-none">
                  <Lock className="w-20 h-20 rotate-12" />
                </div>
              )}
            </motion.div>
          );
        }) : (
          <div className="text-center py-12">
            <Search className="w-12 h-12 text-gray-800 mx-auto mb-4" />
            <p className="text-gray-600">{lang === 'ps' ? 'هیڅ رپوټ پیدا نه شو' : 'No reports found'}</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}

