'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { APICard, HealthStatusTarget } from '@/components/APICard';
import { RegisterModal } from '@/components/RegisterModal';
import { AlertSettingsModal } from '@/components/AlertSettingsModal';
import { ThemeToggle } from '@/components/ThemeToggle';

export default function DashboardPage() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<'server-tab' | 'health-tab'>('health-tab');
  const [targets, setTargets] = useState<HealthStatusTarget[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);

  // Fetch status list
  const fetchStatus = useCallback(async () => {
    try {
      const response = await fetch('/api/health/status');
      if (!response.ok) return;

      const data: HealthStatusTarget[] = await response.json();
      setTargets(data);

      // Detect admin privilege if token is active or user session exists
      const hasUnmaskedURL = data.some(
        (item) => item.url && item.url !== 'Hidden (Admin Only)'
      );
      if (hasUnmaskedURL || session?.user) {
        setIsAdmin(true);
      }
    } catch (error) {
      console.error('Failed to fetch status:', error);
    } finally {
      setIsLoading(false);
    }
  }, [session]);

  // Poll every 5 seconds
  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  // Handle Target Delete
  const handleDeleteTarget = async (id: number, name: string) => {
    if (!confirm(`'${name}' 헬스체크 대상을 삭제하시겠습니까?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/health/targets?id=${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('삭제 처리 중 오류가 발생했습니다.');
      }

      fetchStatus();
    } catch (error) {
      alert((error as Error).message);
    }
  };

  const planTier = (session?.user as any)?.planTier || 'Free';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 flex flex-col">
      {/* Top Main Header */}
      <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 border-b border-slate-200 dark:border-white/10 gap-4">
        <div className="flex items-center gap-3">
          <Link href="/" className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-black text-xl shadow-md shadow-cyan-500/20 hover:scale-105 transition-transform">
            W
          </Link>
          <div>
            <h1 className="font-heading text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
              watchdog-hq
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-100 dark:bg-cyan-500/10 text-cyan-800 dark:text-cyan-400 border border-cyan-300 dark:border-cyan-500/20 font-mono font-semibold">
                v1.0 SaaS
              </span>
            </h1>
            <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
              분산 모니터링 & 카카오톡 실시간 가용성 관제 센터
            </p>
          </div>
        </div>

        {/* System & Session Indicators */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Theme Toggle Button */}
          <ThemeToggle />

          {session?.user ? (
            /* Logged in User Profile Bar */
            <div className="flex items-center gap-3 bg-white dark:bg-slate-900/80 p-1.5 pl-4 rounded-full border border-slate-200 dark:border-white/10 shadow-sm">
              <div className="flex flex-col text-left">
                <span className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  {session.user.name || session.user.email}
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-100 dark:bg-cyan-500/20 text-cyan-800 dark:text-cyan-300 border border-cyan-300 dark:border-cyan-500/30 font-mono font-semibold">
                    {planTier}
                  </span>
                </span>
                <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">{session.user.email}</span>
              </div>
              <button
                onClick={() => signOut({ callbackUrl: '/' })}
                className="px-3.5 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-pink-950/40 text-slate-700 dark:text-pink-300 border border-slate-200 dark:border-pink-500/20 text-xs font-semibold transition-colors"
              >
                로그아웃
              </button>
            </div>
          ) : (
            /* Guest / Visitor Login Actions */
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="px-3.5 py-1.5 rounded-full text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900/80 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-300 dark:border-white/10 shadow-sm transition-colors"
              >
                로그인
              </Link>
              <Link
                href="/register"
                className="px-3.5 py-1.5 rounded-full text-xs font-semibold text-white bg-cyan-600 hover:bg-cyan-700 dark:bg-gradient-to-r dark:from-cyan-400 dark:to-blue-400 dark:text-slate-950 transition-all shadow-md"
              >
                회원가입
              </Link>
            </div>
          )}

          <div className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-cyan-950/40 text-emerald-800 dark:text-cyan-300 border border-emerald-300 dark:border-cyan-500/20 flex items-center gap-2 shadow-sm">
            <div className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-cyan-400 animate-ping" />
            Active Polling
          </div>
        </div>
      </header>

      {/* Tab Navigation & Action Bar */}
      <div className="mt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        {/* Navigation Tabs */}
        <nav className="flex gap-2 p-1.5 rounded-xl bg-slate-200/70 dark:bg-slate-900/60 border border-slate-300/80 dark:border-white/5 backdrop-blur-md">
          <button
            onClick={() => setActiveTab('health-tab')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'health-tab'
                ? 'bg-white text-cyan-800 border border-cyan-400/60 shadow-sm dark:bg-gradient-to-r dark:from-cyan-500/20 dark:to-blue-500/20 dark:text-cyan-300 dark:border-cyan-500/30'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-white/50 dark:hover:bg-white/5'
            }`}
          >
            <span>📡</span> 서비스 API 헬스체크
          </button>
          <button
            onClick={() => setActiveTab('server-tab')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'server-tab'
                ? 'bg-white text-cyan-800 border border-cyan-400/60 shadow-sm dark:bg-gradient-to-r dark:from-cyan-500/20 dark:to-blue-500/20 dark:text-cyan-300 dark:border-cyan-500/30'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-white/50 dark:hover:bg-white/5'
            }`}
          >
            <span>🖥️</span> 서버 자원 모니터링
          </button>
        </nav>

        {/* Action Buttons (Admin / Logged-in User Only) */}
        {(isAdmin || session?.user) && activeTab === 'health-tab' && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsAlertModalOpen(true)}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-900/80 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-300 dark:border-white/10 transition-all shadow-sm flex items-center gap-1.5"
            >
              <span>🔔</span> 알림 채널 설정
            </button>
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-cyan-600 hover:bg-cyan-700 dark:bg-gradient-to-r dark:from-cyan-400 dark:to-blue-400 dark:text-slate-950 transition-all shadow-md flex items-center gap-1.5"
            >
              <span>➕</span> API 헬스체크 등록
            </button>
          </div>
        )}
      </div>

      {/* Tab Content Display */}
      <main className="mt-6 flex-1">
        {activeTab === 'health-tab' ? (
          <div>
            {isLoading ? (
              <div className="py-20 text-center text-slate-500 dark:text-slate-400 text-sm font-medium animate-pulse">
                실시간 가용성 데이터를 동기화하는 중...
              </div>
            ) : targets.length === 0 ? (
              <div className="premium-glass-card p-12 text-center my-8 max-w-lg mx-auto">
                <div className="text-4xl mb-3">📡</div>
                <h3 className="text-slate-900 dark:text-slate-200 font-bold text-base mb-1">
                  등록된 헬스체크 대상이 없습니다.
                </h3>
                <p className="text-slate-600 dark:text-slate-400 text-xs mb-4">
                  새로운 API 또는 웹사이트 URL을 추가하여 실시간 감시를 시작하세요.
                </p>
                {(isAdmin || session?.user) && (
                  <button
                    onClick={() => setIsModalOpen(true)}
                    className="px-4 py-2 rounded-lg text-xs font-bold text-white bg-cyan-600 hover:bg-cyan-700 transition-colors"
                  >
                    첫 헬스체크 등록하기
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {targets.map((target) => (
                  <APICard
                    key={target.id}
                    target={target}
                    isAdmin={isAdmin || !!session?.user}
                    onDelete={handleDeleteTarget}
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Server Resources Monitor Tab Placeholder */
          <div className="premium-glass-card p-10 text-center my-6">
            <div className="text-4xl mb-3">🖥️</div>
            <h3 className="text-slate-900 dark:text-slate-200 font-bold text-base mb-1">
              에이전트 자원 수집 연동 디스플레이
            </h3>
            <p className="text-slate-600 dark:text-slate-400 text-xs max-w-md mx-auto">
              분산 등록된 `agent` 수집기로부터 전송받은 CPU, Memory, Disk 메트릭 분석 가시화 탭입니다.
            </p>
          </div>
        )}
      </main>

      {/* Modal for Target Registration */}
      <RegisterModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchStatus}
      />

      {/* Modal for Alert Channel Settings */}
      <AlertSettingsModal
        isOpen={isAlertModalOpen}
        onClose={() => setIsAlertModalOpen(false)}
      />

      {/* Page Footer */}
      <footer className="mt-12 pt-6 border-t border-slate-200 dark:border-white/5 flex flex-col sm:flex-row items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400 gap-2">
        <div>© 2026 watchdog-hq. All rights reserved.</div>
        <div className="flex items-center gap-4">
          <span>한국형 SaaS 관제</span>
          <span>•</span>
          <span>카카오 알림톡 연동</span>
        </div>
      </footer>
    </div>
  );
}
