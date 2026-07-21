'use client';

import React from 'react';

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

  // Render 10 LED history dots
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
          className="history-dot"
          title="이력 없음"
        />
      );
    }

    // Filled status dots
    history.forEach((val, idx) => {
      const isSuccess = val === 1;
      dots.push(
        <div
          key={`hist-${idx}`}
          className={`history-dot ${isSuccess ? 'success' : 'fail'}`}
          title={isSuccess ? '정상 (성공)' : '장애 (실패)'}
        />
      );
    });

    return <div className="flex items-center gap-1">{dots}</div>;
  };

  return (
    <article
      className={`premium-glass-card p-5 relative overflow-hidden flex flex-col justify-between ${
        !isOnline && !isPending ? 'border-red-500/40 bg-red-50 dark:bg-red-500/5' : ''
      }`}
    >
      {/* Card Header */}
      <div>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="min-w-0 flex-1">
            <h3 className="font-heading text-lg font-bold text-slate-900 dark:text-slate-100 truncate tracking-wide">
              {target.name}
            </h3>
            <div className="mt-1 text-xs truncate max-w-[260px]">
              {isAdmin && target.url !== 'Hidden (Admin Only)' ? (
                <a
                  href={target.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cyan-600 dark:text-cyan-400 hover:underline font-mono font-medium"
                >
                  {target.url}
                </a>
              ) : (
                <span className="text-slate-500 dark:text-slate-400 font-mono font-medium select-none">
                  {target.url}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Status Badge */}
            <div
              className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold border ${
                isPending
                  ? 'border-slate-300 dark:border-slate-800 bg-slate-100 dark:bg-slate-900/60 text-slate-700 dark:text-slate-400'
                  : isOnline
                  ? 'border-emerald-500/40 bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300'
                  : 'border-red-500/40 bg-red-100 dark:bg-red-950/40 text-red-800 dark:text-pink-300'
              }`}
            >
              <div
                className={`badge-dot-pulse ${
                  isPending
                    ? 'bg-slate-400'
                    : isOnline
                    ? 'badge-dot-online'
                    : 'badge-dot-offline'
                }`}
              />
              <span>{target.status}</span>
            </div>

            {/* Admin Delete Action */}
            {isAdmin && onDelete && (
              <button
                onClick={() => onDelete(target.id, target.name)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                title="대상 삭제"
                type="button"
              >
                🗑️
              </button>
            )}
          </div>
        </div>

        {/* Card Content Metric Info */}
        <div className="space-y-2 mt-4 text-xs border-t border-slate-200 dark:border-white/5 pt-3">
          <div className="flex justify-between items-center text-slate-600 dark:text-slate-400 font-medium">
            <span className="flex items-center gap-1.5">
              <span>⚡</span> 응답 속도
            </span>
            <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
              {isPending ? '-' : `${target.last_latency_ms}ms`}
            </span>
          </div>

          <div className="flex justify-between items-center text-slate-600 dark:text-slate-400 font-medium">
            <span className="flex items-center gap-1.5">
              <span>📟</span> 응답 코드
            </span>
            <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
              {isPending
                ? '-'
                : target.last_status_code > 0
                ? target.last_status_code
                : 'Err'}
            </span>
          </div>

          {/* History LED Dots */}
          <div className="pt-2">
            <div className="flex justify-between items-center text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1.5">
              <span>최근 10회 이력 (주기: {target.interval_seconds}초)</span>
            </div>
            {renderHistoryDots()}
          </div>
        </div>
      </div>

      {/* Error Box if Offline */}
      {!isOnline && !isPending && target.error_message && (
        <div className="mt-3 p-2.5 rounded-lg bg-red-100 dark:bg-red-500/10 border border-red-300 dark:border-red-500/20 text-xs font-medium text-red-800 dark:text-pink-300 flex items-start gap-1.5">
          <span className="shrink-0">⚠️</span>
          <span className="break-all">{target.error_message}</span>
        </div>
      )}

      {/* Timestamp Footer */}
      <div className="mt-3 pt-2 border-t border-slate-200 dark:border-white/5 text-[10px] font-medium text-slate-500 dark:text-slate-400 text-right">
        {isPending
          ? '첫 체크 대기 중...'
          : target.last_check
          ? `최근 점검: ${new Date(target.last_check).toLocaleTimeString()}`
          : ''}
      </div>
    </article>
  );
};
