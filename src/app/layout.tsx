import type { Metadata } from 'next';
import { Outfit, Inter } from 'next/font/google';
import './globals.css';

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'watchdog-hq | 프리미엄 SaaS 가용성 관제 플랫폼',
  description: '전 세계 분산 노드 기반의 실시간 API 헬스체크 및 카카오톡/슬랙 장애 알림 서비스',
};

import { Providers } from '@/components/Providers';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={`${outfit.variable} ${inter.variable}`}>
      <body className="antialiased selection:bg-cyan-500/30 selection:text-cyan-200">
        <div className="aurora-bg">
          <div className="aurora-blob-1" />
          <div className="aurora-blob-2" />
        </div>
        <Providers>
          <div className="relative z-10 min-h-screen flex flex-col">
            {children}
          </div>
        </Providers>
      </body>
    </html>
  );
}
