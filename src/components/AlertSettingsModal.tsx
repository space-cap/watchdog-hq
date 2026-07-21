'use client';

import React, { useState, useEffect, useCallback } from 'react';

export interface AlertChannel {
  id: number;
  channel_type: 'slack' | 'discord' | 'kakao' | 'sms' | string;
  destination: string;
  is_verified: boolean;
  created_at?: string;
}

interface AlertSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AlertSettingsModal: React.FC<AlertSettingsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [channels, setChannels] = useState<AlertChannel[]>([]);
  const [channelType, setChannelType] = useState<'slack' | 'discord' | 'kakao'>('slack');
  const [destination, setDestination] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [testingId, setTestingId] = useState<number | null>(null);

  const handleTestChannel = async (channel: AlertChannel) => {
    setTestingId(channel.id);
    try {
      const res = await fetch('/api/alerts/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel_type: channel.channel_type,
          destination: channel.destination,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || '테스트 발송 실패');
      }

      alert(`🎉 테스트 발송 성공!\n'${channel.destination}' 주소로 메시지가 정상 전달되었습니다.`);
    } catch (err) {
      alert(`⚠️ 테스트 발송 실패: ${(err as Error).message}`);
    } finally {
      setTestingId(null);
    }
  };

  const fetchChannels = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/alerts/channels');
      if (res.ok) {
        const data = await res.json();
        setChannels(data);
      }
    } catch (err) {
      console.error('Failed to fetch alert channels:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchChannels();
    }
  }, [isOpen, fetchChannels]);

  if (!isOpen) return null;

  const handleAddChannel = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!destination.trim()) {
      setError('수신 주소 또는 휴대폰 번호를 입력해 주세요.');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch('/api/alerts/channels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel_type: channelType,
          destination: destination.trim(),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || '알림 수신처 등록 실패');
      }

      setDestination('');
      fetchChannels();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteChannel = async (id: number) => {
    if (!confirm('해당 알림 수신처를 삭제하시겠습니까?')) return;

    try {
      const res = await fetch(`/api/alerts/channels?id=${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        fetchChannels();
      }
    } catch (err) {
      console.error('Failed to delete channel:', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md transition-opacity">
      <div className="premium-glass-card w-full max-w-lg p-6 relative border border-cyan-500/30 shadow-2xl bg-white dark:bg-slate-900/90 text-slate-900 dark:text-slate-100 max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-white/10 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xl">🔔</span>
            <h3 className="font-heading text-lg font-semibold text-slate-900 dark:text-slate-100">
              실시간 장애 알림 채널 설정
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-lg transition-colors p-1"
          >
            ✕
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="overflow-y-auto py-4 space-y-6 flex-1">
          {/* Add Channel Form */}
          <form onSubmit={handleAddChannel} className="space-y-4 bg-slate-50 dark:bg-slate-900/60 p-4 rounded-xl border border-slate-200 dark:border-white/5">
            <h4 className="text-xs font-semibold text-cyan-600 dark:text-cyan-300 uppercase tracking-wider">
              + 신규 알림 수신처 추가
            </h4>

            {error && (
              <div className="p-2.5 rounded-lg bg-red-50 dark:bg-pink-950/60 border border-red-200 dark:border-pink-500/30 text-xs text-red-600 dark:text-pink-300">
                ⚠️ {error}
              </div>
            )}

            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setChannelType('slack')}
                className={`py-2 px-3 rounded-lg text-xs font-medium border transition-colors flex items-center justify-center gap-1.5 ${
                  channelType === 'slack'
                    ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-500/10 text-cyan-700 dark:text-cyan-300'
                    : 'border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5'
                }`}
              >
                Slack 웹훅
              </button>
              <button
                type="button"
                onClick={() => setChannelType('discord')}
                className={`py-2 px-3 rounded-lg text-xs font-medium border transition-colors flex items-center justify-center gap-1.5 ${
                  channelType === 'discord'
                    ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-500/10 text-cyan-700 dark:text-cyan-300'
                    : 'border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5'
                }`}
              >
                Discord 웹훅
              </button>
              <button
                type="button"
                onClick={() => setChannelType('kakao')}
                className={`py-2 px-3 rounded-lg text-xs font-medium border transition-colors flex items-center justify-center gap-1.5 ${
                  channelType === 'kakao'
                    ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-500/10 text-cyan-700 dark:text-cyan-300'
                    : 'border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5'
                }`}
              >
                카카오 알림톡/SMS
              </button>
            </div>

            <div>
              <label className="block text-xs text-slate-700 dark:text-slate-300 mb-1">
                {channelType === 'slack' && 'Slack Incoming Webhook URL'}
                {channelType === 'discord' && 'Discord Webhook URL'}
                {channelType === 'kakao' && '수신 휴대폰 번호 (예: 01012345678)'}
              </label>
              <input
                type={channelType === 'kakao' ? 'tel' : 'url'}
                required
                placeholder={
                  channelType === 'slack'
                    ? 'https://hooks.slack.com/services/...'
                    : channelType === 'discord'
                    ? 'https://discord.com/api/webhooks/...'
                    : '01012345678'
                }
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                className="w-full px-3.5 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-white/10 text-slate-900 dark:text-slate-100 text-xs font-mono focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-950 bg-gradient-to-r from-cyan-400 to-blue-400 hover:from-cyan-300 hover:to-blue-300 transition-all shadow-md shadow-cyan-500/20 disabled:opacity-50"
              >
                {isSubmitting ? '추가 중...' : '알림 수신처 등록'}
              </button>
            </div>
          </form>

          {/* Channels List */}
          <div>
            <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-3">
              현재 활성화된 알림 수신처 목록 ({channels.length}개)
            </h4>

            {isLoading ? (
              <div className="text-xs text-slate-400 py-4 text-center animate-pulse">
                수신처 목록 불러오는 중...
              </div>
            ) : channels.length === 0 ? (
              <div className="text-xs text-slate-400 py-6 text-center border border-dashed border-slate-300 dark:border-white/10 rounded-xl">
                등록된 알림 수신처가 없습니다. 위 입력 폼에서 추가해 주세요.
              </div>
            ) : (
              <div className="space-y-2.5">
                {channels.map((ch) => (
                  <div
                    key={ch.id}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-white/5 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase bg-cyan-500/10 text-cyan-600 dark:text-cyan-300 border border-cyan-500/20">
                          {ch.channel_type}
                        </span>
                        <span className="text-slate-400 text-[10px]">
                          {ch.is_verified ? '활성 (인증됨)' : '대기 중'}
                        </span>
                      </div>
                      <div className="font-mono text-slate-800 dark:text-slate-200 truncate">
                        {ch.destination}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        disabled={testingId === ch.id}
                        onClick={() => handleTestChannel(ch)}
                        className="px-2.5 py-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-700 dark:text-cyan-300 text-[11px] font-medium transition-colors disabled:opacity-50 flex items-center gap-1"
                      >
                        {testingId === ch.id ? (
                          <span>발송 중...</span>
                        ) : (
                          <>
                            <span>🧪</span> 테스트 발송
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => handleDeleteChannel(ch.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-500/10 transition-colors"
                        title="수신처 삭제"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="pt-3 border-t border-slate-200 dark:border-white/10 flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};
