import { useEffect, useState } from 'react';
import { db } from '../lib/firebase';
import { collection, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { useToast } from './ui/Toast';
import { Bell, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function NotificationWatcher({ user, lang }: { user: any, lang: string }) {
  const { showToast } = useToast();
  const [activeNotification, setActiveNotification] = useState<any>(null);

  useEffect(() => {
    if (!user) return;

    const notificationsRef = collection(db, 'notifications');
    const q = query(
      notificationsRef, 
      where('targetId', 'in', ['all', user.uid]),
      orderBy('createdAt', 'desc'),
      limit(1)
    );

    const unsub = onSnapshot(q, (snap) => {
      if (!snap.empty) {
        const data = snap.docs[0].data();
        const now = Date.now();
        const createdAt = data.createdAt?.toMillis() || now;
        const lastSeen = sessionStorage.getItem(`notif_${snap.docs[0].id}`);

        // Show if it's new (last 5 mins) and not seen in this session
        if (data.createdAt && (now - createdAt < 300000) && !lastSeen) {
          sessionStorage.setItem(`notif_${snap.docs[0].id}`, 'true');
          setActiveNotification({ id: snap.docs[0].id, ...data });
          
          // Also show a toast
          showToast(data.title, 'success');
        }
      }
    }, (err) => {
      console.error("Notification listener error:", err);
    });

    return unsub;
  }, [user, lang]);

  return (
    <AnimatePresence>
      {activeNotification && (
        <motion.div 
          initial={{ opacity: 0, y: -50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="fixed top-6 left-6 right-6 z-[200] max-w-sm mx-auto"
        >
          <div className="glass-card p-5 bg-[#0c0c0c]/90 border-brand/30 shadow-2xl shadow-brand/20">
            <div className={`flex items-start gap-4 ${lang === 'ps' ? 'flex-row-reverse text-right' : 'text-left'}`}>
              <div className="w-12 h-12 rounded-2xl bg-brand/10 flex items-center justify-center shrink-0">
                <Bell className="w-6 h-6 text-brand" />
              </div>
              <div className="grow">
                <h5 className="font-bold text-white mb-1">{activeNotification.title}</h5>
                <p className="text-gray-400 text-sm leading-relaxed">{activeNotification.message}</p>
              </div>
              <button 
                onClick={() => setActiveNotification(null)}
                className="p-1 text-gray-600 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <button 
              onClick={() => setActiveNotification(null)}
              className="w-full btn-glass mt-4 py-2 border-brand/20 text-brand text-xs uppercase font-black"
            >
              {lang === 'ps' ? 'پوه شوم' : 'Got it'}
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
