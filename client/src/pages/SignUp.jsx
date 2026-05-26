import React, { useState } from 'react';
import { useAuth } from '../context/authContext';
import { ArrowLeft, User, Mail, Lock, Loader2, Compass, AlertCircle } from 'lucide-react';

const SignUp = ({ onNavigate }) => {
  const { register, socialLogin, verifyEmail, resendVerificationOtp } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(null); // 'google' | 'github' | null

  // Verification Screen states
  const [verifyEmailMode, setVerifyEmailMode] = useState(false);
  const [verifyEmailAddress, setVerifyEmailAddress] = useState('');
  const [otp, setOtp] = useState('');
  const [verificationLoading, setVerificationLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [infoMessage, setInfoMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !password) {
      setError('Please fill in all fields.');
      return;
    }
    
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setIsLoading(true);
    setError('');
    
    const result = await register(name, email, password);
    setIsLoading(false);
    
    if (result.success) {
      if (result.requireVerification) {
        setVerifyEmailAddress(result.email);
        setVerifyEmailMode(true);
      } else {
        onNavigate('chat');
      }
    } else {
      setError(result.message || 'Registration failed. Try a different email.');
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otp.trim()) {
      setError('Please enter the 6-digit verification code.');
      return;
    }
    setVerificationLoading(true);
    setError('');
    setInfoMessage('');
    const res = await verifyEmail(verifyEmailAddress, otp);
    setVerificationLoading(false);
    if (res.success) {
      onNavigate('chat');
    } else {
      setError(res.message || 'Verification failed. Please check the code.');
    }
  };

  const handleResendOtp = async () => {
    setResendLoading(true);
    setError('');
    setInfoMessage('');
    const res = await resendVerificationOtp(verifyEmailAddress);
    setResendLoading(false);
    if (res.success) {
      setInfoMessage('A new verification code has been successfully sent to your email.');
    } else {
      setError(res.message || 'Failed to resend verification code.');
    }
  };

  const handleSocialLogin = async (provider) => {
    setError('');

    if (provider === 'google') {
      setOauthLoading('google');
      const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "YOUR_GOOGLE_CLIENT_ID";
      const redirectUri = window.location.origin; // http://localhost:5173
      const scope = "openid profile email";
      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=token&scope=${encodeURIComponent(scope)}`;
      window.location.href = authUrl;
      return;
    }

    if (provider === 'github') {
      setOauthLoading('github');
      const clientId = import.meta.env.VITE_GITHUB_CLIENT_ID || "YOUR_GITHUB_CLIENT_ID";
      const redirectUri = window.location.origin; // http://localhost:5173
      const scope = "read:user user:email";
      const authUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}`;
      window.location.href = authUrl;
      return;
    }

    setOauthLoading(provider);

    const result = await socialLogin(provider, {});
    setOauthLoading(null);

    if (result.success) {
      onNavigate('chat');
    } else {
      setError(result.message || `${provider} authentication failed.`);
    }
  };

  if (verifyEmailMode) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center p-6 bg-gradient-to-br from-[#F8FAFC] via-white to-[#E4E4E7] dark:from-[#080808] dark:via-[#0E0E10] dark:to-[#18181B] relative overflow-hidden transition-colors duration-300">
        
        {/* Background Glowing Blobs */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-[#10A37F]/10 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-[#3B82F6]/10 blur-[120px] pointer-events-none" />

        {/* OTP Card */}
        <div className="w-full max-w-md bg-white/70 dark:bg-white/[0.03] backdrop-blur-xl border border-slate-200 dark:border-white/[0.08] shadow-2xl rounded-3xl p-5 xs:p-6 sm:p-8 flex flex-col relative z-10">
          
          {/* Header */}
          <div className="flex flex-col items-center mb-6 text-center">
            <div className="w-12 h-12 rounded-2xl bg-[#10A37F] flex items-center justify-center text-white mb-4 shadow-lg shadow-[#10A37F]/20">
              <Compass size={24} className="animate-spin-slow" />
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Verify Your Email
            </h2>
            <p className="text-sm font-medium text-slate-500 dark:text-[#A1A1AA] mt-2 max-w-xs leading-relaxed">
              We have sent a 6-digit verification code to <span className="font-bold text-[#10A37F] break-all">{verifyEmailAddress}</span>.
            </p>
          </div>

          {/* Error Alert Box */}
          {error && (
            <div className="flex items-center gap-3 p-4 mb-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-sm animate-fade-in">
              <AlertCircle size={18} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Success Info Box */}
          {infoMessage && (
            <div className="flex items-center gap-3 p-4 mb-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-sm animate-fade-in">
              <AlertCircle size={18} className="shrink-0 text-emerald-500" />
              <span>{infoMessage}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleVerifyOtp} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 dark:text-[#A1A1AA] uppercase tracking-wider pl-1 block text-center">
                6-Digit Verification OTP
              </label>
              <input 
                type="text" 
                maxLength={6}
                placeholder="123456"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                className="w-full h-14 text-center text-2xl tracking-[0.4em] font-extrabold bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.05] rounded-2xl text-slate-900 dark:text-white placeholder-slate-300 focus:outline-none focus:border-[#10A37F] focus:ring-2 focus:ring-[#10A37F]/20 transition-all duration-200"
                required
                autoFocus
              />
            </div>

            <button 
              type="submit" 
              disabled={verificationLoading || otp.length < 6}
              className="w-full h-12 bg-[#10A37F] hover:bg-[#0E8F6E] active:scale-[0.98] text-white font-bold rounded-2xl shadow-md shadow-[#10A37F]/20 hover:shadow-lg transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {verificationLoading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>Verifying...</span>
                </>
              ) : (
                <span>Verify Email</span>
              )}
            </button>
          </form>

          {/* Resend Actions */}
          <div className="text-center text-xs mt-6">
            <span className="text-slate-400">Didn't receive the email? </span>
            <button 
              onClick={handleResendOtp}
              disabled={resendLoading}
              className="text-[#10A37F] hover:underline font-bold transition-all cursor-pointer disabled:opacity-50"
            >
              {resendLoading ? "Sending..." : "Resend code"}
            </button>
          </div>

          <button
            onClick={() => {
              setVerifyEmailMode(false);
              setError('');
              setInfoMessage('');
              setOtp('');
            }}
            className="mt-6 text-xs font-semibold text-slate-400 hover:text-slate-900 dark:hover:text-white text-center hover:underline cursor-pointer"
          >
            Back to Sign Up
          </button>

        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-6 bg-gradient-to-br from-[#F8FAFC] via-white to-[#E4E4E7] dark:from-[#080808] dark:via-[#0E0E10] dark:to-[#18181B] relative overflow-hidden transition-colors duration-300">
      
      {/* Background Glowing Blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-[#10A37F]/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-[#3B82F6]/10 blur-[120px] pointer-events-none" />

      {/* Main Card Container */}
      <div className="w-full max-w-md bg-white/70 dark:bg-white/[0.03] backdrop-blur-xl border border-slate-200 dark:border-white/[0.08] shadow-2xl rounded-3xl p-5 xs:p-6 sm:p-8 flex flex-col relative z-10 transition-transform duration-300">
        
        {/* Back Button */}
        <button 
          onClick={() => onNavigate('chat')}
          className="self-start flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-[#A1A1AA] hover:text-slate-900 dark:hover:text-white mb-4 sm:mb-6 p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-all duration-200"
        >
          <ArrowLeft size={16} />
          <span>Back to Chat</span>
        </button>

        {/* Brand Header */}
        <div className="flex flex-col items-center mb-5 sm:mb-8">
          <div className="w-12 h-12 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center mb-3 shadow-md border border-slate-800 dark:border-white hover:scale-105 transition-transform duration-300">
            <Compass size={24} className="animate-spin-slow" />
          </div>
          <h2 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Create Account
          </h2>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1 text-center">
            Get started for free in seconds
          </p>
        </div>

        {/* Error Alert Box */}
        {error && (
          <div className="flex items-center gap-3 p-4 mb-5 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-sm animate-fade-in">
            <AlertCircle size={18} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Signup Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 dark:text-[#A1A1AA] uppercase tracking-wider pl-1">
              Full Name
            </label>
            <div className="relative flex items-center">
              <User className="absolute left-4 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Aryan Verma"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full h-12 pl-12 pr-4 bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.05] rounded-2xl text-[15px] text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#10A37F] focus:ring-2 focus:ring-[#10A37F]/20 transition-all duration-200"
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 dark:text-[#A1A1AA] uppercase tracking-wider pl-1">
              Email Address
            </label>
            <div className="relative flex items-center">
              <Mail className="absolute left-4 text-slate-400" size={18} />
              <input 
                type="email" 
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-12 pl-12 pr-4 bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.05] rounded-2xl text-[15px] text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#10A37F] focus:ring-2 focus:ring-[#10A37F]/20 transition-all duration-200"
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 dark:text-[#A1A1AA] uppercase tracking-wider pl-1">
              Password
            </label>
            <div className="relative flex items-center">
              <Lock className="absolute left-4 text-slate-400" size={18} />
              <input 
                type="password" 
                placeholder="Minimum 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-12 pl-12 pr-4 bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.05] rounded-2xl text-[15px] text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#10A37F] focus:ring-2 focus:ring-[#10A37F]/20 transition-all duration-200"
                required
              />
            </div>
          </div>

          <button 
            type="submit"
            disabled={isLoading || oauthLoading !== null}
            className="w-full h-12 bg-[#10A37F] hover:bg-[#0E8F6E] active:scale-[0.98] text-white rounded-2xl transition-all duration-200 font-bold flex items-center justify-center gap-2 shadow-lg shadow-[#10A37F]/25 disabled:opacity-50 disabled:pointer-events-none mt-2 cursor-pointer"
          >
            {isLoading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                <span>Creating Account...</span>
              </>
            ) : (
              <span>Create Account</span>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center my-6">
          <div className="flex-1 h-[1px] bg-slate-200 dark:bg-white/10" />
          <span className="text-xs font-bold text-slate-400 px-4 uppercase tracking-widest">or sign up with</span>
          <div className="flex-1 h-[1px] bg-slate-200 dark:bg-white/10" />
        </div>

        {/* Social Authentication */}
        <div className="grid grid-cols-2 gap-4">
          <button 
            onClick={() => handleSocialLogin('google')}
            disabled={isLoading || oauthLoading !== null}
            className="h-12 border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.02] hover:bg-slate-50 dark:hover:bg-white/5 active:scale-[0.98] rounded-2xl transition-all duration-200 font-semibold text-[14px] text-slate-800 dark:text-white flex items-center justify-center gap-2 cursor-pointer shadow-sm"
          >
            {oauthLoading === 'google' ? (
              <Loader2 size={16} className="animate-spin text-[#10A37F]" />
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#EA4335" d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.2-5.122 4.2A5.51 5.51 0 0 1 8.5 13c0-3.08 2.5-5.5 5.5-5.5 1.5 0 2.85.575 3.875 1.525l3.07-3.07C18.97 4.07 16.65 3 14 3 8.48 3 4 7.48 4 13s4.48 10 10 10c5.52 0 10-4.48 10-10 0-.69-.06-1.35-.18-2.015H12.24Z" />
              </svg>
            )}
            <span>Google</span>
          </button>

          <button 
            onClick={() => handleSocialLogin('github')}
            disabled={isLoading || oauthLoading !== null}
            className="h-12 border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.02] hover:bg-slate-50 dark:hover:bg-white/5 active:scale-[0.98] rounded-2xl transition-all duration-200 font-semibold text-[14px] text-slate-800 dark:text-white flex items-center justify-center gap-2 cursor-pointer shadow-sm"
          >
            {oauthLoading === 'github' ? (
              <Loader2 size={16} className="animate-spin text-[#10A37F]" />
            ) : (
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
              </svg>
            )}
            <span>GitHub</span>
          </button>
        </div>

        {/* Footer Link */}
        <p className="text-center text-sm font-semibold text-slate-500 dark:text-slate-400 mt-8">
          Already have an account?{' '}
          <button 
            onClick={() => onNavigate('signin')}
            className="text-[#10A37F] font-bold hover:underline"
          >
            Log In
          </button>
        </p>

      </div>
    </div>
  );
};

export default SignUp;
