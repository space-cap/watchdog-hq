'use client';

import React, { useEffect, useState } from 'react';

export function ThemeToggle() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const savedTheme = (localStorage.getItem('watchdog_theme') as 'light' | 'dark') || 'light';
    setTheme(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    localStorage.setItem('watchdog_theme', nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
  };

  return (
    <button
      onClick={toggleTheme}
      type="button"
      className="px-3 py-1.5 rounded-full bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors border border-slate-300 dark:border-white/10 text-xs font-bold shadow-sm flex items-center gap-1.5"
      title={theme === 'light' ? '다크 테마로 전환' : '라이트 테마로 전환'}
    >
      {theme === 'light' ? (
        <>
          <span>☀️</span>
          <span>라이트</span>
        </>
      ) : (
        <>
          <span>🌙</span>
          <span>다크</span>
        </>
      )}
    </button>
  );
}
