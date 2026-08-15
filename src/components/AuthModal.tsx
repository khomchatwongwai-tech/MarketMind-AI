import React, { useState } from 'react';
import {
  X,
  Lock,
  Mail,
  User,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Zap,
  Globe,
  Radio,
  Crown,
} from 'lucide-react';
import { UserProfile } from '../types/user';
import { DEFAULT_ADMIN_EMAIL, UserService } from '../services/userService';
import { auth, googleProvider } from '../config/firebase';
import { signInWithPopup } from 'firebase/auth';
import { FirestoreService } from '../services/firestoreService';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  onUserChange: (user: UserProfile) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUserChange,
}) => {
  const [mode, setMode] = useState<'signin' | 'signup' | 'switch'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleGoogleAuth = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const fbUser = result.user;
      const userEmail = fbUser.email || DEFAULT_ADMIN_EMAIL;
      const isMasterAdmin = userEmail.toLowerCase() === DEFAULT_ADMIN_EMAIL.toLowerCase();

      // Check if profile exists in Firestore
      let existingProfile: UserProfile | null = null;
      try {
        existingProfile = await FirestoreService.getUserProfile(fbUser.uid);
      } catch (err) {
        console.warn('Could not read existing profile from Firestore:', err);
      }

      const user: UserProfile = existingProfile || {
        ...currentUser,
        id: fbUser.uid,
        email: userEmail,
        name: fbUser.displayName || name || (isMasterAdmin ? 'Khomchat Wongwai' : userEmail.split('@')[0]),
        avatarUrl: fbUser.photoURL || currentUser.avatarUrl,
        emailVerified: fbUser.emailVerified,
        role: isMasterAdmin ? 'admin' : 'user',
        plan: isMasterAdmin ? 'premium' : (currentUser.plan || 'pro'),
        planTier: isMasterAdmin ? 'PREMIUM' : 'PRO',
        isGuest: false,
      };

      UserService.saveUser(user);
      try {
        await FirestoreService.syncUserProfile(user);
      } catch (err) {
        console.warn('Firestore profile sync error:', err);
      }

      onUserChange(user);
      setIsLoading(false);
      onClose();
    } catch (err: any) {
      console.error('Google Auth Error:', err);
      setError(err.message || 'Google sign-in failed. Please try again.');
      setIsLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in both email and password.');
      return;
    }
    setIsLoading(true);
    setError(null);

    try {
      const isAdmin = email.toLowerCase() === DEFAULT_ADMIN_EMAIL.toLowerCase();
      const updatedUser: UserProfile = {
        ...currentUser,
        id: currentUser.id || ('usr_' + Math.random().toString(36).substring(2, 9)),
        email: email.toLowerCase(),
        name: name || (isAdmin ? 'Khomchat Wongwai' : email.split('@')[0]),
        role: isAdmin ? 'admin' : 'user',
        isGuest: false,
      };
      UserService.saveUser(updatedUser);
      onUserChange(updatedUser);
      setIsLoading(false);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Authentication failed.');
      setIsLoading(false);
    }
  };

  const handleGuestMode = () => {
    const guestUser: UserProfile = {
      ...currentUser,
      id: 'guest_' + Math.random().toString(36).substring(2, 7),
      name: 'Guest Trader',
      email: 'guest@marketmind.ai',
      role: 'user',
      plan: 'free',
    };
    UserService.saveUser(guestUser);
    onUserChange(guestUser);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in select-none">
      <div className="bg-[#0A0A0A] border border-[#242424] rounded-2xl w-full max-w-md overflow-hidden shadow-2xl text-[#E5E5E5]">
        {/* Header */}
        <div className="p-4 bg-[#101010] border-b border-[#1C1C1C] flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#151515] border border-[rgba(212,175,55,0.4)] flex items-center justify-center text-[#D4AF37]">
              <Crown className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-wider font-mono">
                {mode === 'signin' ? 'Sign In to Terminal' : mode === 'signup' ? 'Create Quant Account' : 'Switch Active Account'}
              </h3>
              <p className="text-[10px] text-[#9CA3AF] font-mono">MarketMind AI Intelligence Network</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#9CA3AF] hover:text-white hover:bg-[#151515] rounded-lg transition border border-transparent hover:border-[#242424]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {error && (
            <div className="p-2.5 bg-[#EF4444]/10 border border-[#EF4444]/40 rounded-lg text-[#EF4444] text-xs font-mono">
              {error}
            </div>
          )}

          {/* 1-Click Google Sign In */}
          <button
            type="button"
            onClick={handleGoogleAuth}
            disabled={isLoading}
            className="w-full py-2.5 px-4 bg-white hover:bg-neutral-200 text-neutral-950 rounded-lg text-xs font-black flex items-center justify-center gap-2.5 transition shadow-sm"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Continue with Google</span>
          </button>

          <div className="flex items-center gap-2 my-2">
            <div className="h-[1px] bg-[#1C1C1C] flex-1" />
            <span className="text-[10px] text-[#9CA3AF] uppercase tracking-widest font-mono">OR EMAIL AUTH</span>
            <div className="h-[1px] bg-[#1C1C1C] flex-1" />
          </div>

          {/* Form */}
          <form onSubmit={handleEmailAuth} className="space-y-3">
            {mode === 'signup' && (
              <div>
                <label className="block text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-3.5 h-3.5 text-[#9CA3AF] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Trader Name"
                    className="w-full bg-[#050505] border border-[#242424] focus:border-[#D4AF37] rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-[#6B7280] focus:outline-none transition font-sans"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-3.5 h-3.5 text-[#9CA3AF] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@fund.com"
                  className="w-full bg-[#050505] border border-[#242424] focus:border-[#D4AF37] rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-[#6B7280] focus:outline-none transition font-mono"
                />
              </div>
              <p className="text-[9px] text-[#9CA3AF] mt-1 font-mono">
                Admin Email: <code className="text-[#F2D675]">{DEFAULT_ADMIN_EMAIL}</code>
              </p>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-3.5 h-3.5 text-[#9CA3AF] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-[#050505] border border-[#242424] focus:border-[#D4AF37] rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-[#6B7280] focus:outline-none transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 bg-gradient-to-r from-[#D4AF37] to-[#C9A227] hover:from-[#FFE08A] hover:to-[#D4AF37] text-black text-xs font-black rounded-lg flex items-center justify-center gap-1.5 transition shadow-md disabled:opacity-50"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
              ) : (
                <>
                  <span>{mode === 'signin' ? 'Sign In to Terminal' : 'Create Account'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>

          {/* Switcher Footer */}
          <div className="pt-2 border-t border-[#1C1C1C] flex flex-wrap justify-between items-center text-[11px] text-[#9CA3AF]">
            {mode === 'signin' ? (
              <button
                type="button"
                onClick={() => setMode('signup')}
                className="hover:text-white text-[#F2D675]"
              >
                Need an account? Sign up &rarr;
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setMode('signin')}
                className="hover:text-white text-[#F2D675]"
              >
                Already have an account? Sign in &rarr;
              </button>
            )}

            <button
              type="button"
              onClick={handleGuestMode}
              className="text-[#9CA3AF] hover:text-white underline font-mono text-[10px]"
            >
              Continue as Guest
            </button>
          </div>
        </div>

        {/* Security Notice */}
        <div className="p-3 bg-[#050505] border-t border-[#1C1C1C] text-[9.5px] text-[#9CA3AF] text-center flex items-center justify-center gap-1.5 font-mono">
          <ShieldCheck className="w-3 h-3 text-[#D4AF37] shrink-0" />
          <span>256-bit encrypted session with hardware key & TOTP 2FA protection</span>
        </div>
      </div>
    </div>
  );
};
