'use client';

import React, { useState, useEffect } from 'react';

export interface HealthStatusTarget {
  id: number;
  name: string;
  url: string;
  interval_seconds: number;
  status: 'ONLINE' | 'OFFLINE' | 'PENDING' | string;
  last_check: string | null;
  last_latency_ms: number;
  last_status_code: number;
  error_message?: string;
  history: number[]; // 1: success, 0: fail
}

interface APICardProps {
  target: HealthStatusTarget;
  isAdmin: boolean;
  onDelete?: (id: number, name: string) => void;
}

export const APICard: React.FC<APICardProps> = ({ target, isAdmin, onDelete }) => {
  const isOnline = target.status === 'ONLINE';
  const isPending = target.status === 'PENDING';

  // Live relative timestamp ticker (e.g. "방금 전", "3초 전", "5초 전")
  const [secondsAgo, setSecondsAgo] = useState<number | null>(null);
  const [isFlashing, setIsFlashing] = useState(false);

  useEffect(() => {
    if (!target.last_check) {
      setSecondsAgo(null);
      return;
    }

    const calcSeconds = () => {
      const checkTime = new Date(target.last_check!).getTime();
      const now = new Date().getTime();
      const diffSec = Math.max(0, Math.floor((now - checkTime) / 1000));
      setSecondsAgo(diffSec);
    };

    calcSeconds();
    const timer = setInterval(calcSeconds, 1000);
    return () => clearInterval(timer);
  }, [target.last_check]);

  // Flash card border when new data arrives
  useEffect(() => {
    if (target.last_check) {
      setIsFlashing(true);
      const timeout = setTimeout(() => setIsFlashing(false), 1200);
      return () => clearTimeout(timeout);
    }
  }, [target.last_check, target.last_latency_ms]);

  // Render 10 LED history dots with live wave pulse on the newest dot
  const renderHistoryDots = () => {
    const totalDots = 10;
    const history = target.history || [];
    const paddingCount = Math.max(0, totalDots - history.length);
    const dots = [];

    // Empty placeholder dots
    for (let i = 0; i < paddingCount; i++) {
      dots.push(
        <div
          key={`empty-${i}`}
          className="h-3.5 w-2.5 rounded bg-slate-200 dark:bg-slate-700 shadow-inner"
          title="이력 없음"
        />
      );
    }

    // Filled status dots
    history.forEach((val, idx) => {
      const isSuccess = val === 1;
      const isLatestDot = idx === history.length - 1;

      dots.push(
        <div key={`hist-${idx}`} className="relative flex items-center justify-center">
          {/* Glowing Ping Ripple Effect for the Latest Dot */}
          {isLatestDot && (
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded opacity-75 ${
                isSuccess ? 'bg-emerald-400' : 'bg-red-400'
              }`}
            />
          )}

          {/* Solid Dot */}
          <div
            className={`h-3.5 w-2.5 rounded relative z-10 transition-all shadow-sm ${
              isSuccess ? 'bg-emerald-600' : 'bg-red-600'
            }`}
            title={
              isSuccess
                ? `${isLatestDot ? '[최신] ' : ''}정상 (성공)`
                : `${isLatestDot ? '[최신] ' : ''}장애 (실패)`
            }
          />
        </div>
      );
    });

    return <div className="flex items-center gap-1.5">{dots}</div>;
  };

  // Format relative timestamp text
  const getRelativeTimeText = () => {
    if (isPending || secondsAgo === null) return '첫 체크 대기 중...';
    if (secondsAgo === 0) return '⚡ 방금 전 점검 완료';
    if (secondsAgo < 60) return `⏱️ ${secondsAgo}초 전 점검 완료`;
    const min = Math.floor(secondsAgo / 60);
    return `⏱️ ${min}분 전 점검 완료`;
  };

  return (
    <article
      className={`theme-card p-5 relative overflow-hidden flex flex-col justify-between transition-all duration-500 ${
        isFlashing ? 'ring-2 ring-cyan-500 shadow-lg scale-[1.01]' : ''
      } ${!isOnline && !isPending ? 'border-red-500! bg-red-50 dark:bg-red-950/20!' : ''}`}
    >
      {/* Card Header */}
      <div>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="min-w-0 flex-1">
            <h3 className="font-heading text-lg font-black theme-text-main truncate tracking-wide flex items-center gap-2">
              {target.name}
            </h3>
            <div className="mt-1 text-xs truncate max-w-[260px]">
              {isAdmin && target.url !== 'Hidden (Admin Only)' ? (
                <a
                  href={target.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cyan-600 hover:underline font-mono font-bold"
                >
                  {target.url}
                </a>
              ) : (
                <span className="theme-text-muted font-mono font-semibold select-none">
                  {target.url}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Status Badge with Live Pulsing Radar Beacon */}
            <div
              className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold border shadow-sm ${
                isPending
                  ? 'border-slate-300 bg-slate-100 text-slate-700'
                  : isOnline
                  ? 'border-emerald-600/40 bg-emerald-100 text-emerald-900 font-extrabold'
                  : 'border-red-600/40 bg-red-100 text-red-900 font-extrabold'
              }`}
            >
              <span className="relative flex h-2 w-2">
                <span
                  className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                    isPending ? 'bg-slate-400' : isOnline ? 'bg-emerald-400' : 'bg-red-400'
                  }`}
                />
                <span
                  className={`relative inline-flex rounded-full h-2 w-2 ${
                    isPending ? 'bg-slate-500' : isOnline ? 'bg-emerald-600' : 'bg-red-600'
                  }`}
                />
              </span>
              <span>{target.status}</span>
            </div>

            {/* Admin Delete Action */}
            {isAdmin && onDelete && (
              <button
                onClick={() => onDelete(target.id, target.name)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                title="대상 삭제"
                type="button"
              >
                🗑️
              </button>
            )}
          </div>
        </div>

        {/* Card Content Metric Info */}
        <div className="space-y-2.5 mt-4 text-xs border-t border-slate-200 dark:border-white/10 pt-3">
          <div className="flex justify-between items-center theme-text-sub font-semibold">
            <span className="flex items-center gap-1.5">
              <span>⚡</span> 응답 속도
            </span>
            <span
              className={`font-mono font-black text-sm transition-all ${
                isFlashing ? 'text-cyan-600 dark:text-cyan-400 scale-110' : 'theme-text-main'
              }`}
            >
              {isPending ? '-' : `${target.last_latency_ms}ms`}
            </span>
          </div>

          <div className="flex justify-between items-center theme-text-sub font-semibold">
            <span className="flex items-center gap-1.5">
              <span>📟</span> 응답 코드
            </span>
            <span className="font-mono font-black theme-text-main text-sm">
              {isPending
                ? '-'
                : target.last_status_code > 0
                ? target.last_status_code
                : 'Err'}
            </span>
          </div>

          {/* History LED Dots with Live Visual Pulse */}
          <div className="pt-2">
            <div className="flex justify-between items-center text-[11px] font-bold theme-text-sub mb-1.5">
              <span>최근 10회 이력 (주기: {target.interval_seconds}초)</span>
              <span className="text-[10px] text-cyan-600 dark:text-cyan-400 font-mono">
                LIVE
              </span>
            </div>
            {renderHistoryDots()}
          </div>
        </div>
      </div>

      {/* Error Box if Offline */}
      {!isOnline && !isPending && target.error_message && (
        <div className="mt-3 p-2.5 rounded-lg bg-red-100 border border-red-300 text-xs font-bold text-red-900 flex items-start gap-1.5">
          <span className="shrink-0">⚠️</span>
          <span className="break-all">{target.error_message}</span>
        </div>
      )}

      {/* Dynamic Relative Ticker Footer */}
      <div className="mt-3 pt-2 border-t border-slate-200 dark:border-white/10 flex items-center justify-between text-[11px] font-bold theme-text-muted">
        <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-mono">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
          ACTIVE
        </span>
        <span className="font-mono">{getRelativeTimeText()}</span>
      </div>
    </article>
  );
};
