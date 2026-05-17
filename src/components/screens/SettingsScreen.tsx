import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronLeft, Moon, Globe, Bell, 
  Shield, Download, LogOut, ChevronRight,
  User, CreditCard, HelpCircle, Mail,
  Sparkles, Key, Check, Copy, AlertCircle, RefreshCw,
  Facebook, MessageCircle, Send, Info, Camera, X, Upload
} from 'lucide-react';
import { logout, db } from '../../lib/firebase';
import { Language, translations } from '../../lib/locales';
import { doc, getDoc, updateDoc, onSnapshot, serverTimestamp, writeBatch, setDoc } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../../lib/firebase';
import { Screen } from '../../types';
import { useToast } from '../ui/Toast';

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
  const [premiumCode, setPremiumCode] = useState('');
  const [inputCode, setInputCode] = useState('');
  const [isActivating, setIsActivating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Profile Edit State
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState(user?.displayName || '');
  const [editPhoto, setEditPhoto] = useState(user?.photoURL || '');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [photoPreview, setPhotoPreview] = useState(user?.photoURL || '');

  useEffect(() => {
    if (!isAdmin) return;
    
    const settingsRef = doc(db, 'settings', 'premium');
    const unsub = onSnapshot(settingsRef, async (docSnap) => {
      if (docSnap.exists()) {
        setPremiumCode(docSnap.data().premiumCode);
      } else {
        // Initialize if doesn't exist
        try {
          await setDoc(settingsRef, {
            premiumCode: generateNewCode(),
            updatedAt: serverTimestamp()
          });
        } catch (err) {
          console.error("Failed to initialize premium settings:", err);
        }
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'settings/premium');
    });

    return unsub;
  }, [isAdmin]);

  const generateNewCode = () => {
    return Math.random().toString(36).substring(2, 10).toUpperCase();
  };

  const refreshCode = async () => {
    if (!isAdmin) return;
    try {
      await updateDoc(doc(db, 'settings', 'premium'), {
        premiumCode: generateNewCode(),
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      console.error("Failed to refresh code:", err);
    }
  };

  const getPremiumViaWhatsApp = () => {
    const phone = "0779705897";
    const text = translations[lang].whatsappMessage;
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const handleActivatePremium = async () => {
    if (!inputCode || isActivating) return;
    setIsActivating(true);
    setError('');
    
    try {
      const settingsRef = doc(db, 'settings', 'premium');
      const userRef = doc(db, 'users', user.uid);
      
      // 1. Get current code
      const settingsSnap = await getDoc(settingsRef);
      if (!settingsSnap.exists() || settingsSnap.data().premiumCode !== inputCode.toUpperCase()) {
        setError(t.invalidCode);
        setIsActivating(false);
        return;
      }

      const batch = writeBatch(db);

      // 2. Update user status
      batch.update(userRef, {
        isPremium: true,
        activationCode: inputCode.toUpperCase(),
        updatedAt: serverTimestamp()
      });

      // 3. Cycle the code (single use)
      batch.update(settingsRef, {
        premiumCode: generateNewCode(),
        oldCode: inputCode.toUpperCase(), // For rule verification
        updatedAt: serverTimestamp()
      });

      await batch.commit();
      setSuccess(true);
      setInputCode('');
      showToast(t.premiumActivatedNotification, 'success');
    } catch (err) {
      console.error("Activation failed:", err);
      handleFirestoreError(err, OperationType.WRITE, 'activation');
    } finally {
      setIsActivating(false);
    }
  };

  const [notifications, setNotifications] = useState(true);

  const colorOptions = [
    { name: 'Emerald', hex: '#10b981' },
    { name: 'Blue', hex: '#3b82f6' },
    { name: 'Purple', hex: '#a855f7' },
    { name: 'Amber', hex: '#f59e0b' },
    { name: 'Rose', hex: '#f43f5e' },
  ];

  const handleLogout = async () => {
    await logout();
    onLogout();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        showToast(lang === 'ps' ? 'فایل ډیر لوی دی (Max 2MB)' : 'File is too large (Max 2MB)', 'error');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setPhotoPreview(base64String);
        setEditPhoto(base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdateProfile = async () => {
    if (!editName.trim() || isUpdatingProfile) return;
    setIsUpdatingProfile(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        displayName: editName,
        photoURL: editPhoto,
        updatedAt: serverTimestamp()
      });
      showToast(t.profileUpdated, 'success');
      setIsEditingProfile(false);
    } catch (err) {
      console.error("Profile update error:", err);
      showToast(lang === 'ps' ? 'غلطي وشوه' : 'Error updating profile', 'error');
    } finally {
      setIsUpdatingProfile(false);
    }
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
        { label: t.cloudSync, icon: Download, value: 'Auto', color: 'text-cyan-500' },
        ...(isAdmin ? [{ label: t.notifications + " (Admin)", icon: Bell, color: 'text-purple-500', onClick: () => onNavigate('admin-notifications') }] : []),
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
    },
    {
      title: lang === 'ps' ? 'ملاتړ' : 'Support',
      items: [
        { 
          label: t.help, 
          icon: HelpCircle, 
          color: 'text-gray-400',
          onClick: () => onNavigate('help')
        },
        { 
          label: t.creator, 
          icon: User, 
          value: t.obaidullah,
          color: 'text-brand',
        },
      ]
    }
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 1.1 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`flex-1 overflow-y-auto px-6 pt-16 pb-32 ${lang === 'ps' ? 'text-right outline-none' : 'text-left'}`}
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
            src={user?.photoURL || `https://ui-avatars.com/api/?name=${user?.displayName || 'User'}&background=10b981&color=fff`} 
            alt="Avatar" 
            className="w-full h-full rounded-[20px] object-cover"
          />
        </div>
        <div className="grow">
          <h4 className="text-lg font-bold font-display">{user?.displayName || 'User'}</h4>
          <p className="text-gray-500 text-sm">{user?.email}</p>
        </div>
        <button 
          onClick={() => {
            setEditName(user?.displayName || '');
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
                
                <div className={`flex items-center justify-between mb-8 ${lang === 'ps' ? 'flex-row-reverse' : ''}`}>
                  <div>
                    <h3 className="text-2xl font-bold font-display text-white">{t.editProfile}</h3>
                    <p className="text-gray-500 text-sm">{t.editProfileSub}</p>
                  </div>
                  <button 
                    onClick={() => setIsEditingProfile(false)}
                    className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center active:scale-95"
                  >
                    <X className="w-5 h-5 text-gray-400" />
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Photo Edit */}
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
                    <span className="text-xs text-gray-500 uppercase font-black tracking-widest">{t.profilePicture}</span>
                  </div>

                  {/* Name Edit */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-400 px-2">{t.displayName}</label>
                    <div className="relative">
                      <input 
                        type="text" 
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="glass-input w-full pl-12"
                        placeholder="Your Name"
                      />
                      <User className={`absolute top-4 w-5 h-5 text-gray-600 ${lang === 'ps' ? 'right-4' : 'left-4'}`} />
                    </div>
                  </div>

                  <button 
                    onClick={handleUpdateProfile}
                    disabled={isUpdatingProfile || !editName.trim()}
                    className="btn-primary w-full py-4 rounded-3xl mt-4 shadow-xl shadow-brand/20 disabled:opacity-50"
                  >
                    {isUpdatingProfile ? (
                      <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    ) : (
                      <Check className="w-5 h-5" />
                    )}
                    <span>{t.saveChanges}</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Premium Activation / Status Section */}
      <section className="mb-10">
        <div className={`glass-card p-6 overflow-hidden relative transition-all duration-500 ${isPremium ? 'border-brand-soft bg-brand-soft shadow-lg' : 'border-brand/30 bg-brand/5'}`}
             style={isPremium ? { boxShadow: '0 0 30px var(--primary-color-glow-strong)' } : {}}
        >
          <AnimatePresence>
            {isPremium && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 pointer-events-none overflow-hidden"
              >
                <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-[radial-gradient(circle,var(--primary-color-glow)_0%,transparent_70%)] animate-pulse" />
              </motion.div>
            )}
          </AnimatePresence>
          
          <div className={`flex items-center gap-4 mb-6 relative z-10 ${lang === 'ps' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${isPremium ? 'bg-brand text-white shadow-lg relative' : 'bg-brand/10 text-brand'}`}
                 style={isPremium ? { boxShadow: '0 10px 15px -3px var(--primary-color-glow-strong)' } : {}}
            >
              <Sparkles className={`w-7 h-7 ${isPremium ? 'animate-spin-slow' : ''}`} />
              {isPremium && (
                <motion.div 
                  layoutId="premium-badge"
                  className="absolute -top-1 -right-1 w-5 h-5 bg-brand rounded-full border-2 border-background flex items-center justify-center"
                >
                  <Check className="w-3 h-3 text-white" />
                </motion.div>
              )}
            </div>
            <div className={lang === 'ps' ? 'text-right' : 'text-left'}>
              <h4 className={`text-xl font-bold font-display ${isPremium ? 'text-brand' : ''}`}>
                {isPremium ? (lang === 'ps' ? 'پریمیم فعال دی' : 'Premium Active') : t.activatePremium}
              </h4>
              <p className="text-gray-500 text-xs">
                {isPremium ? (lang === 'ps' ? 'تاسو ټولو برخو ته بشپړ لاسرسی لرئ' : 'Unlimited access enabled') : t.firstThreeFree}
              </p>
            </div>
          </div>

          {!isPremium && !success && (
            <div className="space-y-4">
              <div className="relative">
                <input 
                  type="text" 
                  value={inputCode}
                  onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                  placeholder={t.enterPremiumCode}
                  className={`glass-input w-full pr-12 font-mono tracking-widest ${lang === 'ps' ? 'text-right' : 'text-left'}`}
                />
                <Key className={`absolute top-4 w-5 h-5 text-gray-600 ${lang === 'ps' ? 'left-4' : 'right-4'}`} />
              </div>
              
              {error && (
                <div className="flex items-center gap-2 text-red-500 text-xs px-2">
                  <AlertCircle className="w-3 h-3" />
                  <span>{error}</span>
                </div>
              )}

              <button 
                onClick={handleActivatePremium}
                disabled={!inputCode || isActivating}
                className="btn-primary w-full shadow-lg disabled:opacity-50"
                style={!isActivating && inputCode ? { boxShadow: '0 10px 15px -3px var(--primary-color-glow-strong)' } : {}}
              >
                {isActivating ? (
                  <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                ) : (
                  <Check className="w-5 h-5" />
                )}
                <span>{t.activatePremium}</span>
              </button>

              <button 
                onClick={getPremiumViaWhatsApp}
                className="btn-glass w-full border-brand-soft text-brand"
              >
                <Sparkles className="w-5 h-5" />
                <span>{t.getCode} (WhatsApp)</span>
              </button>
            </div>
          )}

          {success && (
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-center py-4"
            >
              <div className="w-12 h-12 rounded-full bg-brand-soft flex items-center justify-center mx-auto mb-3">
                <Check className="w-6 h-6 text-brand" />
              </div>
              <p className="text-brand font-bold">{t.premiumSuccess}</p>
            </motion.div>
          )}

          {isAdmin && (
            <div className={`mt-6 pt-6 border-t border-white/10 ${lang === 'ps' ? 'text-right' : 'text-left'}`}>
              <div className={`flex items-center justify-between mb-3 ${lang === 'ps' ? 'flex-row-reverse' : ''}`}>
                <span className="text-xs font-black uppercase tracking-widest text-brand">{t.premiumCode} (Admin)</span>
                <button 
                  onClick={refreshCode}
                  className="p-1 hover:text-white text-gray-500 transition-colors"
                >
                  <RefreshCw className="w-3 h-3" />
                </button>
              </div>
              <div className="flex items-center gap-3 bg-white/5 rounded-2xl p-4 border border-white/5 group">
                <code className="grow font-mono text-xl text-white tracking-widest">{premiumCode || '********'}</code>
                <button 
                  onClick={() => navigator.clipboard.writeText(premiumCode)}
                  className="p-2 bg-white/5 rounded-xl text-gray-500 hover:text-white"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
              <p className="text-[10px] text-gray-600 mt-2">
                This code is for single use. It will change automatically.
              </p>
            </div>
          )}
        </div>
      </section>

      <div className="space-y-8">
        {menuGroups.map((group, i) => (
          <div key={i} className="space-y-4">
            <h5 className={`text-xs font-black uppercase tracking-[0.2em] text-gray-600 ${lang === 'ps' ? 'pr-2' : 'pl-2'}`}>{group.title}</h5>
            {group.custom ? (
              group.custom
            ) : (
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

      <p className="mt-12 text-center text-gray-600 text-[10px] uppercase font-black tracking-widest" dir="ltr">
        SupportHub Version 2.4.0 (Alpha)
      </p>
    </motion.div>
  );
}
