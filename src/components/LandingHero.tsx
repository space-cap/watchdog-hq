'use client';

import React from 'react';
import Link from 'next/link';

export function LandingHero() {
  return (
    <div className="space-y-16 pb-16">
      {/* 1. HERO SECTION */}
      <section className="text-center pt-8 sm:pt-16 pb-8 max-w-4xl mx-auto space-y-6">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-100 dark:bg-cyan-500/10 text-cyan-900 dark:text-cyan-300 border border-cyan-300 dark:border-cyan-500/20 text-xs font-bold shadow-sm animate-bounce">
          <span>🚀</span> 한국형 분산 가용성 관제 SaaS 플랫폼
        </div>

        <h1 className="font-heading text-4xl sm:text-6xl font-black tracking-tight theme-text-main leading-tight">
          장애 발생 시 <span className="text-cyan-600 dark:text-cyan-400">3초 만에 알림톡</span> 전송
        </h1>

        <p className="text-base sm:text-lg theme-text-sub font-semibold max-w-2xl mx-auto leading-relaxed">
          이력 차트보다 빠른 장애 알림이 핵심입니다. 전 세계 분산 Go 수집 노드로 API와 웹사이트를 실시간 감시하고, 장애 발생 시 카카오톡과 슬랙으로 즉시 알림을 받으세요.
        </p>

        {/* CTA Button Group */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <Link
            href="/register"
            className="w-full sm:w-auto px-8 py-4 rounded-2xl text-base font-black text-white bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 transition-all shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-2 hover:scale-105"
          >
            <span>⚡</span> 무료로 3초 만에 시작하기
          </Link>

          {/* High Contrast Login Button */}
          <Link
            href="/login"
            className="w-full sm:w-auto px-8 py-4 rounded-2xl text-base font-black text-slate-900 dark:text-white bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border-2 border-slate-300 dark:border-slate-600 shadow-sm transition-all flex items-center justify-center gap-2"
          >
            <span>🔑</span> 기존 계정 로그인
          </Link>
        </div>

        {/* Live Demo Status Preview Badge */}
        <div className="pt-6 flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs font-bold theme-text-muted">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-ping" />
            99.99% 가용성 보장
          </span>
          <span>•</span>
          <span>카카오 알림톡 & 슬랙 100% 연동</span>
          <span>•</span>
          <span>신용카드 없이 시작</span>
        </div>
      </section>

      {/* 2. DEMO SHOWCASE CARD PREVIEW */}
      <section className="max-w-5xl mx-auto">
        <div className="text-center mb-6">
          <h2 className="text-xs font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400 mb-1">
            LIVE PREVIEW
          </h2>
          <p className="font-heading text-2xl font-black theme-text-main">
            전문가를 위해 설계된 실시간 Uptime 카드
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Sample Online Target */}
          <div className="theme-card p-6 relative">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-heading text-lg font-black theme-text-main">
                  결제 게이트웨이 API (Production)
                </h3>
                <span className="text-xs font-mono font-bold text-cyan-600 dark:text-cyan-400">
                  https://api.payment.watchdog.co.kr/health
                </span>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-900 border border-emerald-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-600 animate-ping" />
                ONLINE
              </span>
            </div>
            <div className="space-y-2 text-xs theme-text-sub font-semibold pt-3 border-t border-slate-200 dark:border-white/10">
              <div className="flex justify-between">
                <span>⚡ 응답 속도</span>
                <span className="font-mono font-black theme-text-main text-sm">12ms</span>
              </div>
              <div className="flex justify-between">
                <span>📟 응답 코드</span>
                <span className="font-mono font-black theme-text-main text-sm">200 OK</span>
              </div>
              <div className="pt-2">
                <div className="text-[11px] font-semibold mb-1.5">최근 10회 점검 이력 (5초 주기)</div>
                <div className="flex gap-1">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <div key={i} className="h-3.5 w-2.5 rounded bg-emerald-600 shadow-sm" />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Sample Recovered Target */}
          <div className="theme-card p-6 relative">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-heading text-lg font-black theme-text-main">
                  메인 쇼핑몰 웹 프론트엔드
                </h3>
                <span className="text-xs font-mono font-bold text-cyan-600 dark:text-cyan-400">
                  https://store.watchdog.co.kr
                </span>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-900 border border-emerald-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-600 animate-ping" />
                ONLINE
              </span>
            </div>
            <div className="space-y-2 text-xs theme-text-sub font-semibold pt-3 border-t border-slate-200 dark:border-white/10">
              <div className="flex justify-between">
                <span>⚡ 응답 속도</span>
                <span className="font-mono font-black theme-text-main text-sm">45ms</span>
              </div>
              <div className="flex justify-between">
                <span>📟 응답 코드</span>
                <span className="font-mono font-black theme-text-main text-sm">200 OK</span>
              </div>
              <div className="pt-2">
                <div className="text-[11px] font-semibold mb-1.5">최근 10회 점검 이력 (5초 주기)</div>
                <div className="flex gap-1">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="h-3.5 w-2.5 rounded bg-emerald-600 shadow-sm" />
                  ))}
                  <div className="h-3.5 w-2.5 rounded bg-red-600 shadow-sm" title="장애 감지 및 알림톡 발송" />
                  <div className="h-3.5 w-2.5 rounded bg-emerald-600 shadow-sm" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. KEY FEATURES GRID */}
      <section className="max-w-5xl mx-auto pt-8">
        <div className="text-center mb-10">
          <h2 className="text-xs font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400 mb-1">
            WHY WATCHDOG-HQ
          </h2>
          <p className="font-heading text-3xl font-black theme-text-main">
            왜 전문가들이 watchdog-hq를 선택할까요?
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="theme-card p-6 space-y-3">
            <div className="w-12 h-12 rounded-xl bg-cyan-100 text-cyan-800 flex items-center justify-center text-2xl font-black">
              📲
            </div>
            <h3 className="font-heading text-lg font-black theme-text-main">
              3초 알림톡 & 슬랙 직발송
            </h3>
            <p className="text-xs theme-text-sub font-semibold leading-relaxed">
              장애 발생 순간 3초 만에 담당자 휴대폰 카카오 알림톡과 슬랙 채널로 장애 원인 및 응답 코드가 전달됩니다.
            </p>
          </div>

          <div className="theme-card p-6 space-y-3">
            <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center text-2xl font-black">
              🌐
            </div>
            <h3 className="font-heading text-lg font-black theme-text-main">
              분산 Go 헬스체크 엔진
            </h3>
            <p className="text-xs theme-text-sub font-semibold leading-relaxed">
              초경량 Go 언어로 구축된 독립 수집 노드가 전 세계 분산 위치에서 초당 미세밀리초 단위 가용성을 정밀 측정합니다.
            </p>
          </div>

          <div className="theme-card p-6 space-y-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center text-2xl font-black">
              🔒
            </div>
            <h3 className="font-heading text-lg font-black theme-text-main">
              Zero Trust 보안 아키텍처
            </h3>
            <p className="text-xs theme-text-sub font-semibold leading-relaxed">
              외부 VPS 수집 노드는 DB 접속 정보를 모른 채 토큰 인증 API만 통과하여 동작하므로 DB 유출 위험이 제로입니다.
            </p>
          </div>
        </div>
      </section>

      {/* 4. PRICING TABLE SECTION */}
      <section className="max-w-5xl mx-auto pt-8">
        <div className="text-center mb-10">
          <h2 className="text-xs font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400 mb-1">
            PRICING PLANS
          </h2>
          <p className="font-heading text-3xl font-black theme-text-main">
            합리적인 요금제로 관제를 시작하세요
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Free Plan */}
          <div className="theme-card p-6 flex flex-col justify-between relative border-2 border-slate-300">
            <div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                FREE PLAN
              </span>
              <div className="font-heading text-3xl font-black theme-text-main mt-1 mb-4">
                $0 <span className="text-xs font-semibold theme-text-muted">/ 월</span>
              </div>
              <ul className="space-y-2.5 text-xs font-bold theme-text-sub border-t border-slate-200 dark:border-white/10 pt-4">
                <li className="flex items-center gap-2">✅ 감시 대상 2개</li>
                <li className="flex items-center gap-2">✅ 5분 주기 헬스체크</li>
                <li className="flex items-center gap-2">✅ 슬랙 / 디스코드 웹훅 알림</li>
                <li className="flex items-center gap-2 text-slate-400">❌ 카카오 알림톡 제공 미포함</li>
              </ul>
            </div>
            <Link
              href="/register"
              className="mt-6 w-full py-3 rounded-xl text-xs font-black text-slate-900 dark:text-white bg-white dark:bg-slate-800 hover:bg-slate-100 border border-slate-300 text-center transition-all shadow-sm"
            >
              무료로 시작하기
            </Link>
          </div>

          {/* Starter Plan (Popular) */}
          <div className="theme-card p-6 flex flex-col justify-between relative border-2 border-cyan-500 shadow-xl scale-105 bg-cyan-50 dark:bg-slate-900">
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-cyan-600 text-white text-[10px] font-black uppercase tracking-wider shadow-md">
              MOST POPULAR
            </div>
            <div>
              <span className="text-xs font-bold text-cyan-800 dark:text-cyan-400 uppercase tracking-wider">
                STARTER PLAN
              </span>
              <div className="font-heading text-3xl font-black text-cyan-950 dark:text-white mt-1 mb-4">
                $5 <span className="text-xs font-semibold theme-text-muted">/ 월</span>
              </div>
              <ul className="space-y-2.5 text-xs font-extrabold text-cyan-950 dark:text-slate-100 border-t border-cyan-200 dark:border-white/10 pt-4">
                <li className="flex items-center gap-2">✅ 감시 대상 10개</li>
                <li className="flex items-center gap-2">✅ 1분 주기 헬스체크</li>
                <li className="flex items-center gap-2">✅ 카카오 알림톡 50건 / 월</li>
                <li className="flex items-center gap-2">✅ 슬랙 & 디스코드 웹훅</li>
              </ul>
            </div>
            <Link
              href="/register"
              className="mt-6 w-full py-3 rounded-xl text-xs font-black text-white bg-cyan-600 hover:bg-cyan-700 text-center transition-all shadow-md"
            >
              스타터 시작하기
            </Link>
          </div>

          {/* Professional Plan */}
          <div className="theme-card p-6 flex flex-col justify-between relative border-2 border-slate-300">
            <div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                PROFESSIONAL
              </span>
              <div className="font-heading text-3xl font-black theme-text-main mt-1 mb-4">
                $20 <span className="text-xs font-semibold theme-text-muted">/ 월</span>
              </div>
              <ul className="space-y-2.5 text-xs font-bold theme-text-sub border-t border-slate-200 dark:border-white/10 pt-4">
                <li className="flex items-center gap-2">✅ 감시 대상 50개</li>
                <li className="flex items-center gap-2">✅ 30초 초고속 헬스체크</li>
                <li className="flex items-center gap-2">✅ 카카오 알림톡 300건 / 월</li>
                <li className="flex items-center gap-2">✅ 우선적 기술 지원 (24/7)</li>
              </ul>
            </div>
            <Link
              href="/register"
              className="mt-6 w-full py-3 rounded-xl text-xs font-black text-slate-900 dark:text-white bg-white dark:bg-slate-800 hover:bg-slate-100 border border-slate-300 text-center transition-all shadow-sm"
            >
              프로페셔널 시작하기
            </Link>
          </div>
        </div>
      </section>

      {/* 5. BOTTOM CALL TO ACTION */}
      <section className="theme-card p-10 text-center max-w-4xl mx-auto bg-gradient-to-r from-cyan-600 to-blue-700 text-white rounded-3xl shadow-xl">
        <h2 className="font-heading text-3xl font-black mb-2">
          지금 3초 만에 가용성 관제를 시작하세요!
        </h2>
        <p className="text-sm font-semibold opacity-95 mb-6 max-w-xl mx-auto">
          서버와 API가 예고 없이 다운되는 순간을 방치하지 마세요. watchdog-hq가 가장 빠른 알림으로 서비스를 지켜드립니다.
        </p>
        <Link
          href="/register"
          className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl text-sm font-black text-slate-950 bg-white hover:bg-slate-100 transition-all shadow-lg hover:scale-105"
        >
          <span>🚀</span> 무료 회원가입 후 시작하기
        </Link>
      </section>
    </div>
  );
}
