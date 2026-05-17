import { useState } from 'react';
import { motion } from 'motion/react';
import { Mail, Github, Chrome, LogIn, UserCircle } from 'lucide-react';
import { signInWithGoogle } from '../../lib/firebase';

export default function LoginScreen({ onLogin }: { onLogin: (user: any) => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      const result = await signInWithGoogle();
      onLogin(result.user);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex-1 flex flex-col p-8 pt-20"
    >
      <div className="mb-12">
        <h2 className="text-4xl font-display font-bold mb-3">Welcome Back</h2>
        <p className="text-gray-400">Sign in to continue your secure reporting session.</p>
      </div>

      <div className="space-y-4 mb-12">
        <div className="relative">
          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input 
            type="email" 
            placeholder="Email Address" 
            className="glass-input w-full pl-12"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="relative">
          <LogIn className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input 
            type="password" 
            placeholder="Password" 
            className="glass-input w-full pl-12"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <button className="btn-primary w-full">
          Sign In
        </button>
      </div>

      <div className="relative mb-12">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-white/10"></div>
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-[#050505] px-4 text-gray-500 font-medium tracking-widest">Or continue with</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <button 
          onClick={handleGoogleLogin}
          disabled={isLoading}
          className="btn-glass flex items-center justify-center gap-2"
        >
          <Chrome className="w-5 h-5 text-brand" />
          <span>Google</span>
        </button>
        <button 
          onClick={() => onLogin({ uid: 'guest', email: 'guest@example.com', displayName: 'Guest' })}
          className="btn-glass flex items-center justify-center gap-2"
        >
          <UserCircle className="w-5 h-5 text-gray-400" />
          <span>Guest</span>
        </button>
      </div>

      <p className="mt-auto text-center text-gray-500 text-sm">
        Don't have an account? <span className="text-brand font-semibold cursor-pointer">Sign Up</span>
      </p>
    </motion.div>
  );
}
