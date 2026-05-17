import { motion } from 'motion/react';
import { ShieldCheck } from 'lucide-react';

export default function SplashScreen({ onComplete }: { onComplete: () => void }) {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onAnimationComplete={() => {
        setTimeout(onComplete, 2000);
      }}
      className="fixed inset-0 flex flex-col items-center justify-center bg-[#050505] z-50"
    >
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", damping: 12, stiffness: 100 }}
        className="w-24 h-24 rounded-3xl bg-brand-soft flex items-center justify-center border border-brand-soft glow-green mb-6"
      >
        <ShieldCheck className="w-12 h-12 text-brand" />
      </motion.div>
      
      <motion.h1 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-3xl font-display font-bold tracking-tight mb-2"
      >
        Support<span className="text-brand">Hub</span>
      </motion.h1>
      
      <motion.p 
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-gray-400 font-light"
      >
        Secure Report Management
      </motion.p>
      
      <div className="absolute bottom-12">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-2 border-brand-soft border-t-brand rounded-full"
        />
      </div>
    </motion.div>
  );
}
