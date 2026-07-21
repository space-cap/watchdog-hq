'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { APICard, HealthStatusTarget } from '@/components/APICard';
import { RegisterModal } from '@/components/RegisterModal';

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<'server-tab' | 'health-tab'>('health-tab');
  const [targets, setTargets] = useState<HealthStatusTarget[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fetch status list
  const fetchStatus = useCallback(async () => {
    try {
      const response = await fetch('/api/health/status');
      if (!response.ok) return;

      const data: HealthStatusTarget[] = await response.json();
      setTargets(data);

      // Detect admin privilege if at least one URL is not masked
      const hasUnmaskedURL = data.some(
        (item) => item.url && item.url !== 'Hidden (Admin Only)'
      );
      if (hasUnmaskedURL) {
        setIsAdmin(true);
      }
    } catch (error) {
      console.error('Failed to fetch status:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 flex flex-col">
      {/* Top Main Header */}
      <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 border-b border-white/10 gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center text-slate-950 font-black text-xl shadow-lg shadow-cyan-500/20">
            W
          </div>
          <div>
            <h1 className="font-heading text-2xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
              watchdog-hq
              <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-mono">
                v1.0 SaaS
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              분산 모니터링 & 카카오톡 실시간 가용성 관제 센터
            </p>
          </div>
        </div>

        {/* System & Session Indicators */}
        <div className="flex items-center gap-3">
          {isAdmin ? (
            <div className="px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
              <span>🔐</span> 관리자 세션 활성
            </div>
          ) : (
            <div className="px-3 py-1.5 rounded-full text-xs font-medium bg-slate-800/80 text-slate-400 border border-white/5 flex items-center gap-1.5">
              <span>👁️</span> 일반 방문자 (Viewer)
            </div>
          )}

          <div className="px-3 py-1.5 rounded-full text-xs font-medium bg-cyan-950/40 text-cyan-300 border border-cyan-500/20 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            Active Polling
          </div>
        </div>
      </header>

      {/* Tab Navigation & Action Bar */}
      <div className="mt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        {/* Navigation Tabs */}
        <nav className="flex gap-2 p-1 rounded-xl bg-slate-900/60 border border-white/5 backdrop-blur-md">
          <button
            onClick={() => setActiveTab('health-tab')}
            className={`px-4 py-2 rounded-lg text-xs font-medium transition-all flex items-center gap-2 ${
              activeTab === 'health-tab'
                ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-300 border border-cyan-500/30 shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`}
          >
            <span>📡</span> 서비스 API 헬스체크
          </button>
          <button
            onClick={() => setActiveTab('server-tab')}
            className={`px-4 py-2 rounded-lg text-xs font-medium transition-all flex items-center gap-2 ${
              activeTab === 'server-tab'
                ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-300 border border-cyan-500/30 shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`}
          >
            <span>🖥️</span> 서버 자원 모니터링
          </button>
        </nav>

        {/* Action Button (Admin Only) */}
        {isAdmin && activeTab === 'health-tab' && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-950 bg-gradient-to-r from-cyan-400 to-blue-400 hover:from-cyan-300 hover:to-blue-300 transition-all shadow-lg shadow-cyan-500/25 flex items-center gap-1.5"
          >
            <span>➕</span> API 헬스체크 등록
          </button>
        )}
      </div>

      {/* Tab Content Display */}
      <main className="mt-6 flex-1">
        {activeTab === 'health-tab' ? (
          <div>
            {isLoading ? (
              <div className="py-20 text-center text-slate-500 text-sm animate-pulse">
                실시간 가용성 데이터를 동기화하는 중...
              </div>
            ) : targets.length === 0 ? (
              <div className="premium-glass-card p-12 text-center my-8 max-w-lg mx-auto">
                <div className="text-4xl mb-3">📡</div>
                <h3 className="text-slate-200 font-medium text-base mb-1">
                  등록된 헬스체크 대상이 없습니다.
                </h3>
                <p className="text-slate-400 text-xs mb-4">
                  새로운 API 또는 웹사이트 URL을 추가하여 실시간 감시를 시작하세요.
                </p>
                {isAdmin && (
                  <button
                    onClick={() => setIsModalOpen(true)}
                    className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 transition-colors"
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
                    isAdmin={isAdmin}
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
            <h3 className="text-slate-200 font-medium text-base mb-1">
              에이전트 자원 수집 연동 디스플레이
            </h3>
            <p className="text-slate-400 text-xs max-w-md mx-auto">
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

      {/* Page Footer */}
      <footer className="mt-12 pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
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
