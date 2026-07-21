'use client';

import React, { useState } from 'react';

interface RegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const RegisterModal: React.FC<RegisterModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [interval, setInterval] = useState(5);
  const [timeout, setTimeout] = useState(2);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/health/targets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          url,
          interval_seconds: interval,
          timeout_seconds: timeout,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || '헬스체크 대상 등록 실패');
      }

      // Reset form
      setName('');
      setUrl('');
      setInterval(5);
      setTimeout(2);
      onSuccess();
      onClose();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md transition-opacity">
      <div className="premium-glass-card w-full max-w-md p-6 relative border border-cyan-500/30 shadow-2xl bg-white dark:bg-slate-900/90 text-slate-900 dark:text-slate-100">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-white/10">
          <div className="flex items-center gap-2">
            <span className="text-xl">➕</span>
            <h3 className="font-heading text-lg font-semibold text-slate-900 dark:text-slate-100">
              신규 API 헬스체크 등록
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-lg transition-colors p-1"
          >
            ✕
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mt-4 p-3 rounded-lg bg-red-50 dark:bg-pink-950/60 border border-red-200 dark:border-pink-500/30 text-xs text-red-600 dark:text-pink-300">
            ⚠️ {error}
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              서비스 명칭 *
            </label>
            <input
              type="text"
              required
              placeholder="예: 메인 쇼핑몰 API"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-white/10 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              대상 URL (HTTP / HTTPS) *
            </label>
            <input
              type="url"
              required
              placeholder="https://example.com/api/health"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-white/10 text-slate-900 dark:text-slate-100 text-sm font-mono focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                점검 주기 (초) *
              </label>
              <select
                value={interval}
                onChange={(e) => setInterval(Number(e.target.value))}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-white/10 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:border-cyan-500 transition-colors"
              >
                <option value={5}>5초 (Free 기본)</option>
                <option value={10}>10초</option>
                <option value={30}>30초</option>
                <option value={60}>60초 (1분)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                타임아웃 (초) *
              </label>
              <select
                value={timeout}
                onChange={(e) => setTimeout(Number(e.target.value))}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-white/10 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:border-cyan-500 transition-colors"
              >
                <option value={2}>2초 (권장)</option>
                <option value={5}>5초</option>
                <option value={10}>10초</option>
              </select>
            </div>
          </div>

          {/* Modal Footer Buttons */}
          <div className="pt-4 border-t border-slate-200 dark:border-white/10 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
            >
              취소
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-950 bg-gradient-to-r from-cyan-400 to-blue-400 hover:from-cyan-300 hover:to-blue-300 transition-all shadow-md shadow-cyan-500/20 disabled:opacity-50"
            >
              {isSubmitting ? '등록 중...' : '헬스체크 추가'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
