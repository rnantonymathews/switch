import React, { useState } from 'react';
import {
  signInWithPopup,
  signInWithRedirect,
  GoogleAuthProvider,
  signInAnonymously,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  User
} from 'firebase/auth';
import { auth } from '../../lib/firebase';
import { ArrowRight, ShieldCheck, Mail, Lock, Sparkles, User as UserIcon } from 'lucide-react';

interface AuthScreenProps {
  onAuthenticated: (user: User) => void;
  triggerToast: (msg: string) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onAuthenticated, triggerToast }) => {
  const [authMode, setAuthMode] = useState<'options' | 'email'>('options');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailMode, setEmailMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Handle Google Sign In
  const handleGoogleSignIn = async () => {
    if (!auth) {
      triggerToast('Firebase Auth is not available.');
      return;
    }
    setIsSubmitting(true);
    setErrorMessage('');
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const result = await signInWithPopup(auth, provider);
      triggerToast(`Welcome, ${result.user.displayName || 'Athlete'}!`);
      onAuthenticated(result.user);
    } catch (err: any) {
      console.warn('Google sign in popup error:', err);
      if (err.code === 'auth/popup-blocked' || err.code === 'auth/cancelled-popup-request') {
        try {
          const provider = new GoogleAuthProvider();
          await signInWithRedirect(auth, provider);
          return;
        } catch (redirErr) {
          console.warn('Google redirect error:', redirErr);
        }
      }
      setErrorMessage(err.message || 'Google sign in could not be completed.');
      setIsSubmitting(false);
    }
  };

  // Handle Guest Mode (Instant Access)
  const handleGuestSignIn = async () => {
    if (!auth) return;
    setIsSubmitting(true);
    setErrorMessage('');
    try {
      const result = await signInAnonymously(auth);
      triggerToast('Entering as Guest athlete.');
      onAuthenticated(result.user);
    } catch (err: any) {
      console.warn('Guest sign in error:', err);
      setErrorMessage(err.message || 'Guest entry failed. Please try again.');
      setIsSubmitting(false);
    }
  };

  // Handle Email / Password
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth || !email || !password) return;
    setIsSubmitting(true);
    setErrorMessage('');
    try {
      if (emailMode === 'signup') {
        const result = await createUserWithEmailAndPassword(auth, email, password);
        triggerToast('Account created successfully!');
        onAuthenticated(result.user);
      } else {
        const result = await signInWithEmailAndPassword(auth, email, password);
        triggerToast('Signed in successfully!');
        onAuthenticated(result.user);
      }
    } catch (err: any) {
      console.warn('Email auth error:', err);
      let msg = 'Authentication failed.';
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
        msg = 'Invalid email or password.';
      } else if (err.code === 'auth/email-already-in-use') {
        msg = 'This email is already registered. Please sign in instead.';
      } else if (err.code === 'auth/weak-password') {
        msg = 'Password should be at least 6 characters.';
      }
      setErrorMessage(msg);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col justify-between p-6 sm:p-8 overflow-y-auto animate-in fade-in">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#141417] border border-[#D4FB45]/30 flex items-center justify-center p-0.5">
            <img src="/icon-192.png" alt="S" className="w-full h-full object-cover rounded-lg" />
          </div>
          <span className="text-sm font-black tracking-widest text-white uppercase font-sans">
            SWITCH
          </span>
        </div>
        <span className="text-[10px] font-mono tracking-widest text-[#D4FB45] bg-[#D4FB45]/10 px-2.5 py-1 rounded-full uppercase font-bold border border-[#D4FB45]/20">
          ATHLETIC OS
        </span>
      </div>

      {/* Main Auth Card */}
      <div className="w-full max-w-sm mx-auto my-auto space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight uppercase">
            {authMode === 'options' ? 'CLAIM YOUR EDGE' : emailMode === 'signup' ? 'CREATE ACCOUNT' : 'WELCOME BACK'}
          </h2>
          <p className="text-xs text-[#8E8E93] max-w-xs mx-auto leading-relaxed">
            {authMode === 'options'
              ? 'Synchronize your workouts, macro targets, and reminders across all your devices.'
              : 'Enter your credentials to access your athletic profile.'}
          </p>
        </div>

        {errorMessage && (
          <div className="p-3 bg-[#FF453A]/10 border border-[#FF453A]/30 rounded-2xl text-xs text-[#FF453A] font-medium text-center">
            {errorMessage}
          </div>
        )}

        {authMode === 'options' ? (
          <div className="space-y-3.5">
            {/* Primary Google Sign In Button */}
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleGoogleSignIn}
              className="w-full py-4 px-5 rounded-2xl bg-[#141417] border border-white/10 hover:border-[#D4FB45]/50 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center space-x-3 transition-all shadow-xl hover:shadow-[#D4FB45]/10 ios-press disabled:opacity-50 cursor-pointer"
            >
              {/* Google G icon */}
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#EA4335"
                  d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.4 9 5 12 5z"
                />
                <path
                  fill="#4285F4"
                  d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.9z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.6 14.8c-.3-.8-.4-1.8-.4-2.8s.1-2 .4-2.8L1.9 6.3C.7 8.7 0 10.3 0 12s.7 3.3 1.9 5.7l3.7-2.9z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2-6.4-4.8L1.9 16.4C3.7 20.1 7.5 23 12 23z"
                />
              </svg>
              <span>{isSubmitting ? 'CONNECTING...' : 'CONTINUE WITH GOOGLE'}</span>
            </button>

            {/* Email Option toggle */}
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => setAuthMode('email')}
              className="w-full py-3.5 px-5 rounded-2xl bg-[#1C1C1E] border border-white/5 hover:border-white/20 text-[#8E8E93] hover:text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center space-x-2 transition-all ios-press cursor-pointer"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Continue with Email</span>
            </button>

            {/* Subtle Guest Mode Option */}
            <div className="pt-2 text-center">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleGuestSignIn}
                className="text-xs text-white/50 hover:text-[#D4FB45] transition font-medium tracking-wide underline underline-offset-4 decoration-white/20 hover:decoration-[#D4FB45] cursor-pointer"
              >
                Explore as Guest (No Account)
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleEmailSubmit} className="space-y-3.5">
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-mono tracking-widest text-[#8E8E93] block">
                Email Address
              </label>
              <div className="relative flex items-center">
                <Mail className="w-4 h-4 text-[#8E8E93] absolute left-3.5 pointer-events-none" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="athlete@example.com"
                  className="w-full bg-[#1C1C1E] border border-white/10 rounded-2xl pl-10 pr-4 py-3 text-xs text-white placeholder-white/20 focus:outline-none focus:border-[#D4FB45]"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] uppercase font-mono tracking-widest text-[#8E8E93] block">
                Password
              </label>
              <div className="relative flex items-center">
                <Lock className="w-4 h-4 text-[#8E8E93] absolute left-3.5 pointer-events-none" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#1C1C1E] border border-white/10 rounded-2xl pl-10 pr-4 py-3 text-xs text-white placeholder-white/20 focus:outline-none focus:border-[#D4FB45]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 rounded-2xl bg-[#D4FB45] text-black font-black text-xs uppercase tracking-wider transition-all shadow-lg shadow-[#D4FB45]/20 ios-press disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting
                ? 'AUTHENTICATING...'
                : emailMode === 'signup'
                ? 'CREATE ACCOUNT & PROCEED'
                : 'SIGN IN & PROCEED'}
            </button>

            <div className="flex items-center justify-between text-xs text-[#8E8E93] pt-2">
              <button
                type="button"
                onClick={() => setAuthMode('options')}
                className="hover:text-white transition"
              >
                ← Back
              </button>
              <button
                type="button"
                onClick={() => setEmailMode(emailMode === 'signin' ? 'signup' : 'signin')}
                className="text-[#D4FB45] font-bold hover:underline"
              >
                {emailMode === 'signin' ? 'Need an account? Sign up' : 'Already have an account? Sign in'}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Bottom Privacy Note */}
      <div className="text-center text-[10px] font-mono text-[#8E8E93]/60 max-w-xs mx-auto">
        <ShieldCheck className="w-3.5 h-3.5 inline mr-1 text-[#D4FB45]" />
        All biometric data and notes are private and encrypted.
      </div>
    </div>
  );
};
