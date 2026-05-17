import { motion, AnimatePresence } from 'motion/react';
import { AlertCircle, X, Check } from 'lucide-react';
import { Language } from '../../lib/locales';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  lang: Language;
}

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText,
  cancelText,
  lang
}: ConfirmModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-sm glass-card p-6 overflow-hidden"
            dir={lang === 'ps' ? 'rtl' : 'ltr'}
          >
            <div className={`flex items-start gap-4 mb-6 ${lang === 'ps' ? 'flex-row-reverse text-right' : 'text-left'}`}>
              <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center shrink-0">
                <AlertCircle className="w-6 h-6 text-red-500" />
              </div>
              <div className="grow">
                <h4 className="text-xl font-bold font-display mb-1">{title}</h4>
                <p className="text-gray-500 text-sm leading-relaxed">{message}</p>
              </div>
            </div>

            <div className={`flex gap-3 ${lang === 'ps' ? 'flex-row-reverse' : ''}`}>
              <button
                onClick={onClose}
                className="btn-glass grow py-2.5 text-sm"
              >
                {cancelText || (lang === 'ps' ? 'لغوه' : 'Cancel')}
              </button>
              <button
                onClick={() => {
                  onConfirm();
                  onClose();
                }}
                className="btn-primary grow py-2.5 text-sm bg-red-500 hover:bg-red-600 shadow-red-500/20"
              >
                {confirmText || (lang === 'ps' ? 'هو، پاک یې کړه' : 'Delete')}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
