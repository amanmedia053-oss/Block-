import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronLeft, Moon, Globe, Bell, 
  Shield, Download, LogOut, ChevronRight,
  User, CreditCard, HelpCircle, Mail,
  Sparkles, Key, Check, Copy, AlertCircle, RefreshCw,
  Facebook, MessageCircle, Send, Info, Camera, X, Terminal
} from 'lucide-react';
import { Language, translations } from '../../lib/locales';
import { Screen } from '../../types';
import { useToast } from '../ui/Toast';
import { generateActivationCode, isValidActivationCode } from '../../lib/activation';

export default function SettingsScreen({ 
  user, 
  lang,
  isPremium,
  isAdmin,
  setLang,
  isDarkMode,
  setIsDarkMode,
  primaryColor,
  setPrimaryColor,
  onBack, 
  onLogout,
  onNavigate
}: { 
  user: any, 
  lang: Language,
  isPremium: boolean,
  isAdmin: boolean,
  setLang: (l: Language) => void,
  isDarkMode: boolean,
  setIsDarkMode: (d: boolean) => void,
  primaryColor: string,
  setPrimaryColor: (c: string) => void,
  onBack: () => void, 
  onLogout: () => void,
  onNavigate: (s: Screen) => void
}) {
  const t = translations[lang];
  const { showToast } = useToast();
  const [inputCode, setInputCode] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Profile Edit State
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState(user?.name || '');
  const [editPhoto, setEditPhoto] = useState(user?.photoURL || '');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [photoPreview, setPhotoPreview] = useState(user?.photoURL || '');

  // Admin Section State
  const [adminTargetId, setAdminTargetId] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [showAdminAuth, setShowAdminAuth] = useState(false);
  const [adminKey, setAdminKey] = useState('');
  const [adminKeyError, setAdminKeyError] = useState(false);

  const handleActivatePremium = () => {
    if (!inputCode) return;
    setError('');
    
    if (isValidActivationCode(user.deviceId, inputCode)) {
      localStorage.setItem(`premium_${user.deviceId}`, 'true');
      setSuccess(true);
      setInputCode('');
      showToast(t.premiumActivated, 'success');
      // Trigger a reload to update app state (optional, or rely on parent state)
      setTimeout(() => window.location.reload(), 1500);
    } else {
      setError(t.invalidCode);
    }
  };

  const handleGenerateCode = () => {
    if (!adminTargetId) return;
    const code = generateActivationCode(adminTargetId);
    setGeneratedCode(code);
  };

  const [notifications, setNotifications] = useState(true);

  const colorOptions = [
    { name: 'Emerald', hex: '#10b981' },
    { name: 'Blue', hex: '#3b82f6' },
    { name: 'Purple', hex: '#a855f7' },
    { name: 'Amber', hex: '#f59e0b' },
    { name: 'Rose', hex: '#f43f5e' },
  ];

  const handleLogout = () => {
    localStorage.removeItem('reporter_app_user');
    onLogout();
    // Try to close the app (works in some mobile wrappers)
    try {
      (window as any).navigator?.app?.exitApp?.();
      window.close();
    } catch (e) {
      console.log("Exit app failed");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setPhotoPreview(base64String);
        setEditPhoto(base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdateProfile = () => {
    if (!editName.trim()) return;
    setIsUpdatingProfile(true);
    const updatedUser = { ...user, name: editName, photoURL: editPhoto };
    localStorage.setItem('reporter_app_user', JSON.stringify(updatedUser));
    showToast(t.profileUpdated, 'success');
    setIsEditingProfile(false);
    setIsUpdatingProfile(false);
    // Reload to apply
    setTimeout(() => window.location.reload(), 500);
  };

  const menuGroups = [
    {
      title: lang === 'ps' ? 'غوراوي' : 'Preferences',
      items: [
        { 
          label: t.darkMode, 
          icon: Moon, 
          value: isDarkMode ? (lang === 'ps' ? 'فعال' : 'On') : (lang === 'ps' ? 'غیرفعال' : 'Off'), 
          color: 'text-purple-500',
          onClick: () => setIsDarkMode(!isDarkMode)
        },
        { 
          label: t.language, 
          icon: Globe, 
          value: lang === 'ps' ? 'پښتو' : 'English', 
          color: 'text-orange-500',
          onClick: () => setLang(lang === 'ps' ? 'en' : 'ps')
        },
        { 
          label: t.notifications, 
          icon: Bell, 
          value: notifications ? (lang === 'ps' ? 'ټول' : 'All') : (lang === 'ps' ? 'هیڅ' : 'None'), 
          color: 'text-brand',
          onClick: () => setNotifications(!notifications)
        },
      ]
    },
    {
      title: lang === 'ps' ? 'رنګونه' : 'Colors',
      custom: (
        <div className="flex gap-4 p-4 glass-card overflow-x-auto no-scrollbar">
          {colorOptions.map((color) => (
            <button
              key={color.hex}
              onClick={() => setPrimaryColor(color.hex)}
              className={`w-10 h-10 rounded-full flex-shrink-0 transition-all ${primaryColor === color.hex ? 'ring-4 ring-offset-2 ring-offset-[#09090b] ring-white scale-110' : 'opacity-60 hover:opacity-100'}`}
              style={{ backgroundColor: color.hex }}
            />
          ))}
        </div>
      )
    },
    {
      title: lang === 'ps' ? 'امنیت' : 'Security',
      items: [
        { label: t.policy, icon: Shield, color: 'text-brand', onClick: () => onNavigate('policy') },
        { 
          label: t.adminPanel, 
          icon: Terminal, 
          color: 'text-red-500',
          onClick: () => setShowAdminAuth(true)
        },
      ]
    },
    {
      title: t.socialContact,
      items: [
        { 
          label: t.facebook, 
          icon: Facebook, 
          color: 'text-blue-600',
          onClick: () => window.open('https://facebook.com/obaidullah.ghafari', '_blank')
        },
        { 
          label: t.whatsapp, 
          icon: MessageCircle, 
          color: 'text-green-500',
          onClick: () => window.open('https://wa.me/0779705897', '_blank')
        },
        { 
          label: t.telegram, 
          icon: Send, 
          color: 'text-sky-500',
          onClick: () => window.open('https://t.me/Obaidullah_Ghafari', '_blank')
        },
        { 
          label: t.email, 
          icon: Mail, 
          color: 'text-red-400',
          onClick: () => window.open('mailto:obaidullahghafari@gmail.com', '_blank')
        },
      ]
    }
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 1.1 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`flex-1 min-h-0 overflow-y-auto px-6 pt-16 pb-32 ${lang === 'ps' ? 'text-right outline-none' : 'text-left'}`}
      dir={lang === 'ps' ? 'rtl' : 'ltr'}
      style={{ '--primary-color': primaryColor } as React.CSSProperties}
    >
      <header className={`flex items-center gap-4 mb-10 ${lang === 'ps' ? 'flex-row-reverse' : ''}`}>
        <button onClick={onBack} className="p-2 -ml-2 rounded-xl active:bg-white/5">
          <ChevronLeft className={`w-6 h-6 ${lang === 'ps' ? 'rotate-180' : ''}`} />
        </button>
        <h3 className="text-2xl font-bold font-display">{t.settings}</h3>
      </header>

      <section className={`glass-card p-6 mb-10 flex items-center gap-4 ${lang === 'ps' ? 'flex-row-reverse' : ''}`}>
        <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 p-1">
          <img 
            src={user?.photoURL || `https://ui-avatars.com/api/?name=${user?.name || 'User'}&background=10b981&color=fff`} 
            alt="Avatar" 
            className="w-full h-full rounded-[20px] object-cover"
          />
        </div>
        <div className="grow">
          <h4 className="text-lg font-bold font-display">{user?.name || 'User'}</h4>
          <p className="text-gray-500 text-xs font-mono">{user?.deviceId}</p>
        </div>
        <button 
          onClick={() => {
            setEditName(user?.name || '');
            setEditPhoto(user?.photoURL || '');
            setPhotoPreview(user?.photoURL || '');
            setIsEditingProfile(true);
          }}
          className="p-3 bg-white/5 border border-white/10 rounded-2xl active:scale-90 transition-transform hover:bg-white/10"
        >
          <User className="w-5 h-5 text-gray-400" />
        </button>
      </section>

      {/* Profile Edit Modal */}
      <AnimatePresence>
        {isEditingProfile && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
              onClick={() => setIsEditingProfile(false)}
            />
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="fixed bottom-0 left-0 right-0 z-[110] max-w-lg mx-auto"
            >
              <div className={`glass-card rounded-t-[40px] bg-[#0c0c0c] p-8 pb-12 ${lang === 'ps' ? 'text-right' : 'text-left'}`} dir={lang === 'ps' ? 'rtl' : 'ltr'}>
                <div className="w-12 h-1.5 bg-white/10 rounded-full mx-auto mb-8" />
                <h3 className="text-2xl font-bold font-display text-white mb-8">{t.editProfile}</h3>

                <div className="space-y-6">
                  <div className="flex flex-col items-center gap-4">
                    <div className="relative group">
                      <div className="w-24 h-24 rounded-[32px] bg-white/5 border border-white/10 p-1 overflow-hidden">
                        <img 
                          src={photoPreview || `https://ui-avatars.com/api/?name=${editName || 'U'}&background=10b981&color=fff`} 
                          className="w-full h-full rounded-[28px] object-cover"
                          alt="Preview"
                        />
                      </div>
                      <label 
                        htmlFor="photo-upload"
                        className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-brand flex items-center justify-center cursor-pointer shadow-lg active:scale-90 transition-transform"
                      >
                        <Camera className="w-4 h-4 text-white" />
                      </label>
                      <input 
                        id="photo-upload"
                        type="file" 
                        accept="image/*"
                        className="hidden"
                        onChange={handleFileChange}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-400 px-2">{t.displayName}</label>
                    <input 
                      type="text" 
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="glass-input w-full"
                      placeholder="Your Name"
                    />
                  </div>

                  <button 
                    onClick={handleUpdateProfile}
                    className="btn-primary w-full py-4 rounded-3xl mt-4 shadow-xl shadow-brand/20"
                  >
                    <Check className="w-5 h-5" />
                    <span>{t.saveChanges}</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Admin Auth Modal */}
      <AnimatePresence>
        {showAdminAuth && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
              onClick={() => setShowAdminAuth(false)}
            />
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="fixed bottom-0 left-0 right-0 z-[110] max-w-lg mx-auto"
            >
              <div className={`glass-card rounded-t-[40px] bg-[#0c0c0c] p-8 pb-12 ${lang === 'ps' ? 'text-right' : 'text-left'}`} dir={lang === 'ps' ? 'rtl' : 'ltr'}>
                <div className="w-12 h-1.5 bg-white/10 rounded-full mx-auto mb-8" />
                <h3 className="text-2xl font-bold font-display text-white mb-8">Admin Access</h3>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-400 px-2">Enter Secret Key</label>
                    <input 
                      type="password" 
                      value={adminKey}
                      onChange={(e) => {
                        setAdminKey(e.target.value);
                        setAdminKeyError(false);
                      }}
                      className={`glass-input w-full ${adminKeyError ? 'border-red-500' : ''}`}
                      placeholder="****"
                    />
                    {adminKeyError && <p className="text-red-500 text-xs px-2">Invalid Secret Key</p>}
                  </div>

                  <button 
                    onClick={() => {
                      if (adminKey === "6312") {
                        localStorage.setItem('admin_mode', 'true');
                        window.location.reload();
                      } else {
                        setAdminKeyError(true);
                      }
                    }}
                    className="btn-primary w-full py-4 rounded-3xl mt-4 shadow-xl shadow-brand/20 bg-red-600 border-red-600"
                  >
                    <Terminal className="w-5 h-5" />
                    <span>Verify Admin</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Premium Activation Section */}
      <section className="mb-10">
        <div className={`glass-card p-6 overflow-hidden relative transition-all duration-500 ${isPremium ? 'border-brand-soft bg-brand-soft shadow-lg' : 'border-brand/30 bg-brand/5'}`}
             style={isPremium ? { boxShadow: '0 0 30px var(--primary-color-glow-strong)' } : {}}
        >
          <div className={`flex items-center gap-4 mb-6 relative z-10 ${lang === 'ps' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${isPremium ? 'bg-brand text-white shadow-lg relative' : 'bg-brand/10 text-brand'}`}>
              <Sparkles className="w-7 h-7" />
            </div>
            <div className={lang === 'ps' ? 'text-right' : 'text-left'}>
              <h4 className={`text-xl font-bold font-display ${isPremium ? 'text-brand' : ''}`}>
                {isPremium ? (lang === 'ps' ? 'پریمیم فعال دی' : 'Premium Active') : t.activatePremium}
              </h4>
              <p className="text-gray-400 text-xs">{t.deviceId}: {user.deviceId}</p>
            </div>
          </div>

          {!isPremium && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 bg-white/5 p-3 rounded-xl border border-white/5">
                <span className="text-xs font-mono grow">{user.deviceId}</span>
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(user.deviceId);
                    showToast(t.copyId, 'success');
                  }}
                  className="p-2 bg-white/5 rounded-lg active:scale-95"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>

              <div className="relative">
                <input 
                  type="text" 
                  value={inputCode}
                  onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                  placeholder={t.activationCode}
                  className="glass-input w-full pr-12 font-mono tracking-widest"
                />
                <Key className={`absolute top-4 w-5 h-5 text-gray-600 ${lang === 'ps' ? 'left-4' : 'right-4'}`} />
              </div>
              
              {error && <p className="text-red-500 text-xs px-2">{error}</p>}

              <button 
                onClick={handleActivatePremium}
                disabled={!inputCode}
                className="btn-primary w-full shadow-lg"
              >
                <Check className="w-5 h-5" />
                <span>{t.activatePremium}</span>
              </button>
            </div>
          )}

          {isPremium && (
            <div className="py-2">
              <div className="flex items-center gap-2 text-brand font-bold">
                <CheckCircle className="w-5 h-5" />
                <span>{t.premiumActivated}</span>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Admin Panel (Hidden) */}
      {isAdmin && (
        <section className="mb-10 p-6 glass-card border-red-500/20 bg-red-500/5">
          <div className={`flex items-center gap-3 mb-6 ${lang === 'ps' ? 'flex-row-reverse' : ''}`}>
            <Terminal className="w-6 h-6 text-red-500" />
            <h4 className="text-xl font-bold font-display text-red-500">{t.adminPanel}</h4>
          </div>
          <div className="space-y-4">
            <input 
              type="text" 
              placeholder="Target Device ID"
              value={adminTargetId}
              onChange={(e) => setAdminTargetId(e.target.value.toUpperCase())}
              className="glass-input w-full border-red-500/10"
            />
            <button 
              onClick={handleGenerateCode}
              className="w-full py-4 bg-red-500 text-white rounded-2xl font-bold active:scale-95 transition-transform"
            >
              {t.generateCode}
            </button>
            {generatedCode && (
              <div className="p-4 bg-black/40 rounded-xl border border-red-500/20 text-center">
                <p className="text-xs text-gray-500 mb-1">{t.activationCode}:</p>
                <code className="text-2xl font-mono text-red-500 tracking-widest">{generatedCode}</code>
                <button 
                  onClick={() => navigator.clipboard.writeText(generatedCode)}
                  className="mt-3 block mx-auto p-2 text-xs text-gray-400 hover:text-white"
                >
                  {t.copyId}
                </button>
              </div>
            )}
            <button 
               onClick={() => {
                 localStorage.removeItem('admin_mode');
                 window.location.reload();
               }}
               className="w-full text-xs text-red-400 opacity-50 hover:opacity-100 mt-4"
            >
              Exit Admin Mode
            </button>
          </div>
        </section>
      )}

      <div className="space-y-8">
        {menuGroups.map((group, i) => (
          <div key={i} className="space-y-4">
            <h5 className={`text-xs font-black uppercase tracking-[0.2em] text-gray-600 ${lang === 'ps' ? 'pr-2' : 'pl-2'}`}>{group.title}</h5>
            {group.custom ? group.custom : (
              <div className="glass-card overflow-hidden">
                {group.items?.map((item, j) => (
                  <button 
                    key={j} 
                    onClick={item.onClick}
                    className={`w-full p-4 flex items-center justify-between active:bg-white/5 transition-colors ${j !== group.items.length - 1 ? 'border-b border-white/5' : ''} ${lang === 'ps' ? 'flex-row-reverse' : ''}`}
                  >
                    <div className={`flex items-center gap-4 ${lang === 'ps' ? 'flex-row-reverse' : ''}`}>
                      <div className={`w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center ${item.color}`}>
                        <item.icon className="w-5 h-5" />
                      </div>
                      <span className="font-semibold text-gray-300">{item.label}</span>
                    </div>
                    <div className={`flex items-center gap-2 ${lang === 'ps' ? 'flex-row-reverse' : ''}`}>
                      {item.value && <span className="text-sm font-bold text-gray-500 uppercase tracking-tighter">{item.value}</span>}
                      <ChevronRight className={`w-4 h-4 text-gray-700 ${lang === 'ps' ? 'rotate-180' : ''}`} />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}

        <button 
          onClick={handleLogout}
          className="w-full glass-card p-4 flex items-center justify-center gap-3 text-red-500 font-bold border-red-500/10 active:bg-red-500/5 mt-4"
        >
          <LogOut className={`w-5 h-5 ${lang === 'ps' ? 'rotate-180' : ''}`} />
          <span>{t.logout}</span>
        </button>
      </div>
    </motion.div>
  );
}

function CheckCircle(props: any) {
  return (
    <svg 
      {...props} 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}
