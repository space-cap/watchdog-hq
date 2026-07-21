'use client';

import React, { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (res?.error) {
        setError(res.error);
      } else {
        router.push('/');
        router.refresh();
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialLogin = (provider: 'google' | 'github') => {
    signIn(provider, { callbackUrl: '/' });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="theme-card w-full max-w-md p-8 relative shadow-2xl">
        {/* Header Logo */}
        <div className="text-center mb-6">
          <Link href="/" className="inline-flex items-center gap-2 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-600 to-blue-700 flex items-center justify-center text-white font-black text-xl shadow-md">
              W
            </div>
            <span className="font-heading text-2xl font-black tracking-tight theme-text-main">
              watchdog-hq
            </span>
          </Link>
          <p className="text-xs font-semibold theme-text-sub">
            가용성 관제 포털 계정으로 로그인하세요
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-5 p-3 rounded-lg bg-red-100 dark:bg-pink-950/60 border border-red-300 dark:border-pink-500/30 text-xs font-bold text-red-900 dark:text-pink-300 flex items-center gap-2">
            <span>⚠️</span> {error}
          </div>
        )}

        {/* Social Login Buttons */}
        <div className="space-y-2.5 mb-6">
          <button
            onClick={() => handleSocialLogin('google')}
            type="button"
            className="w-full py-2.5 px-4 rounded-xl bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-slate-800 theme-text-main text-xs font-bold flex items-center justify-center gap-3 transition-all shadow-sm"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#EA4335"
                d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.3 9 5 12 5z"
              />
              <path
                fill="#4285F4"
                d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"
              />
              <path
                fill="#FBBC05"
                d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12.3 0 15s.7 5.3 1.9 7.7l3.7-2.9c-.2-.7-.4-1.5-.4-2.3z"
              />
              <path
                fill="#34A853"
                d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.3-6.4-5.2L1.9 16C3.7 19.7 7.5 22.3 12 23z"
              />
            </svg>
            Google 계정으로 계속하기
          </button>

          <button
            onClick={() => handleSocialLogin('github')}
            type="button"
            className="w-full py-2.5 px-4 rounded-xl bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-slate-800 theme-text-main text-xs font-bold flex items-center justify-center gap-3 transition-all shadow-sm"
          >
            <svg className="w-4 h-4 fill-current theme-text-main" viewBox="0 0 24 24">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
            </svg>
            GitHub 계정으로 계속하기
          </button>
        </div>

        {/* Divider */}
        <div className="relative my-6 text-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-300 dark:border-white/10" />
          </div>
          <span className="relative px-3 bg-white dark:bg-[#080d1a] text-[11px] font-bold theme-text-muted uppercase tracking-wider">
            또는 이메일 로그인
          </span>
        </div>

        {/* Credentials Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold theme-text-sub mb-1">
              이메일 주소
            </label>
            <input
              type="email"
              required
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-white/10 theme-text-main text-sm font-semibold focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-bold theme-text-sub mb-1">
              비밀번호
            </label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-white/10 theme-text-main text-sm font-semibold focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 rounded-xl text-xs font-black text-white bg-cyan-600 hover:bg-cyan-700 transition-all shadow-md disabled:opacity-50 mt-2"
          >
            {isLoading ? '로그인 처리 중...' : '이메일 로그인'}
          </button>
        </form>

        {/* Footer Link */}
        <div className="mt-6 pt-4 border-t border-slate-200 dark:border-white/5 text-center text-xs font-semibold theme-text-muted">
          아직 계정이 없으신가요?{' '}
          <Link href="/register" className="text-cyan-600 dark:text-cyan-400 font-bold hover:underline">
            회원가입하기
          </Link>
        </div>
      </div>
    </div>
  );
}
