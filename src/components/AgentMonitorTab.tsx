'use client';

import React, { useState, useEffect, useCallback } from 'react';

interface DiskInfo {
  path: string;
  total_gb: number;
  used_gb: number;
  percent: number;
}

interface AgentStatus {
  agent_id: string;
  cpu_percent: number;
  mem_total_gb: number;
  mem_used_gb: number;
  mem_percent: number;
  disks: DiskInfo[];
  timestamp: string;
  status: 'ONLINE' | 'OFFLINE';
}

function GaugeRing({
  percent,
  label,
  value,
  color,
}: {
  percent: number;
  label: string;
  value: string;
  color: string;
}) {
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percent / 100) * circumference;

  const getColorClass = (pct: number) => {
    if (pct >= 90) return 'stroke-red-500';
    if (pct >= 75) return 'stroke-amber-500';
    return color;
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-28 h-28">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          {/* Track */}
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            className="text-slate-200 dark:text-slate-700"
          />
          {/* Progress */}
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className={`${getColorClass(percent)} transition-all duration-700 ease-out`}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-mono font-black text-lg theme-text-main">
            {percent.toFixed(1)}%
          </span>
        </div>
      </div>
      <div className="text-center">
        <div className="text-xs font-black theme-text-main">{label}</div>
        <div className="text-[11px] font-mono theme-text-muted">{value}</div>
      </div>
    </div>
  );
}

function DiskBar({ disk }: { disk: DiskInfo }) {
  const getBarColor = (pct: number) => {
    if (pct >= 90) return 'bg-red-500';
    if (pct >= 75) return 'bg-amber-500';
    return 'bg-emerald-500';
  };

  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center text-[11px] font-semibold">
        <span className="theme-text-sub font-mono truncate max-w-[120px]" title={disk.path}>
          {disk.path}
        </span>
        <span className="theme-text-muted font-mono">
          {disk.used_gb.toFixed(1)}GB / {disk.total_gb.toFixed(1)}GB
        </span>
      </div>
      <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${getBarColor(disk.percent)}`}
          style={{ width: `${Math.min(100, disk.percent)}%` }}
        />
      </div>
      <div className="text-right text-[10px] font-mono theme-text-muted">{disk.percent.toFixed(1)}%</div>
    </div>
  );
}

function AgentCard({ agent }: { agent: AgentStatus }) {
  const isOnline = agent.status === 'ONLINE';
  const lastSeen = agent.timestamp ? new Date(agent.timestamp) : null;

  const getRelativeTime = () => {
    if (!lastSeen) return '알 수 없음';
    const diff = Math.floor((Date.now() - lastSeen.getTime()) / 1000);
    if (diff < 5) return '방금 전';
    if (diff < 60) return `${diff}초 전`;
    const min = Math.floor(diff / 60);
    return `${min}분 전`;
  };

  return (
    <div
      className={`theme-card p-6 relative overflow-hidden flex flex-col gap-5${
        !isOnline ? ' border-red-500! bg-red-50! dark:bg-red-950/10!' : ''
      }`}
    >
      {/* Card Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0 ${
              isOnline ? 'bg-emerald-100' : 'bg-red-100'
            }`}
          >
            🖥️
          </div>
          <div className="min-w-0">
            <h3 className="font-heading text-base font-black theme-text-main truncate">
              {agent.agent_id}
            </h3>
            <div className="text-[11px] font-mono theme-text-muted">
              {getRelativeTime()} 업데이트
            </div>
          </div>
        </div>

        <div
          className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold border shrink-0 ${
            isOnline
              ? 'border-emerald-600/40 bg-emerald-100 text-emerald-900'
              : 'border-red-600/40 bg-red-100 text-red-900'
          }`}
        >
          <span className="relative flex h-2 w-2">
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                isOnline ? 'bg-emerald-400' : 'bg-red-400'
              }`}
            />
            <span
              className={`relative inline-flex rounded-full h-2 w-2 ${
                isOnline ? 'bg-emerald-600' : 'bg-red-600'
              }`}
            />
          </span>
          {agent.status}
        </div>
      </div>

      {/* Metrics Gauges */}
      <div className="flex items-center justify-around gap-3 py-2">
        <GaugeRing
          percent={agent.cpu_percent}
          label="CPU"
          value={`${agent.cpu_percent.toFixed(1)}%`}
          color="stroke-cyan-500"
        />
        <GaugeRing
          percent={agent.mem_percent}
          label="Memory"
          value={`${agent.mem_used_gb.toFixed(1)} / ${agent.mem_total_gb.toFixed(1)} GB`}
          color="stroke-blue-500"
        />
      </div>

      {/* Disk Usage */}
      {agent.disks && agent.disks.length > 0 && (
        <div className="space-y-3 pt-3 border-t border-slate-200 dark:border-white/10">
          <div className="text-xs font-bold theme-text-sub flex items-center gap-1.5">
            <span>💾</span> 디스크 사용량
          </div>
          {agent.disks.map((disk, i) => (
            <DiskBar key={i} disk={disk} />
          ))}
        </div>
      )}
    </div>
  );
}

