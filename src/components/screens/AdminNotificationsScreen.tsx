import { motion } from 'motion/react';
import { 
  ChevronLeft, Send, Users, User, 
  Mail, MessageSquare, AlertCircle, Bell,
  CheckCircle2, Loader2, X
} from 'lucide-react';
import { useState } from 'react';
import { Language, translations } from '../../lib/locales';
import { db } from '../../lib/firebase';
import { collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';

export default function AdminNotificationsScreen({ 
  lang, 
  onBack 
}: { 
  lang: Language, 
  onBack: () => void 
}) {
  const t = translations[lang];
  const [targetType, setTargetType] = useState<'all' | 'single'>('all');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [toast, setToast] = useState<{ msg: string, type: 'success' | 'error' } | null>(null);

  const showToast = (msg: string, type: 'success' | 'error') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSend = async () => {
    if (!title.trim() || !message.trim()) return;
    if (targetType === 'single' && !userEmail.trim()) return;

    setIsSending(true);
    try {
      let targetId = 'all';
      
      if (targetType === 'single') {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('email', '==', userEmail.trim()));
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
          showToast(t.noUserFound, 'error');
          setIsSending(false);
          return;
        }
        targetId = querySnapshot.docs[0].id;
      }

      await addDoc(collection(db, 'notifications'), {
        title,
        message,
        targetId,
        read: false,
        createdAt: serverTimestamp(),
        type: 'admin_broadcast'
      });

      showToast(t.notificationSent, 'success');
      setTitle('');
      setMessage('');
      setUserEmail('');
    } catch (err) {
      console.error("Send notification error:", err);
      showToast(lang === 'ps' ? 'تېروتنه وشوه' : 'An error occurred', 'error');
    } finally {
      setIsSending(false);
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
        <h3 className="text-2xl font-bold font-display">{t.sendNotification}</h3>
      </header>

      <div className="space-y-6">
        {/* Target Selection */}
        <div className="grid grid-cols-2 gap-3">
          <button 
            onClick={() => setTargetType('all')}
            className={`flex flex-col items-center justify-center p-4 rounded-3xl border transition-all ${targetType === 'all' ? 'bg-brand/10 border-brand text-brand' : 'bg-white/5 border-white/10 text-gray-500'}`}
          >
            <Users className="w-6 h-6 mb-2" />
            <span className="text-xs font-bold">{t.allUsers}</span>
          </button>
          <button 
            onClick={() => setTargetType('single')}
            className={`flex flex-col items-center justify-center p-4 rounded-3xl border transition-all ${targetType === 'single' ? 'bg-brand/10 border-brand text-brand' : 'bg-white/5 border-white/10 text-gray-500'}`}
          >
            <User className="w-6 h-6 mb-2" />
            <span className="text-xs font-bold">{t.singleUser}</span>
          </button>
        </div>

        {targetType === 'single' && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-2"
          >
            <label className="text-sm font-medium text-gray-400 px-2">{t.userEmail}</label>
            <div className="relative">
              <input 
                type="email" 
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
                className={`glass-input w-full ${lang === 'ps' ? 'pr-12' : 'pl-12'}`}
                placeholder="user@example.com"
              />
              <Mail className={`absolute top-4 w-5 h-5 text-gray-600 ${lang === 'ps' ? 'right-4' : 'left-4'}`} />
            </div>
          </motion.div>
        )}

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-400 px-2">{t.notificationTitle}</label>
          <div className="relative">
            <input 
              type="text" 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={`glass-input w-full ${lang === 'ps' ? 'pr-12' : 'pl-12'}`}
              placeholder="System Update"
            />
            <Bell className={`absolute top-4 w-5 h-5 text-gray-600 ${lang === 'ps' ? 'right-4' : 'left-4'}`} />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-400 px-2">{t.notificationMessage}</label>
          <div className="relative">
            <textarea 
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className={`glass-input w-full min-h-[120px] ${lang === 'ps' ? 'pr-12' : 'pl-12'}`}
              placeholder="Type your message here..."
            />
            <MessageSquare className={`absolute top-4 w-5 h-5 text-gray-600 ${lang === 'ps' ? 'right-4' : 'left-4'}`} />
          </div>
        </div>

        <button 
          onClick={handleSend}
          disabled={isSending || !title.trim() || !message.trim() || (targetType === 'single' && !userEmail.trim())}
          className="btn-primary w-full py-4 rounded-3xl mt-4 shadow-xl shadow-brand/20 disabled:opacity-50"
        >
          {isSending ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Send className="w-5 h-5" />
          )}
          <span>{isSending ? t.sending : t.sendNotification}</span>
        </button>
      </div>

      {/* Toast Notification */}
      {toast && (
        <motion.div 
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 50, opacity: 0 }}
          className={`fixed bottom-24 left-6 right-6 p-4 rounded-2xl flex items-center gap-3 z-50 ${toast.type === 'success' ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-500' : 'bg-red-500/10 border border-red-500/20 text-red-500'}`}
        >
          {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <span className="text-sm font-medium">{toast.msg}</span>
          <button onClick={() => setToast(null)} className="ml-auto p-1">
            <X className="w-4 h-4 opacity-50" />
          </button>
        </motion.div>
      )}
    </motion.div>
  );
}
