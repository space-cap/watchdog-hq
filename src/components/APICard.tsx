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
      className={`theme-card p-5 relative overflow-hidden flex flex-col justify-between ${
        !isOnline && !isPending ? 'border-red-500! bg-red-50!' : ''
      }`}
    >
      {/* Card Header */}
      <div>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="min-w-0 flex-1">
            <h3 className="font-heading text-lg font-black theme-text-main truncate tracking-wide">
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
            {/* Status Badge */}
            <div
              className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold border ${
                isPending
                  ? 'border-slate-300 bg-slate-100 text-slate-700'
                  : isOnline
                  ? 'border-emerald-600/40 bg-emerald-100 text-emerald-900 font-extrabold'
                  : 'border-red-600/40 bg-red-100 text-red-900 font-extrabold'
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
        <div className="space-y-2 mt-4 text-xs border-t border-slate-200 pt-3">
          <div className="flex justify-between items-center theme-text-sub font-semibold">
            <span className="flex items-center gap-1.5">
              <span>⚡</span> 응답 속도
            </span>
            <span className="font-mono font-black theme-text-main text-sm">
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

          {/* History LED Dots */}
          <div className="pt-2">
            <div className="flex justify-between items-center text-[11px] font-semibold theme-text-sub mb-1.5">
              <span>최근 10회 이력 (주기: {target.interval_seconds}초)</span>
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

      {/* Timestamp Footer */}
      <div className="mt-3 pt-2 border-t border-slate-200 text-[10px] font-semibold theme-text-muted text-right">
        {isPending
          ? '첫 체크 대기 중...'
          : target.last_check
          ? `최근 점검: ${new Date(target.last_check).toLocaleTimeString()}`
          : ''}
      </div>
    </article>
  );
};
