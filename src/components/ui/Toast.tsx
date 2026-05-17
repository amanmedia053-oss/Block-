import { useState, useCallback, createContext, useContext, ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-24 left-6 right-6 z-[200] flex flex-col gap-3 pointer-events-none max-w-md mx-auto">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 50, scale: 0.8, filter: 'blur(10px)' }}
              animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
              exit={{ opacity: 0, scale: 0.8, x: 20, transition: { duration: 0.2 } }}
              layout
              className={`p-1.5 pr-4 rounded-[28px] shadow-2xl flex items-center gap-4 pointer-events-auto border backdrop-blur-xl ${
                toast.type === 'success' ? 'bg-brand/20 border-brand/30 text-white' :
                toast.type === 'error' ? 'bg-red-500/20 border-red-500/30 text-white' :
                'bg-blue-500/20 border-blue-500/30 text-white'
              }`}
              style={{
                boxShadow: toast.type === 'success' ? '0 20px 40px -15px var(--primary-color-glow-strong)' : 'none'
              }}
            >
              <div className={`w-12 h-12 rounded-[22px] flex items-center justify-center shadow-inner ${
                 toast.type === 'success' ? 'bg-brand text-white shadow-brand/40' :
                 toast.type === 'error' ? 'bg-red-500 text-white shadow-red-500/40' :
                 'bg-blue-500 text-white shadow-blue-500/40'
              }`}>
                {toast.type === 'success' && <CheckCircle2 className="w-6 h-6 stroke-[2.5]" />}
                {toast.type === 'error' && <AlertCircle className="w-6 h-6 stroke-[2.5]" />}
                {toast.type === 'info' && <Info className="w-6 h-6 stroke-[2.5]" />}
              </div>
              <div className="grow min-w-0 py-1">
                <p className="text-sm font-bold font-display leading-tight tracking-wide truncate">{toast.message}</p>
                <p className="text-[10px] opacity-60 font-black uppercase tracking-widest mt-0.5">Notification</p>
              </div>
              <button 
                onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
                className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 active:scale-90 transition-all ml-1"
              >
                <X className="w-4 h-4 opacity-50" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within ToastProvider');
  return context;
};