export function AgentMonitorTab() {
  const [agents, setAgents] = useState<AgentStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isGoServerOnline, setIsGoServerOnline] = useState(true);

  const fetchAgents = useCallback(async () => {
    try {
      const res = await fetch('/api/agents/status');
      if (!res.ok) {
        setIsGoServerOnline(false);
        return;
      }
      const data: AgentStatus[] = await res.json();
      setAgents(data);
      setLastUpdated(new Date());
      setIsGoServerOnline(true);
    } catch {
      setIsGoServerOnline(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAgents();
    const interval = setInterval(fetchAgents, 10000); // Poll every 10s
    return () => clearInterval(interval);
  }, [fetchAgents]);

  if (isLoading) {
    return (
      <div className="py-20 text-center theme-text-muted text-sm font-bold animate-pulse">
        에이전트 메트릭 데이터 동기화 중...
      </div>
    );
  }

  if (!isGoServerOnline) {
    return (
      <div className="theme-card p-10 text-center my-6 max-w-lg mx-auto">
        <div className="text-4xl mb-3">⚠️</div>
        <h3 className="theme-text-main font-black text-base mb-1">
          Go 모니터링 서버에 연결할 수 없습니다
        </h3>
        <p className="theme-text-sub text-xs mb-4 font-semibold leading-relaxed">
          서버 자원 모니터링은{' '}
          <code className="font-mono bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
            server.exe
          </code>{' '}
          가 실행 중이어야 합니다.
        </p>
        <div className="p-3 rounded-lg bg-slate-100 dark:bg-slate-800 text-left text-xs font-mono theme-text-muted">
          <div className="font-bold theme-text-sub mb-1">실행 명령어:</div>
          <code>.\bin\server.exe -config server\config.json</code>
        </div>
      </div>
    );
  }

  if (agents.length === 0) {
    return (
      <div className="theme-card p-10 text-center my-6 max-w-lg mx-auto">
        <div className="text-4xl mb-3">🖥️</div>
        <h3 className="theme-text-main font-black text-base mb-1">
          등록된 에이전트가 없습니다
        </h3>
        <p className="theme-text-sub text-xs mb-4 font-semibold leading-relaxed">
          서버에{' '}
          <code className="font-mono bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
            agent.exe
          </code>
          를 설치하면 CPU, 메모리, 디스크 사용량이 자동으로 수집됩니다.
        </p>
      </div>
    );
  }

  const onlineCount = agents.filter((a) => a.status === 'ONLINE').length;
  const offlineCount = agents.length - onlineCount;

  return (
    <div className="space-y-5">
      {/* Summary Bar */}
      <div className="flex flex-wrap items-center gap-3 text-xs font-bold">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-400">
          <span className="w-2 h-2 rounded-full bg-emerald-600 animate-ping" />
          {onlineCount}개 에이전트 온라인
        </div>
        {offlineCount > 0 && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-100 text-red-900 border border-red-400">
            <span className="w-2 h-2 rounded-full bg-red-600" />
            {offlineCount}개 오프라인
          </div>
        )}
        {lastUpdated && (
          <span className="theme-text-muted font-mono ml-auto">
            마지막 갱신: {lastUpdated.toLocaleTimeString('ko-KR')}
          </span>
        )}
      </div>

      {/* Agent Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {agents.map((agent) => (
          <AgentCard key={agent.agent_id} agent={agent} />
        ))}
      </div>
    </div>
  );
}
