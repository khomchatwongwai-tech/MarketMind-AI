import React, { useState } from 'react';
import {
  X,
  Lock,
  Mail,
  User,
  ShieldCheck,
  ArrowRight,
  KeyRound,
  CheckCircle2,
} from 'lucide-react';
import { UserProfile } from '../types/user';
import { UserService } from '../services/userService';
import { auth, googleProvider } from '../config/firebase';
import {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile,
} from 'firebase/auth';
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
  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleGoogleAuth = async () => {
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const fbUser = result.user;
      const userEmail = fbUser.email || '';

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
        name: fbUser.displayName || name || userEmail.split('@')[0],
        avatarUrl: fbUser.photoURL || currentUser.avatarUrl,
        emailVerified: fbUser.emailVerified,
        role: 'user',
        plan: currentUser.plan || 'free',
        planTier: (currentUser.planTier || 'FREE') as any,
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
    if (!email) {
      setError('Please provide a valid email address.');
      return;
    }
    if (mode !== 'forgot' && (!password || password.length < 6)) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      if (mode === 'signup') {
        const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
        const fbUser = cred.user;

        if (name.trim()) {
          await updateProfile(fbUser, { displayName: name.trim() });
        }

        // Send verification email
        try {
          await sendEmailVerification(fbUser);
        } catch (verErr) {
          console.warn('Verification email notice:', verErr);
        }

        const newUser: UserProfile = {
          ...currentUser,
          id: fbUser.uid,
          email: fbUser.email || email.trim(),
          name: name.trim() || email.split('@')[0],
          emailVerified: fbUser.emailVerified,
          role: 'user',
          plan: 'free',
          planTier: 'FREE',
          isGuest: false,
        };

        UserService.saveUser(newUser);
        try {
          await FirestoreService.syncUserProfile(newUser);
        } catch (syncErr) {
          console.warn('Firestore sync error on signup:', syncErr);
        }

        onUserChange(newUser);
        setIsLoading(false);
        onClose();
      } else if (mode === 'signin') {
        const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
        const fbUser = cred.user;

        let profile: UserProfile | null = null;
        try {
          profile = await FirestoreService.getUserProfile(fbUser.uid);
        } catch (pErr) {
          console.warn('Profile fetch error:', pErr);
        }

        const loggedInUser: UserProfile = profile || {
          ...currentUser,
          id: fbUser.uid,
          email: fbUser.email || email.trim(),
          name: fbUser.displayName || email.split('@')[0],
          emailVerified: fbUser.emailVerified,
          role: 'user',
          plan: 'free',
          planTier: 'FREE',
          isGuest: false,
        };

        UserService.saveUser(loggedInUser);
        onUserChange(loggedInUser);
        setIsLoading(false);
        onClose();
      } else if (mode === 'forgot') {
        await sendPasswordResetEmail(auth, email.trim());
        setSuccessMessage('Password reset email has been sent. Please check your inbox.');
        setIsLoading(false);
      }
    } catch (err: any) {
      console.error('Firebase Auth Error:', err);
      let msg = err.message || 'Authentication failed.';
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        msg = 'Invalid email or password.';
      } else if (err.code === 'auth/email-already-in-use') {
        msg = 'An account with this email address already exists. Please sign in.';
      } else if (err.code === 'auth/weak-password') {
        msg = 'Password is too weak. Please use at least 6 characters.';
      }
      setError(msg);
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
      planTier: 'FREE',
      isGuest: true,
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
            <img
              src="/marketmind-icon.png"
              alt="MarketMind AI"
              className="w-11 h-11 rounded-xl object-cover shadow-[0_0_14px_rgba(212,175,55,0.2)]"
            />
            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-wider font-mono">
                {mode === 'signin' ? 'Sign In to Terminal' : mode === 'signup' ? 'Create Quant Account' : 'Reset Password'}
              </h3>
              <p className="text-[10px] text-[#9CA3AF] font-mono">Firebase Authoritative Authentication</p>
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

          {successMessage && (
            <div className="p-2.5 bg-[#22C55E]/10 border border-[#22C55E]/40 rounded-lg text-[#22C55E] text-xs font-mono flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* 1-Click Google Sign In */}
          {mode !== 'forgot' && (
            <>
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
            </>
          )}

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
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@fund.com"
                  className="w-full bg-[#050505] border border-[#242424] focus:border-[#D4AF37] rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-[#6B7280] focus:outline-none transition font-mono"
                />
              </div>
            </div>

            {mode !== 'forgot' && (
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider">
                    Password
                  </label>
                  {mode === 'signin' && (
                    <button
                      type="button"
                      onClick={() => setMode('forgot')}
                      className="text-[10px] text-[#F2D675] hover:underline font-mono"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="w-3.5 h-3.5 text-[#9CA3AF] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full bg-[#050505] border border-[#242424] focus:border-[#D4AF37] rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-[#6B7280] focus:outline-none transition"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 bg-gradient-to-r from-[#D4AF37] to-[#C9A227] hover:from-[#FFE08A] hover:to-[#D4AF37] text-black text-xs font-black rounded-lg flex items-center justify-center gap-1.5 transition shadow-md disabled:opacity-50"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
              ) : (
                <>
                  <span>
                    {mode === 'signin'
                      ? 'Sign In to Terminal'
                      : mode === 'signup'
                      ? 'Create Account'
                      : 'Send Reset Link'}
                  </span>
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
            ) : mode === 'signup' ? (
              <button
                type="button"
                onClick={() => setMode('signin')}
                className="hover:text-white text-[#F2D675]"
              >
                Already have an account? Sign in &rarr;
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setMode('signin')}
                className="hover:text-white text-[#F2D675]"
              >
                Back to Sign In &rarr;
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

        {/* Security Notice with truthful claim */}
        <div className="p-3 bg-[#050505] border-t border-[#1C1C1C] text-[9.5px] text-[#9CA3AF] text-center flex items-center justify-center gap-1.5 font-mono">
          <ShieldCheck className="w-3 h-3 text-[#D4AF37] shrink-0" />
          <span>MarketMind uses industry-standard managed Firebase Authentication and encrypted transport</span>
        </div>
      </div>
    </div>
  );
};
